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

const SYSTEM_PROMPT = `You write narrative copy for "Copy This Trip", a grounded itinerary product with an editorial, literary tone (serif headlines, paper-and-ink palette).

You will receive structured metadata for one trip: the album, its stops in itinerary order, and for each stop the dates, photo count, distance from the previous stop, a curated destination description, the photo captions (written by the traveler), and tag frequencies.

An album can span several separate visits (returns to the same country months or years apart); each stop carries a "visit" label when its dates are known. The same place can appear as a stop in more than one visit — treat each as its own moment in time.

Write:
1. An "intro" — 3 or 4 sentences (at most 90 words) that frames the whole journey: its shape, its contrast, the arc from first stop to last, and what made it distinctive.
2. One beat per stop — a small paragraph of 3 to 5 sentences (roughly 60 to 110 words) that gives the stop room to breathe: what the traveler saw and did there, the texture and rhythm of the place, moving from one concrete detail to the next. Draw richly on the captions and destination description; develop the moment rather than summarizing it in a single line. A stop that is the whole trip (the only stop in its album) deserves the fuller end of that range.

Voice and rules:
- Past tense, warm but spare. First-person-adjacent ("a short prologue", "three days among...") without overusing "I".
- Ground EVERY detail strictly in the provided metadata. The captions are the traveler's own words — mine them for specifics. Never invent events, weather, food, emotions, companions, or landmarks not present in the data.
- Numbers earn their place: distances, day counts, and photo counts can carry drama ("3,700 km of Pacific"), but don't recite them all.
- When material is genuinely thin (placeholder captions like a bare city name, no tags), lean on the destination description and geography and stay proportionate — do not pad with travel-brochure generalities. But when captions and tags are plentiful, use them: a stop with dozens of photographs has a story worth telling at length.
- Never mention photos, captions, tags, or metadata as such; write about the journey itself.
- If dates are marked unreliable, do not mention specific dates or durations derived from them.

Example of the register, for a trip with stops Santiago and Easter Island:
intro: "Four days in March, split between a capital and the most remote inhabited island on Earth. A short city prologue in Santiago gave way to 3,700 kilometers of open Pacific, and then the moai. The contrast was the whole point — glass towers and traffic on one end, wind-scoured volcanic grassland on the other — two places that could hardly be farther apart in feel while sharing a single country."
Santiago: "An afternoon in the capital, spent among clock towers and mirrored glass where the old skyline and the new stand shoulder to shoulder. The streets carried the ordinary momentum of a working city — plazas, facades, the light coming off tall windows — all of it photographed in passing, on the way to somewhere much stranger. A prologue rather than a destination, but one worth slowing down for."
Easter Island: "Three days circling the moai: rows of them lined along grassy hills, lone sentinels caught in profile as the sun dropped, the great open bowl of the Rano Kau crater holding its lake. The scale kept shifting — vast ocean horizons one moment, then a single carved face at close range the next. A dog slept at the feet of statues that have watched the water for centuries, indifferent to the weight of it all."`;

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
      visit: trip.visits?.[stop.visitIndex]?.label || null,
      destinationDescription: stop.description,
      dateRange: stop.hasDates ? stop.dateRange : null,
      photoCount: stop.photos.length,
      kmFromPreviousStop:
        i === 0 || trip.stops[i - 1].visitIndex !== stop.visitIndex
          ? null
          : Math.round(haversineKm(trip.stops[i - 1].center, stop.center)),
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
    // The album-wide range mixes in bulk upload stamps unless every visit
    // is dated — per-stop ranges carry the truth otherwise.
    dateRange: trip.visits?.every((visit) => visit.hasDates) ? trip.dateRange : null,
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
