#!/usr/bin/env node
//
// Non-interactive photo importer — the flag-driven twin of add-photos.js.
// The interactive script can't run headlessly (its readline closes before the
// first prompt when stdin isn't a TTY), so automated/agent-driven imports use
// this. Same effect: resize + upload each image to S3, then update
// albums.json / photos.json / destinations.json (with backups).
//
// Usage:
//   node scripts/add-photos-cli.mjs \
//     --folder public/images/albums/Rarotonga \
//     --album-id cook-islands --album-name "Cook Islands" --country-id CK --year 2026 \
//     --location Rarotonga --location-country "Cook Islands" \
//     --description "..." --coords "-21.2367,-159.7777" [--dry]
//
// If --album-id already exists the album is reused (a second location on the
// same trip, e.g. Aitutaki), so photo IDs continue from the album's max.

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import exifr from 'exifr';
import dotenv from 'dotenv';

dotenv.config();

// --- args ---------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name, def = undefined) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = argv.includes('--dry');

const folder = flag('folder');
const albumId = flag('album-id');
const albumName = flag('album-name');
const countryId = (flag('country-id') || '').toUpperCase();
const year = flag('year');
const location = flag('location');
const locationCountry = flag('location-country');
const description = flag('description', '');
const coords = flag('coords');

if (!folder || !albumId || !location || !coords) {
  console.error('Missing required flags: --folder --album-id --location --coords');
  process.exit(1);
}

const [lat, lng] = coords.split(',').map((s) => parseFloat(s.trim()));
if (Number.isNaN(lat) || Number.isNaN(lng)) {
  console.error(`Invalid --coords "${coords}" (expected "lat,lng")`);
  process.exit(1);
}

const FLAG_EMOJIS = {
  NZ: '🇳🇿', CK: '🇨🇰', AU: '🇦🇺', US: '🇺🇸', FR: '🇫🇷', IT: '🇮🇹',
};
const IMG_EXT = ['.jpg', '.jpeg', '.png', '.heic'];

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dataPath = (f) => path.join(process.cwd(), 'src', 'data', f);
const loadJson = async (f) => JSON.parse(await readFile(dataPath(f), 'utf8'));
async function saveJson(f, data) {
  await writeFile(`${dataPath(f)}.backup`, await readFile(dataPath(f), 'utf8'));
  await writeFile(dataPath(f), JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ ${f} (backup written)`);
}

// EXIF capture date → YYYY-MM-DD, falling back to today.
async function captureDate(file) {
  try {
    const ex = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
    const d = ex?.DateTimeOriginal || ex?.CreateDate;
    if (d) return new Date(d).toISOString().slice(0, 10);
  } catch {
    /* fall through */
  }
  return new Date().toISOString().slice(0, 10);
}

async function uploadImage(buffer, folderName, fileName) {
  const meta = await sharp(buffer).metadata();
  let img = sharp(buffer).rotate();
  if (meta.width > 1920 || meta.height > 1920) {
    img = img.resize(1920, 1920, { fit: 'inside', withoutEnlargement: true });
  }
  const out = await img.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  const key = `albums/${folderName}/${fileName.replace(/\.[^.]+$/, '.jpg')}`;
  if (!DRY) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: out,
        ContentType: 'image/jpeg',
      })
    );
  }
  const domain =
    process.env.CLOUDFRONT_DOMAIN ||
    `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  return `https://${domain}/${key}`;
}

async function main() {
  const full = path.resolve(folder);
  if (!(await stat(full)).isDirectory()) throw new Error(`Not a directory: ${full}`);

  const files = (await readdir(full))
    .filter((f) => IMG_EXT.includes(path.extname(f).toLowerCase()))
    .sort();
  if (!files.length) throw new Error('No images found');

  const albumsData = await loadJson('albums.json');
  const photosData = await loadJson('photos.json');
  const destinationsData = await loadJson('destinations.json');
  const destinations = Array.isArray(destinationsData)
    ? destinationsData
    : destinationsData.destinations;

  // Album: reuse by id or create.
  let album = albumsData.albums.find((a) => a.id === albumId);
  const newAlbum = !album;
  if (newAlbum) {
    album = {
      id: albumId,
      name: `${FLAG_EMOJIS[countryId] || '🌍'} ${albumName}`,
      countryId,
      year,
    };
  }

  const existing = photosData.photos.filter((p) => p.albumId === albumId);
  const maxNum = existing.reduce((m, p) => {
    const n = parseInt(p.id.replace(albumId, ''), 10) || 0;
    return Math.max(m, n);
  }, 0);

  console.log(
    `\n${DRY ? '[DRY] ' : ''}${files.length} image(s) → album "${albumId}"` +
      `${newAlbum ? ' (new)' : ' (existing)'}, location "${location}"\n`
  );

  const folderName = path.basename(full);
  const added = [];
  for (let i = 0; i < files.length; i++) {
    const fp = path.join(full, files[i]);
    const date = await captureDate(fp);
    const url = await uploadImage(await readFile(fp), folderName, files[i]);
    added.push({
      id: `${albumId}${maxNum + added.length + 1}`,
      albumId,
      url,
      caption: location,
      locationId: location,
      coordinates: { lng, lat },
      dateCreated: date,
      tags: [],
    });
    console.log(`  [${i + 1}/${files.length}] ${files[i]} · ${date}`);
  }

  // Destination (by name, case-insensitive).
  if (!destinations.find((d) => d.name.toLowerCase() === location.toLowerCase())) {
    const nextId = String(Math.max(...destinations.map((d) => parseInt(d.id, 10))) + 1);
    destinations.push({
      id: nextId,
      name: location,
      country: locationCountry || albumName,
      description,
      latitude: lat,
      longitude: lng,
    });
    console.log(`  + destination "${location}"`);
  } else {
    console.log(`  → destination "${location}" already exists`);
  }

  if (DRY) {
    console.log('\n[DRY] No S3 upload, no files written. Re-run without --dry to commit.');
    return;
  }

  if (newAlbum) albumsData.albums.push(album);
  photosData.photos.push(...added);
  console.log('\nWriting data files:');
  await saveJson('albums.json', albumsData);
  await saveJson('photos.json', photosData);
  await saveJson('destinations.json', Array.isArray(destinationsData) ? destinations : destinationsData);

  console.log(
    `\n✨ ${album.name} (${album.year}) — +${added.length} photos at ${location}. Replay: /trips/${albumId}\n`
  );
}

main().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
