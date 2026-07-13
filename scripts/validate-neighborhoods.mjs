// Validates src/data/neighborhoods.json against the neighborhood Zod schemas
// and cross-references it with blueprints.json:
//   - every experienceRef resolves to a real experience in that trip
//   - every referenced experience with coordinates lies inside the
//     neighborhood's center + radiusKm
//   - every blueprint experience whose `neighborhood` string matches an
//     entry's name/aliases is claimed by that entry (drift catch)
// Blueprint neighborhood strings with no registry entry are reported as
// candidates, not errors — the registry is expected to grow unevenly.
// Run with: npm run validate-neighborhoods

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NeighborhoodsFileSchema } from '../src/features/neighborhoods/schema.mjs';
import { distanceKm } from '../src/features/neighborhoods/geo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

const neighborhoods = readJson('src/data/neighborhoods.json');
const blueprints = readJson('src/data/blueprints.json');

const problems = [];

// 1. Schema + cross-entry validation
const result = NeighborhoodsFileSchema.safeParse(neighborhoods);
if (!result.success) {
  for (const issue of result.error.issues) {
    problems.push(`schema: ${issue.path.join('.')} — ${issue.message}`);
  }
}

// 2. Cross-reference checks against blueprints (run on raw data so they
// report even when schema validation already failed)
const experiencesByTrip = new Map();
for (const [tripId, trip] of Object.entries(blueprints)) {
  const byId = new Map();
  for (const day of trip.days ?? []) {
    for (const exp of day.experiences ?? []) byId.set(exp.id, exp);
  }
  experiencesByTrip.set(tripId, byId);
}

const claimed = new Set(); // "tripId/experienceId"
const labelToHood = new Map(); // "city:label" (lowercased) -> neighborhood id
const cities = new Set();
for (const hood of Object.values(neighborhoods)) {
  cities.add(hood.city);
  for (const label of [hood.name, ...(hood.aliases ?? [])]) {
    labelToHood.set(`${hood.city}:${label.toLowerCase()}`, hood.id);
  }
}
const cityOfTrip = (tripId) => [...cities].find((c) => tripId.startsWith(`${c}-`));

for (const [key, hood] of Object.entries(neighborhoods)) {
  for (const ref of hood.experienceRefs ?? []) {
    const where = `${key}: ${ref.tripId}/${ref.experienceId}`;
    const byId = experiencesByTrip.get(ref.tripId);
    if (!byId) {
      problems.push(`${where} — unknown trip`);
      continue;
    }
    const exp = byId.get(ref.experienceId);
    if (!exp) {
      problems.push(`${where} — unknown experience`);
      continue;
    }
    claimed.add(`${ref.tripId}/${ref.experienceId}`);
    if (exp.latitude != null && exp.longitude != null) {
      const km = distanceKm(hood.center, { lat: exp.latitude, lng: exp.longitude });
      if (km > hood.radiusKm) {
        problems.push(
          `${where} — ${km.toFixed(2)} km from center, outside radius ${hood.radiusKm} km`
        );
      }
    }
  }
}

// 3. Drift: blueprint experiences labeled with a registered neighborhood
// must be claimed by it; unregistered labels are surfaced as candidates.
const unregistered = new Map(); // label -> count
for (const [tripId, byId] of experiencesByTrip) {
  const city = cityOfTrip(tripId);
  for (const exp of byId.values()) {
    if (!exp.neighborhood) continue;
    const hoodId = city && labelToHood.get(`${city}:${exp.neighborhood.toLowerCase()}`);
    if (hoodId) {
      if (!claimed.has(`${tripId}/${exp.id}`)) {
        problems.push(
          `${hoodId}: blueprint experience ${tripId}/${exp.id} is labeled ` +
            `"${exp.neighborhood}" but is not in experienceRefs`
        );
      }
    } else {
      const label = `${exp.neighborhood} (${city ?? tripId})`;
      unregistered.set(label, (unregistered.get(label) ?? 0) + 1);
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in src/data/neighborhoods.json\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

for (const [key, hood] of Object.entries(neighborhoods)) {
  console.log(
    `✓ ${key}: ${hood.districts.join(' + ')}, ${hood.experienceRefs.length} experience ref(s), ` +
      `radius ${hood.radiusKm} km${hood.essay ? ', essay' : ''}`
  );
}
if (unregistered.size > 0) {
  const list = [...unregistered.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => `${label} ×${n}`)
    .join(', ');
  console.log(`ℹ unregistered neighborhood labels in blueprints: ${list}`);
}
