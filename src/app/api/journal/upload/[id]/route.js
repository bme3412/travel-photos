// POST /api/journal/upload/[id] — upload photos/videos for a trip from the
// browser. Processes each file (HEIC→JPG + resize via sharp / H.264 transcode
// + poster via ffmpeg), reads EXIF GPS+date for photos, uploads to S3, and
// appends photos.json / videos.json. Local development only.
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import exifr from 'exifr';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { clearFileCache } from '../../../../utils/fileHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Note: no maxDuration override — this route only runs locally (it 403s in
// production), and Vercel Pro caps maxDuration at 300.

const exec = promisify(execFile);
const DATA = path.join(process.cwd(), 'src', 'data');
const SLUG = /^[a-z0-9-]+$/;
const IMAGE_EXT = /\.(jpe?g|png|heic|heif|webp|tiff?)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;
const VIDEO_EXT = /\.(mov|mp4|m4v|webm|avi)$/i;

const BUCKET = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';
const s3url = (key) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
const s3 =
  BUCKET &&
  new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

const slug = (name) =>
  name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const writeJson = (f, d) => fs.writeFileSync(path.join(DATA, f), `${JSON.stringify(d, null, 2)}\n`);
const round6 = (n) => Number(Number(n).toFixed(6));
const put = (key, body, contentType) =>
  s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));

export async function POST(request, { params }) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Uploads only work in local development.' }, { status: 403 });
  }
  const { id } = await params;
  if (!SLUG.test(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });
  if (!BUCKET) return Response.json({ error: 'AWS_BUCKET_NAME is not set in .env' }, { status: 500 });

  const form = await request.formData();
  const files = form.getAll('files').filter((f) => f && typeof f.arrayBuffer === 'function');
  if (!files.length) return Response.json({ error: 'No files' }, { status: 400 });

  const fallbackLat = parseFloat(form.get('lat'));
  const fallbackLng = parseFloat(form.get('lng'));
  const locationName = String(form.get('location') || '').trim() || null;

  const photosData = readJson('photos.json');
  let videosData;
  try {
    videosData = readJson('videos.json');
  } catch {
    videosData = { videos: [] };
  }

  const albumPhotos = photosData.photos.filter((p) => p.albumId === id);
  const existingCoord = albumPhotos.find((p) => p.coordinates)?.coordinates || null;
  let maxNum = albumPhotos.reduce(
    (m, p) => Math.max(m, parseInt(String(p.id).replace(id, ''), 10) || 0),
    0
  );

  const added = [];
  const errors = [];
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'studio-upload-'));

  for (const file of files) {
    const orig = file.name || 'file';
    try {
      const buf = Buffer.from(await file.arrayBuffer());

      if (IMAGE_EXT.test(orig)) {
        let gps = null;
        let dateCreated = null;
        try {
          gps = await exifr.gps(buf);
        } catch {
          /* no gps */
        }
        try {
          const ex = await exifr.parse(buf, ['DateTimeOriginal', 'CreateDate']);
          const when = ex?.DateTimeOriginal || ex?.CreateDate;
          if (when) dateCreated = new Date(when).toISOString().slice(0, 10);
        } catch {
          /* no date */
        }

        const coord =
          gps && gps.latitude != null
            ? { lat: gps.latitude, lng: gps.longitude }
            : Number.isFinite(fallbackLat) && Number.isFinite(fallbackLng)
              ? { lat: fallbackLat, lng: fallbackLng }
              : existingCoord;
        if (!coord) {
          errors.push(`${orig}: no GPS in the photo and no fallback location set`);
          continue;
        }

        const jpgInput = HEIC_EXT.test(orig)
          ? Buffer.from(await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.9 }))
          : buf;
        const out = await sharp(jpgInput)
          .rotate()
          .resize({ width: 2400, withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer();

        const fileName = `${slug(orig)}.jpg`;
        const key = `albums/${id}/${fileName}`;
        await put(key, out, 'image/jpeg');
        maxNum += 1;
        photosData.photos.push({
          id: `${id}${maxNum}`,
          albumId: id,
          url: s3url(key),
          caption: '',
          locationId: locationName,
          coordinates: { lng: round6(coord.lng), lat: round6(coord.lat) },
          dateCreated: dateCreated || new Date().toISOString().slice(0, 10),
          tags: [],
        });
        added.push({ type: 'photo', file: fileName, gps: !!(gps && gps.latitude != null) });
      } else if (VIDEO_EXT.test(orig)) {
        const inPath = path.join(tmp, orig.replace(/[^\w.\- ]+/g, '_'));
        await fsp.writeFile(inPath, buf);
        let width = null;
        let height = null;
        let duration = null;
        try {
          const { stdout } = await exec('ffprobe', [
            '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,duration', '-of', 'json', inPath,
          ]);
          const st = JSON.parse(stdout).streams?.[0] || {};
          width = st.width || null;
          height = st.height || null;
          duration = parseFloat(st.duration) || null;
        } catch {
          /* probe failed */
        }
        const base = slug(orig);
        const mp4Local = path.join(tmp, `${base}.mp4`);
        const posterLocal = path.join(tmp, `${base}-poster.jpg`);
        await exec(
          'ffmpeg',
          ['-y', '-i', inPath, '-vf', `scale='min(1920,iw)':-2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-crf', '23', '-preset', 'medium', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', mp4Local],
          { maxBuffer: 1 << 26 }
        );
        await exec('ffmpeg', ['-y', '-ss', '0.5', '-i', inPath, '-frames:v', '1', '-q:v', '3', posterLocal]);
        const keyMp4 = `albums/${id}/video/${base}.mp4`;
        const keyPoster = `albums/${id}/video/${base}-poster.jpg`;
        await put(keyMp4, await fsp.readFile(mp4Local), 'video/mp4');
        await put(keyPoster, await fsp.readFile(posterLocal), 'image/jpeg');
        videosData.videos = (videosData.videos || []).filter((v) => v.id !== `${id}-vid-${base}`);
        videosData.videos.push({
          id: `${id}-vid-${base}`,
          albumId: id,
          file: `${base}.mp4`,
          url: s3url(keyMp4),
          poster: s3url(keyPoster),
          width,
          height,
          duration,
          caption: '',
        });
        added.push({ type: 'video', file: `${base}.mp4` });
      } else {
        errors.push(`${orig}: unsupported file type`);
      }
    } catch (error) {
      errors.push(`${orig}: ${error.message}`);
    }
  }

  await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  if (added.some((a) => a.type === 'photo')) writeJson('photos.json', photosData);
  if (added.some((a) => a.type === 'video')) writeJson('videos.json', videosData);
  clearFileCache();

  return Response.json({ ok: true, added, errors });
}
