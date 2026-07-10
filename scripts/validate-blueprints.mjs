// Validates src/data/blueprints.json against the copy-trip Zod schemas and
// cross-references it with photos.json and narratives.json:
//   - every sourcePhotoId / route photoId exists and belongs to the trip's album
//   - every day id matches a report day id in narratives.json (provenance
//     links from copied itineraries resolve into the existing replay)
//   - day dates fall inside the blueprint date range
// Run with: npm run validate-blueprints

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlueprintsFileSchema } from '../src/features/copy-trip/schema.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

const blueprints = readJson('src/data/blueprints.json');
const { photos } = readJson('src/data/photos.json');
const narratives = readJson('src/data/narratives.json');

const problems = [];

// 1. Schema validation
const result = BlueprintsFileSchema.safeParse(blueprints);
if (!result.success) {
  for (const issue of result.error.issues) {
    problems.push(`schema: ${issue.path.join('.')} — ${issue.message}`);
  }
}

// 2. Cross-reference checks (run against raw data so they report even when
// schema validation already failed)
const photosByAlbum = new Map();
for (const photo of photos) {
  if (!photosByAlbum.has(photo.albumId)) photosByAlbum.set(photo.albumId, new Set());
  photosByAlbum.get(photo.albumId).add(photo.id);
}

for (const [tripId, trip] of Object.entries(blueprints)) {
  const albumPhotoIds = photosByAlbum.get(tripId) ?? new Set();
  const reportDayIds = new Set(
    (narratives[tripId]?.report?.days ?? []).map((d) => d.id)
  );

  for (const day of trip.days ?? []) {
    const where = `${tripId}/${day.id}`;

    if (reportDayIds.size > 0 && !reportDayIds.has(day.id)) {
      problems.push(
        `${where}: day id has no matching report day in narratives.json (${[...reportDayIds].join(', ')})`
      );
    }
    if (day.date && trip.startDate && trip.endDate) {
      if (day.date < trip.startDate || day.date > trip.endDate) {
        problems.push(`${where}: date ${day.date} outside trip range ${trip.startDate}–${trip.endDate}`);
      }
    }

    for (const exp of day.experiences ?? []) {
      for (const photoId of exp.sourcePhotoIds ?? []) {
        if (!albumPhotoIds.has(photoId)) {
          problems.push(`${where}/${exp.id}: unknown sourcePhotoId "${photoId}"`);
        }
      }
    }
    for (const point of day.route ?? []) {
      if (point.photoId && !albumPhotoIds.has(point.photoId)) {
        problems.push(`${where}: route references unknown photoId "${point.photoId}"`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in src/data/blueprints.json\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

for (const [tripId, trip] of Object.entries(blueprints)) {
  const nExperiences = trip.days.reduce((n, d) => n + d.experiences.length, 0);
  const nPhotos = trip.days.reduce(
    (n, d) => n + d.experiences.reduce((m, e) => m + (e.sourcePhotoIds?.length ?? 0), 0),
    0
  );
  console.log(
    `✓ ${tripId}: ${trip.days.length} days, ${nExperiences} experiences, ${nPhotos} photo references, ${trip.totalDistanceKm} km captured`
  );
}
