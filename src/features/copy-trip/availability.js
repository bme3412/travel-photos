// Lightweight "does this trip have a blueprint?" check, importable from
// client components (nav, CTAs). Deliberately does NOT import the Zod
// schemas — this ships in shared client chunks and only needs key presence;
// full validation lives in blueprint.js for code that reads the data.

import blueprintsData from '@/data/blueprints.json';

export function tripHasBlueprint(tripId) {
  return Boolean(tripId && blueprintsData[tripId]);
}
