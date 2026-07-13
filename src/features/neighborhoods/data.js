// Validated access to the neighborhood registry (src/data/neighborhoods.json)
// and the build-time joins that make it a page: experienceRefs resolved
// against the trip blueprints, photos assigned by center + radiusKm, and
// visit years derived from the matched photos. The registry stores
// references and editorial only — everything here is computed, so a new
// trip's photos flow into these pages with no registry edit.

import neighborhoodsData from '@/data/neighborhoods.json';
import { NeighborhoodsFileSchema } from './schema.mjs';
import { distanceKm } from './geo.mjs';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';

let parsed;

function getRegistry() {
  if (parsed !== undefined) return parsed;
  const result = NeighborhoodsFileSchema.safeParse(neighborhoodsData);
  if (result.success) {
    parsed = result.data;
  } else {
    console.error(
      'Invalid neighborhood registry — run `npm run validate-neighborhoods`',
      result.error.issues
    );
    parsed = null;
  }
  return parsed;
}

export function getNeighborhoodIds() {
  return Object.keys(getRegistry() ?? {});
}

// Full page model for one neighborhood: registry entry + resolved
// experiences (grouped per trip, in blueprint order) + assigned photos
// (oldest first) + derived visit years. `photos` is the raw photos.json
// array — URL transformation stays with the caller, like elsewhere.
export function getNeighborhood(id, photos = []) {
  const hood = (getRegistry() ?? {})[id];
  if (!hood) return null;

  const refsByTrip = new Map();
  for (const ref of hood.experienceRefs) {
    if (!refsByTrip.has(ref.tripId)) refsByTrip.set(ref.tripId, new Set());
    refsByTrip.get(ref.tripId).add(ref.experienceId);
  }

  const trips = [];
  for (const [tripId, wanted] of refsByTrip) {
    const blueprint = getTripBlueprint(tripId);
    if (!blueprint) continue;
    const experiences = [];
    for (const day of blueprint.days) {
      for (const experience of day.experiences) {
        if (wanted.has(experience.id)) experiences.push({ experience, day });
      }
    }
    trips.push({
      tripId,
      destination: blueprint.destination,
      startDate: blueprint.startDate,
      year: blueprint.startDate?.slice(0, 4),
      occasion: blueprint.occasion,
      experiences,
    });
  }
  trips.sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));

  const matchedPhotos = photos
    .filter(
      (p) =>
        String(p.albumId ?? '').startsWith(`${hood.city}-`) &&
        p.gps &&
        distanceKm(hood.center, p.gps) <= hood.radiusKm
    )
    .sort((a, b) => (a.takenAt ?? '').localeCompare(b.takenAt ?? ''));

  const visitYears = [
    ...new Set(
      matchedPhotos.map((p) => (p.takenAt ?? p.dateCreated ?? '').slice(0, 4)).filter(Boolean)
    ),
  ].sort();

  return { ...hood, trips, photos: matchedPhotos, visitYears };
}

// Neighborhoods this trip touched, for "keep exploring" links at the end of
// a replay. Registry-only (no photo join), so it's safe in client bundles —
// same pattern as tripHasBlueprint.
export function getTripNeighborhoods(tripId) {
  return Object.values(getRegistry() ?? {})
    .filter((hood) => hood.experienceRefs.some((ref) => ref.tripId === tripId))
    .map((hood) => ({ id: hood.id, name: hood.name }));
}

// The neighborhood guide for a trip's copy flow: every registry entry for
// the trip's city, carrying the experiences it claims on this trip and the
// authored copyOptions a visitor can add beyond the original route.
// Registry-only, client-safe.
export function getCopyGuide(tripId) {
  return Object.values(getRegistry() ?? {})
    .filter((hood) => tripId.startsWith(`${hood.city}-`))
    .map((hood) => ({
      id: hood.id,
      name: hood.name,
      districts: hood.districts,
      summary: hood.summary,
      experienceIds: hood.experienceRefs
        .filter((ref) => ref.tripId === tripId)
        .map((ref) => ref.experienceId),
      copyOptions: hood.copyOptions ?? [],
    }))
    .filter((hood) => hood.experienceIds.length > 0 || hood.copyOptions.length > 0)
    .sort(
      (a, b) =>
        b.experienceIds.length + b.copyOptions.length -
        (a.experienceIds.length + a.copyOptions.length)
    );
}

// Flat option lookup for a trip's city — request validation and prompt
// assembly on the server, provenance labels on the client.
export function getCopyOptionsForTrip(tripId) {
  const byId = new Map();
  for (const hood of Object.values(getRegistry() ?? {})) {
    if (!tripId.startsWith(`${hood.city}-`)) continue;
    for (const option of hood.copyOptions ?? []) {
      byId.set(option.id, { ...option, neighborhood: hood.name, neighborhoodId: hood.id });
    }
  }
  return byId;
}

// Index model: every neighborhood enriched, grouped by city, richest first
// within a city. Coverage is uneven by design — the counts are the point.
export function getNeighborhoodsByCity(photos = []) {
  const all = getNeighborhoodIds()
    .map((id) => getNeighborhood(id, photos))
    .filter(Boolean);
  const byCity = new Map();
  for (const hood of all) {
    if (!byCity.has(hood.city)) byCity.set(hood.city, []);
    byCity.get(hood.city).push(hood);
  }
  for (const hoods of byCity.values()) {
    hoods.sort(
      (a, b) =>
        b.photos.length + b.experienceRefs.length - (a.photos.length + a.experienceRefs.length)
    );
  }
  return [...byCity.entries()].map(([city, hoods]) => ({ city, hoods }));
}
