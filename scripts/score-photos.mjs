// scripts/score-photos.mjs
//
// Rates each photo's aesthetic quality with Claude vision and writes a
// `rating` (1-5) + short `ratingReason` into photos.json. The presentation
// layer uses `rating` to pick heroes/covers, order filmstrips best-first, and
// hide weak frames — so a 1,400-photo library stops treating every shot equally.
//
// Rating is content, not code: this runs as a one-time batch (rerun when new
// photos are added), the numbers are reviewable/editable by hand in photos.json,
// and already-rated photos are skipped unless --force.
//
// Usage:
//   node scripts/score-photos.mjs new-zealand cook-islands   # specific albums
//   node scripts/score-photos.mjs --all                      # every album
//   node scripts/score-photos.mjs new-zealand --force        # rescore
//
// Requires ANTHROPIC_API_KEY in .env. Reads local originals from
// public/images/albums/<Folder>/ (downscaled before upload to save tokens).

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const ALBUMS_DIR = path.join(ROOT, 'public', 'images', 'albums');

const MODEL = 'claude-opus-4-8';
const CONCURRENCY = 4;
// Long edge sent to the model. 1024px is plenty for an aesthetic judgment and
// keeps each image around ~1.5K tokens.
const MAX_EDGE = 1024;
const IMG_EXT = ['.jpg', '.jpeg', '.png', '.heic'];

const SYSTEM_PROMPT = `You are a discerning photo editor curating a personal travel-photography portfolio. You rate a single photograph on overall aesthetic quality for public display.

Judge: composition and framing, light and color, subject interest, moment/emotion, technical quality (focus, exposure), and how strongly it would stand as a hero image on an editorial travel site.

Use the FULL 1-5 range and be honest — most casual snapshots are a 2 or 3:
5 — Portfolio hero. Striking, gallery-worthy; you'd lead a page with it.
4 — Strong. Well-composed and compelling; a clear keeper.
3 — Solid but ordinary. Fine to include, not memorable.
2 — Weak. Snapshot-grade; cluttered, flat light, or dull subject.
1 — Discard. Blurry, badly exposed, accidental, or duplicative filler.

Do not grade on a curve or inflate. A set of 50 photos should span the range.
Give a terse one-sentence reason grounded in what you see.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    rating: { type: 'integer', enum: [1, 2, 3, 4, 5] },
    reason: { type: 'string' },
  },
  required: ['rating', 'reason'],
  additionalProperties: false,
};

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'));
}

async function saveJson(file, data) {
  const p = path.join(DATA_DIR, file);
  await fs.writeFile(`${p}.backup`, await fs.readFile(p, 'utf8'));
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

// Map a photo URL (albums/<Folder>/<name>.jpg) to its local original, whose
// extension may differ (the importer renames everything to .jpg on upload).
async function localFileFor(url) {
  const match = url.match(/albums\/([^/]+)\/([^/?]+)\.[^.]+$/);
  if (!match) return null;
  const [, folder, base] = match;
  const dir = path.join(ALBUMS_DIR, folder);
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }
  const hit = entries.find((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMG_EXT.includes(ext) && path.basename(f, path.extname(f)) === base;
  });
  return hit ? path.join(dir, hit) : null;
}

async function scoreOne(client, file) {
  const buffer = await sharp(file)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: buffer.toString('base64') },
          },
          { type: 'text', text: 'Rate this travel photograph.' },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === 'text')?.text;
  return JSON.parse(text);
}

// Minimal fixed-size worker pool.
async function runPool(items, worker) {
  let i = 0;
  const next = async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next));
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const all = args.includes('--all');
  const onlyIds = args.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set (add it to .env).');
    process.exit(1);
  }
  if (!all && !onlyIds.length) {
    console.error('Pass album id(s) or --all. e.g. node scripts/score-photos.mjs new-zealand cook-islands');
    process.exit(1);
  }

  const photosData = await readJson('photos.json');
  const targets = photosData.photos.filter((p) => {
    if (!all && !onlyIds.includes(p.albumId.toLowerCase())) return false;
    if (!force && typeof p.rating === 'number') return false;
    return true;
  });

  if (!targets.length) {
    console.log('Nothing to score (already rated — use --force to redo).');
    return;
  }

  const client = new Anthropic();
  console.log(`Scoring ${targets.length} photo(s) with ${MODEL} (concurrency ${CONCURRENCY})…\n`);

  let done = 0;
  let skipped = 0;
  await runPool(targets, async (photo) => {
    const file = await localFileFor(photo.url);
    if (!file) {
      skipped++;
      console.log(`  ⚠️  ${photo.id}: no local file for ${photo.url}`);
      return;
    }
    try {
      const { rating, reason } = await scoreOne(client, file);
      photo.rating = rating;
      photo.ratingReason = reason;
      done++;
      console.log(`  [${done}/${targets.length}] ${photo.id} → ${rating}  ${reason}`);
    } catch (err) {
      skipped++;
      console.log(`  ⚠️  ${photo.id}: ${err.message}`);
    }
  });

  await saveJson('photos.json', photosData);

  // Distribution summary per album, so it's easy to sanity-check the spread.
  const byAlbum = {};
  for (const photo of photosData.photos) {
    if (typeof photo.rating !== 'number') continue;
    if (!all && !onlyIds.includes(photo.albumId.toLowerCase())) continue;
    (byAlbum[photo.albumId] ||= []).push(photo.rating);
  }
  console.log('\n✨ Done. Rating distribution:');
  for (const [album, ratings] of Object.entries(byAlbum)) {
    const hist = [1, 2, 3, 4, 5].map((n) => `${n}:${ratings.filter((r) => r === n).length}`).join('  ');
    console.log(`  ${album}  (${ratings.length})  ${hist}`);
  }
  if (skipped) console.log(`\n${skipped} skipped.`);
}

main().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
