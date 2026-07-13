// Zod schemas for the neighborhood registry. A Neighborhood is a place-based
// aggregation layer over existing atoms — blueprint experiences, photos,
// narrative days — plus a small amount of editorial content. It stores
// references, never copies: anything derivable (photo membership, visit
// years, replay links) is computed at build time from center + radiusKm and
// experienceRefs, not persisted here.
//
// Field semantics worth knowing before editing registry data:
// - Neighborhoods are the primary unit; `districts` is a human-readable
//   rollup label ("6e arrondissement", a Berlin Kiez's Bezirk, …). Coverage
//   views group by string equality, so keep the labels consistent per city.
// - `aliases` must include every spelling used by blueprint experience
//   `neighborhood` fields (e.g. "Saint-Germain" for Saint-Germain-des-Prés);
//   the validator matches on name + aliases to catch drift.
// - center/radiusKm bound the neighborhood for photo auto-assignment; every
//   referenced experience's coordinates must fall inside.
// - `essay` and `personalHistory` are the owner's writing (seed copy until
//   replaced); `summary` is the short card text shown in indexes.
// - By convention trip ids start with "<city>-" (paris-2026), which is how
//   experienceRefs are checked against `city`.
// Run `npm run validate-neighborhoods` after editing
// src/data/neighborhoods.json.

import { z } from 'zod';

const Slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected kebab-case slug');

export const ExperienceRefSchema = z.object({
  tripId: Slug,
  experienceId: Slug,
});

export const NeighborhoodSchema = z.object({
  id: Slug,
  name: z.string().min(1),
  city: Slug,
  districts: z.array(z.string().min(1)).min(1),
  aliases: z.array(z.string().min(1)).default([]),
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radiusKm: z.number().positive().max(5),
  summary: z.string().min(1),
  essay: z.string().min(1).optional(),
  personalHistory: z.string().min(1).optional(),
  firstVisitedYear: z.number().int().min(1900).max(2100).optional(),
  experienceRefs: z.array(ExperienceRefSchema).default([]),
});

// Keyed by neighborhood id, e.g. { "saint-germain-des-pres": Neighborhood }.
// Cross-entry invariants live here (pure data); cross-*file* checks against
// blueprints.json and photos.json live in scripts/validate-neighborhoods.mjs.
export const NeighborhoodsFileSchema = z
  .record(z.string(), NeighborhoodSchema)
  .superRefine((entries, ctx) => {
    const namesSeen = new Map(); // lowercased name/alias -> owning id
    const refsSeen = new Map(); // "tripId/experienceId" -> owning id

    for (const [key, hood] of Object.entries(entries)) {
      if (key !== hood.id) {
        ctx.addIssue({
          code: 'custom',
          path: [key, 'id'],
          message: `key "${key}" does not match id "${hood.id}"`,
        });
      }
      for (const label of [hood.name, ...hood.aliases]) {
        const norm = label.toLowerCase();
        if (namesSeen.has(norm) && namesSeen.get(norm) !== hood.id) {
          ctx.addIssue({
            code: 'custom',
            path: [key, 'aliases'],
            message: `"${label}" is already claimed by "${namesSeen.get(norm)}"`,
          });
        }
        namesSeen.set(norm, hood.id);
      }
      hood.experienceRefs.forEach((ref, i) => {
        const refKey = `${ref.tripId}/${ref.experienceId}`;
        if (refsSeen.has(refKey)) {
          ctx.addIssue({
            code: 'custom',
            path: [key, 'experienceRefs', i],
            message: `${refKey} is already claimed by "${refsSeen.get(refKey)}"`,
          });
        }
        refsSeen.set(refKey, hood.id);
        if (!ref.tripId.startsWith(`${hood.city}-`)) {
          ctx.addIssue({
            code: 'custom',
            path: [key, 'experienceRefs', i, 'tripId'],
            message: `trip "${ref.tripId}" is not a ${hood.city} trip`,
          });
        }
      });
    }
  });
