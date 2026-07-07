// scripts/generate-tags.mjs
//
// Vision-tags photos that have an empty tags array in src/data/photos.json.
// Each photo is downloaded from CloudFront, resized, and sent to Claude with
// the album/location context and a controlled vocabulary built from the tags
// already in use, so new tags stay consistent with the existing set.
//
// Progress is written back to photos.json as it goes (every SAVE_EVERY
// photos), so an interrupted run can simply be re-run — only photos still
// missing tags are processed.
//
// Usage:
//   node scripts/generate-tags.mjs              # all untagged photos
//   node scripts/generate-tags.mjs egypt        # only specific album(s)
//   node scripts/generate-tags.mjs --limit 5    # test run on 5 photos
//
// Requires ANTHROPIC_API_KEY in .env.

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { transformToCloudFront } from '../src/app/utils/imageUtils.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTOS_FILE = path.join(ROOT, 'src', 'data', 'photos.json');
const ALBUMS_FILE = path.join(ROOT, 'src', 'data', 'albums.json');

const MODEL = 'claude-opus-4-8';
const CONCURRENCY = 4;
const SAVE_EVERY = 20;
const MAX_IMAGE_EDGE = 1024;
const VOCAB_MIN_COUNT = 4;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['tags'],
  additionalProperties: false,
};

function buildVocabulary(photos) {
  const counts = {};
  for (const photo of photos) {
    for (const tag of photo.tags || []) {
      const key = tag.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= VOCAB_MIN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

function systemPrompt(vocabulary) {
  return `You tag travel photos for a personal photo journal. You will receive one photo plus its context (city, country, album).

Return 3 to 6 tags describing what is actually visible in the photo: subject matter, setting, and notable qualities (e.g. architecture, wildlife, sunset, market, snow).

Rules:
- Prefer tags from this existing vocabulary whenever one fits: ${vocabulary.join(', ')}
- You may add at most 2 tags not in the vocabulary for distinctive subjects it doesn't cover (e.g. pyramid, fjord, puffin, hieroglyphs).
- All tags lowercase, singular or established plural form, no '#', no city/country names (the site already knows the location).
- Tag only what is visible — do not infer events or places from the context if the photo doesn't show them.`;
}

async function fetchImageBase64(url) {
  const cdnUrl = transformToCloudFront(url);
  const res = await fetch(cdnUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${cdnUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const resized = await sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize(MAX_IMAGE_EDGE, MAX_IMAGE_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return resized.toString('base64');
}

async function tagOne(client, photo, albumsById, vocabulary) {
  const imageData = await fetchImageBase64(photo.url);
  const album = albumsById.get(photo.albumId);
  const context = {
    city: photo.locationId,
    country: album?.country || null,
    album: album?.title || photo.albumId,
    caption: photo.caption,
  };

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt(vocabulary),
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageData },
          },
          { type: 'text', text: `Context: ${JSON.stringify(context)}\n\nTag this photo.` },
        ],
      },
    ],
  });

  const text = response.content.find((block) => block.type === 'text')?.text;
  const tags = JSON.parse(text).tags.map((t) => t.toLowerCase().trim()).filter(Boolean);
  if (!tags.length) throw new Error('model returned no tags');
  return [...new Set(tags)].slice(0, 8);
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const onlyAlbums = args
    .filter((a, i) => !a.startsWith('--') && i !== limitIdx + 1)
    .map((a) => a.toLowerCase());

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set (add it to .env).');
    process.exit(1);
  }

  const photosData = JSON.parse(await fs.readFile(PHOTOS_FILE, 'utf8'));
  const albumsData = JSON.parse(await fs.readFile(ALBUMS_FILE, 'utf8'));
  const albumsById = new Map(albumsData.albums.map((a) => [a.id, a]));
  const vocabulary = buildVocabulary(photosData.photos);

  const queue = photosData.photos.filter(
    (p) =>
      (!p.tags || p.tags.length === 0) &&
      (!onlyAlbums.length || onlyAlbums.includes(p.albumId.toLowerCase()))
  ).slice(0, limit);

  console.log(`${queue.length} photos to tag (vocabulary: ${vocabulary.length} tags)`);
  if (!queue.length) return;

  const client = new Anthropic();
  let done = 0;
  let failed = 0;
  let sinceSave = 0;

  const save = async () => {
    await fs.writeFile(PHOTOS_FILE, JSON.stringify(photosData, null, 2) + '\n');
    sinceSave = 0;
  };

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const photo = queue.shift();
      try {
        photo.tags = await tagOne(client, photo, albumsById, vocabulary);
        done += 1;
        sinceSave += 1;
        console.log(`[${done}] ${photo.id} (${photo.albumId}): ${photo.tags.join(', ')}`);
        if (sinceSave >= SAVE_EVERY) await save();
      } catch (err) {
        failed += 1;
        console.error(`FAIL ${photo.id}: ${err.message}`);
      }
    }
  });

  await Promise.all(workers);
  await save();
  console.log(`\ndone: ${done} tagged, ${failed} failed${failed ? ' (re-run to retry)' : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
