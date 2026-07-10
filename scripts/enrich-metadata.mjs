// scripts/enrich-metadata.mjs
//
// Recovers per-photo capture time and GPS from the ORIGINAL local files and
// writes them back to src/data/photos.json as ADDITIVE fields — `takenAt`
// (full local wall-clock ISO, e.g. "2026-06-19T16:54:26") and `gps: {lat,lng}`.
// The import pipeline flattens these (date-only + one city-center coordinate);
// this restores the real signal without touching dateCreated/coordinates.
//
// Usage:
//   node scripts/enrich-metadata.mjs                 # every album with local files
//   node scripts/enrich-metadata.mjs paris-2026      # specific album(s)
//   node scripts/enrich-metadata.mjs paris-2026 --dry

import { readFile, writeFile, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import exifr from 'exifr';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTOS = path.join(ROOT, 'src', 'data', 'photos.json');
const ALBUMS_DIR = path.join(ROOT, 'public', 'images', 'albums');
const IMG = /\.(jpe?g|png|heic)$/i;

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const only = argv.filter((a) => !a.startsWith('--')).map((s) => s.toLowerCase());

// EXIF has no timezone — keep the camera's wall-clock time verbatim.
// "2026:06:19 16:54:26" -> "2026-06-19T16:54:26"
const toLocalIso = (s) => {
  if (typeof s !== 'string') return null;
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
};

const folderOf = (url) => {
  const m = url.match(/\/albums\/([^/]+)\//);
  return m ? m[1] : null;
};
const stemOf = (url) => decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '').toLowerCase();

async function indexFolder(folder) {
  const map = new Map();
  try {
    for (const f of await readdir(path.join(ALBUMS_DIR, folder))) {
      if (IMG.test(f)) map.set(f.replace(/\.[^.]+$/, '').toLowerCase(), f);
    }
  } catch {
    /* no local folder for this album */
  }
  return map;
}

async function main() {
  const data = JSON.parse(await readFile(PHOTOS, 'utf8'));
  const folderCache = new Map();

  const scope = data.photos.filter((p) => !only.length || only.includes(p.albumId.toLowerCase()));
  let matched = 0,
    gotTime = 0,
    gotGps = 0,
    noLocal = 0;

  for (const photo of scope) {
    const folder = folderOf(photo.url);
    if (!folder) continue;
    if (!folderCache.has(folder)) folderCache.set(folder, await indexFolder(folder));
    const local = folderCache.get(folder).get(stemOf(photo.url));
    if (!local) {
      noLocal++;
      continue;
    }
    matched++;
    const full = path.join(ALBUMS_DIR, folder, local);
    try {
      const gps = await exifr.gps(full);
      if (gps && gps.latitude != null && gps.longitude != null) {
        photo.gps = { lat: +gps.latitude.toFixed(6), lng: +gps.longitude.toFixed(6) };
        gotGps++;
      }
    } catch {
      /* no gps */
    }
    try {
      const raw = await exifr.parse(full, { reviveValues: false, pick: ['DateTimeOriginal', 'CreateDate'] });
      const takenAt = toLocalIso(raw?.DateTimeOriginal || raw?.CreateDate);
      if (takenAt) {
        photo.takenAt = takenAt;
        gotTime++;
      }
    } catch {
      /* no time */
    }
  }

  console.log(
    `scope: ${scope.length} photos · matched to local files: ${matched} · no local original: ${noLocal}`
  );
  console.log(`recovered: takenAt ${gotTime}, gps ${gotGps}`);

  if (DRY) {
    console.log('\n[dry] nothing written. Re-run without --dry to save.');
    return;
  }
  await writeFile(`${PHOTOS}.backup`, JSON.stringify(JSON.parse(await readFile(PHOTOS, 'utf8')), null, 2));
  await writeFile(PHOTOS, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n✓ wrote src/data/photos.json (backup: photos.json.backup)`);
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
