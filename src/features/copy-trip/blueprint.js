// Validated access to trip blueprints (src/data/blueprints.json) for the
// "Copy this trip" flow. Blueprints are hand-curated seed data, so parse
// failures mean the data file was edited into an invalid state — we log and
// return null rather than crash, and `npm run validate-blueprints` reports
// the full issue list.

import blueprintsData from '@/data/blueprints.json';
import { TripBlueprintSchema } from './schema.mjs';

const parsed = new Map();

export function getTripBlueprint(tripId) {
  if (parsed.has(tripId)) return parsed.get(tripId);
  const raw = blueprintsData[tripId];
  let blueprint = null;
  if (raw) {
    const result = TripBlueprintSchema.safeParse(raw);
    if (result.success) {
      blueprint = result.data;
    } else {
      console.error(
        `Invalid trip blueprint "${tripId}" — run \`npm run validate-blueprints\``,
        result.error.issues
      );
    }
  }
  parsed.set(tripId, blueprint);
  return blueprint;
}

export function hasTripBlueprint(tripId) {
  return getTripBlueprint(tripId) !== null;
}

// Flat lookup across days, e.g. for resolving provenance references.
export function getBlueprintExperience(tripId, experienceId) {
  const blueprint = getTripBlueprint(tripId);
  if (!blueprint) return null;
  for (const day of blueprint.days) {
    const experience = day.experiences.find((e) => e.id === experienceId);
    if (experience) return { experience, day };
  }
  return null;
}
