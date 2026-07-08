// scripts/add-videos.mjs
//
// Ingest video clips (e.g. iPhone .mov panoramas) for a trip: transcode to a
// web-friendly H.264 MP4 with a poster frame (ffmpeg), upload both to S3, and
// record them in src/data/videos.json so they resolve in posts and appear in
// the Studio picker.
//
// Usage:
//   node scripts/add-videos.mjs <albumId> <folder> [--caption "..."] [--max 1920] [--dry]
//   npm run add-videos -- egypt ~/Desktop/egypt-clips
//
// Requires ffmpeg/ffprobe on PATH and AWS_* creds in .env.

import 'dotenv/config';
import { readdir, readFile, writeFile, mkdtemp } from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const exec = promisify(execFile);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS_JSON = path.join(ROOT, 'src', 'data', 'videos.json');
const VIDEO_EXT = /\.(mov|mp4|m4v|webm|avi)$/i;

// --- args ---
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : true;
    flags[key] = val;
  } else positional.push(argv[i]);
}
const [albumId, folder] = positional;
if (!albumId || !folder) {
  console.error('Usage: node scripts/add-videos.mjs <albumId> <folder> [--caption "..."] [--max 1920] [--dry]');
  process.exit(1);
}
const MAX_W = parseInt(flags.max || '1920', 10);
const DRY = !!flags.dry;

const BUCKET = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';
if (!BUCKET && !DRY) {
  console.error('AWS_BUCKET_NAME is not set in .env');
  process.exit(1);
}
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
  name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function ffprobe(file) {
  const { stdout } = await exec('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,duration',
    '-of', 'json',
    file,
  ]);
  const st = JSON.parse(stdout).streams?.[0] || {};
  return { width: st.width || null, height: st.height || null, duration: parseFloat(st.duration) || null };
}

async function transcode(input, outMp4) {
  await exec(
    'ffmpeg',
    [
      '-y', '-i', input,
      '-vf', `scale='min(${MAX_W},iw)':-2`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'medium',
      '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k',
      outMp4,
    ],
    { maxBuffer: 1 << 26 }
  );
}

async function poster(input, outJpg) {
  await exec('ffmpeg', ['-y', '-ss', '0.5', '-i', input, '-frames:v', '1', '-q:v', '3', outJpg]);
}

async function upload(localPath, key, contentType) {
  if (DRY) {
    console.log(`  [dry] would upload s3://${BUCKET || '<bucket>'}/${key}`);
    return;
  }
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: await readFile(localPath), ContentType: contentType })
  );
}

async function loadVideos() {
  try {
    const data = JSON.parse(await readFile(VIDEOS_JSON, 'utf8'));
    return Array.isArray(data.videos) ? data : { videos: [] };
  } catch {
    return { videos: [] };
  }
}

async function main() {
  const files = (await readdir(folder)).filter((f) => VIDEO_EXT.test(f)).sort();
  if (!files.length) {
    console.error(`No video files in ${folder}`);
    process.exit(1);
  }
  console.log(`${files.length} clip(s) → album "${albumId}" (max ${MAX_W}px)${DRY ? '  [dry run]' : ''}`);

  const data = await loadVideos();
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'add-videos-'));
  const s3url = (key) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  let done = 0;

  for (const file of files) {
    const base = slug(file);
    const input = path.join(folder, file);
    const meta = await ffprobe(input);
    console.log(`\n▶ ${file}  (${meta.width}×${meta.height}, ${meta.duration?.toFixed(1) ?? '?'}s)`);

    const mp4Name = `${base}.mp4`;
    const posterName = `${base}-poster.jpg`;
    const mp4Local = path.join(tmp, mp4Name);
    const posterLocal = path.join(tmp, posterName);

    await transcode(input, mp4Local);
    await poster(input, posterLocal);

    const keyMp4 = `albums/${albumId}/video/${mp4Name}`;
    const keyPoster = `albums/${albumId}/video/${posterName}`;
    await upload(mp4Local, keyMp4, 'video/mp4');
    await upload(posterLocal, keyPoster, 'image/jpeg');

    const id = `${albumId}-vid-${base}`;
    data.videos = data.videos.filter((v) => v.id !== id);
    data.videos.push({
      id,
      albumId,
      file: mp4Name,
      url: s3url(keyMp4),
      poster: s3url(keyPoster),
      width: meta.width,
      height: meta.height,
      duration: meta.duration,
      caption: typeof flags.caption === 'string' ? flags.caption : '',
    });
    done += 1;
    console.log(`  ✓ ${mp4Name} + poster`);
  }

  if (!DRY) {
    await writeFile(VIDEOS_JSON, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`\ndone: ${done} video(s) → src/data/videos.json`);
  } else {
    console.log(`\ndone: ${done} video(s) transcoded (dry run — nothing uploaded or written)`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
