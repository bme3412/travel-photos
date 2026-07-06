// scripts/generate-narratives.mjs
//
// Generates editorial narratives for trip replay pages from trip metadata
// (stop sequence, dates, distances, photo captions, tags, destination
// descriptions) and writes them to src/data/narratives.json.
//
// Narrative is content, not code: this runs as a one-time batch (rerun when
// albums change), the output is reviewed/edited by hand, and the site reads
// the JSON statically. Entries are keyed by album id with a fingerprint of
// the underlying trip data — unchanged trips are skipped, and entries marked
// "edited": true are never overwritten.
//
// Usage:
//   node scripts/generate-narratives.mjs            # all albums (skip unchanged)
//   node scripts/generate-narratives.mjs chile      # specific album(s)
//   node scripts/generate-narratives.mjs --force    # regenerate even if unchanged
//
// Requires ANTHROPIC_API_KEY in .env.

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { buildTrip } from '../src/app/utils/tripBuilder.js';
import { haversineKm } from '../src/app/utils/geo.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUT_FILE = path.join(DATA_DIR, 'narratives.json');

const MODEL = 'claude-opus-4-8';
const CONCURRENCY = 4;
const MAX_CAPTIONS_PER_STOP = 60;

const SYSTEM_PROMPT = `You write narrative copy for "Passport & Ponder", a personal travel journal website with an editorial, literary tone (serif headlines, paper-and-ink palette).

You will receive structured metadata for one trip: the album, its stops in itinerary order, and for each stop the dates, photo count, distance from the previous stop, a curated destination description, the photo captions (written by the traveler), and tag frequencies.

Write:
1. An "intro" — 2 or 3 sentences (at most 60 words) that frames the whole journey: its shape, its contrast, what made it distinctive.
2. One beat per stop — 1 or 2 sentences (at most 40 words) capturing what the traveler saw and did there, drawing on the captions.

Voice and rules:
- Past tense, warm but spare. First-person-adjacent ("a short prologue", "three days among...") without overusing "I".
- Ground EVERY detail strictly in the provided metadata. The captions are the traveler's own words — mine them for specifics. Never invent events, weather, food, emotions, companions, or landmarks not present in the data.
- Numbers earn their place: distances, day counts, and photo counts can carry drama ("3,700 km of Pacific"), but don't recite them all.
- When material is thin (placeholder captions like a bare city name, no tags), stay short and lean on the destination description and geography — do not pad with travel-brochure generalities.
- Never mention photos, captions, tags, or metadata as such; write about the journey itself.
- If dates are marked unreliable, do not mention specific dates or durations derived from them.

Example of the register, for a trip with stops Santiago and Easter Island:
intro: "Four days in March, split between a capital and the most remote inhabited island on Earth — a short city prologue in Santiago, then 3,700 kilometers of Pacific to reach the moai."
Santiago: "One afternoon among clock towers and glass — the old and new skylines of Santiago, photographed on the way to somewhere much stranger."
Easter Island: "Three days circling the moai: rows of them on grassy hills, lone sentinels in profile at sunset, the Rano Kau crater, and a dog asleep at the feet of statues that have watched the ocean for centuries."`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    intro: { type: 'string' },
    stops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['name', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['intro', 'stops'],
  additionalProperties: false,
};

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'));
}

function fingerprintTrip(trip) {
  const basis = trip.stops.map((stop) => ({
    name: stop.name,
    photos: stop.photos.map((p) => [p.id, p.caption]),
  }));
  return crypto.createHash('sha256').update(JSON.stringify(basis)).digest('hex').slice(0, 12);
}

// The metadata bundle sent to the model for one trip.
function buildBundle(trip, tagsByPhotoId) {
  const stops = trip.stops.map((stop, i) => {
    const captions = [...new Set(stop.photos.map((p) => p.caption).filter(Boolean))];
    const tagCounts = {};
    for (const photo of stop.photos) {
      for (const tag of tagsByPhotoId.get(photo.id) || []) {
        const key = tag.toLowerCase();
        tagCounts[key] = (tagCounts[key] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, n]) => `${tag} (${n})`);

    return {
      order: i + 1,
      name: stop.name,
      country: stop.country,
      destinationDescription: stop.description,
      dateRange: trip.hasReliableDates ? stop.dateRange : null,
      photoCount: stop.photos.length,
      kmFromPreviousStop:
        i === 0 ? null : Math.round(haversineKm(trip.stops[i - 1].center, stop.center)),
      captions:
        captions.length > MAX_CAPTIONS_PER_STOP
          ? [...captions.slice(0, MAX_CAPTIONS_PER_STOP), `(+${captions.length - MAX_CAPTIONS_PER_STOP} more)`]
          : captions,
      topTags,
    };
  });

  return {
    albumName: trip.name,
    year: trip.year,
    totalPhotos: trip.photoCount,
    totalKmBetweenStops: trip.totalKm,
    datesReliable: trip.hasReliableDates,
    dateRange: trip.hasReliableDates ? trip.dateRange : null,
    stops,
  };
}

async function generateOne(client, trip, tagsByPhotoId) {
  const bundle = buildBundle(trip, tagsByPhotoId);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `Write the narrative for this trip. Stop names in your output must exactly match the "name" fields, in the same order.\n\n${JSON.stringify(bundle, null, 1)}`,
      },
    ],
  });

  const text = response.content.find((block) => block.type === 'text')?.text;
  const parsed = JSON.parse(text);
  const stopTexts = {};
  for (const stop of parsed.stops) stopTexts[stop.name] = stop.text;

  // Every stop must have a beat under its exact name — the site looks
  // narratives up by stop name.
  const missing = trip.stops.filter((s) => !stopTexts[s.name]).map((s) => s.name);
  if (missing.length) {
    throw new Error(`missing stop beats for: ${missing.join(', ')}`);
  }
  return { intro: parsed.intro, stops: stopTexts };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const onlyIds = args.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set (add it to .env).');
    process.exit(1);
  }

  const [albums, photos, locations, destinations] = await Promise.all([
    readJson('albums.json'),
    readJson('photos.json'),
    readJson('locations.json'),
    readJson('destinations.json'),
  ]);

  const tagsByPhotoId = new Map(photos.photos.map((p) => [p.id, p.tags || []]));

  let narratives = {};
  try {
    narratives = JSON.parse(await fs.readFile(OUT_FILE, 'utf8'));
  } catch {
    // first run — no narratives.json yet
  }

  const targets = albums.albums.filter(
    (album) => !onlyIds.length || onlyIds.includes(album.id.toLowerCase())
  );

  const queue = [];
  for (const album of targets) {
    const trip = buildTrip(album, photos, locations, destinations);
    if (!trip) {
      console.warn(`skip ${album.id}: no photos`);
      continue;
    }
    const fingerprint = fingerprintTrip(trip);
    const existing = narratives[album.id];
    if (existing?.edited) {
      console.log(`skip ${album.id}: manually edited`);
      continue;
    }
    if (!force && existing?.fingerprint === fingerprint) {
      console.log(`skip ${album.id}: unchanged`);
      continue;
    }
    queue.push({ album, trip, fingerprint });
  }

  console.log(`generating ${queue.length} narrative(s) with ${MODEL}...`);
  const client = new Anthropic();
  let done = 0;
  let failed = 0;

  async function worker() {
    while (queue.length) {
      const { album, trip, fingerprint } = queue.shift();
      try {
        const narrative = await generateOne(client, trip, tagsByPhotoId);
        narratives[album.id] = {
          ...narrative,
          fingerprint,
          model: MODEL,
          generatedAt: new Date().toISOString(),
          edited: false,
        };
        // Persist incrementally so a late failure doesn't lose earlier work.
        await fs.writeFile(OUT_FILE, JSON.stringify(narratives, null, 2) + '\n');
        done++;
        console.log(`ok   ${album.id} (${trip.stops.length} stops)`);
      } catch (error) {
        failed++;
        console.error(`FAIL ${album.id}: ${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\ndone: ${done} generated, ${failed} failed → ${path.relative(ROOT, OUT_FILE)}`);
  if (failed) process.exit(1);
}

main();
