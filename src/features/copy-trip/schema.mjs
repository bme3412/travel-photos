// Zod schemas for the "Copy this trip" feature. A TripBlueprint is the
// structured, hand-curated decomposition of a completed trip — the source
// material the copy flow selects from and the generation step transforms.
//
// Field semantics worth knowing before editing blueprint data:
// - Times are local "HH:MM" strings and dates are "YYYY-MM-DD"; both are
//   approximate, anchored to photo EXIF timestamps where photos exist.
// - distanceKm / totalDistanceKm measure the *captured photo trail* (straight
//   lines between consecutive photo GPS points), not true ground distance.
// - route points are derived 1:1 from that day's photos, oldest first.
// - sourcePhotoIds reference photo `id` values in src/data/photos.json;
//   day ids match the `report.days[].id` values in src/data/narratives.json
//   so provenance links resolve straight into the existing replay.
// Run `npm run validate-blueprints` after editing src/data/blueprints.json.

import { z } from 'zod';

export const EXPERIENCE_CATEGORIES = [
  'food',
  'landmark',
  'neighborhood',
  'tour',
  'transport',
  'shopping',
  'nightlife',
  'rest',
  'other',
];

export const PACES = ['relaxed', 'moderate', 'fast'];

export const TRAVELER_TYPES = ['solo', 'couple', 'friends', 'family'];

export const BUDGET_LEVELS = ['budget', 'mid-range', 'premium'];

export const ACCOMMODATION_MODES = ['original', 'custom', 'undecided'];

// The transformation-preference chips on the personalization form. Each maps
// to a deterministic rule in rules.js — add both together.
export const TRANSFORMATION_PREFS = [
  'less-walking',
  'more-food',
  'more-museums',
  'more-nightlife',
  'more-local-neighborhoods',
  'family-friendly',
  'lower-budget',
  'accessible-route',
  'fewer-landmarks',
  'keep-exact-route',
  'more-downtime',
];

const TimeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'expected 24h "HH:MM"');

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected "YYYY-MM-DD"');

const Slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected kebab-case slug');

export const RoutePointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  time: TimeString.optional(),
  photoId: z.string().optional(),
});

export const InferredBreakSchema = z.object({
  startTime: TimeString,
  endTime: TimeString,
  note: z.string().min(1),
});

export const BlueprintExperienceSchema = z.object({
  id: Slug,
  name: z.string().min(1),
  category: z.enum(EXPERIENCE_CATEGORIES),
  placeName: z.string().optional(),
  neighborhood: z.string().optional(),
  approximateStartTime: TimeString.optional(),
  approximateDurationMinutes: z.number().int().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sourcePhotoIds: z.array(z.string()).default([]),
  sourceDayId: Slug,
  sourceNarrativeExcerpt: z.string().optional(),
  bookingRequired: z.boolean().optional(),
  priority: z.enum(['core', 'optional']).optional(),
});

export const TripBlueprintDaySchema = z.object({
  id: Slug,
  dayNumber: z.number().int().positive(),
  title: z.string().min(1),
  date: IsoDate.optional(),
  startTime: TimeString.optional(),
  endTime: TimeString.optional(),
  distanceKm: z.number().nonnegative().optional(),
  neighborhoods: z.array(z.string().min(1)),
  summary: z.string().min(1),
  weather: z
    .object({
      highF: z.number().int(),
      lowF: z.number().int(),
      note: z.string().optional(),
    })
    .optional(),
  experiences: z.array(BlueprintExperienceSchema).min(1),
  route: z.array(RoutePointSchema).optional(),
  inferredBreaks: z.array(InferredBreakSchema).optional(),
});

export const TripBlueprintSchema = z
  .object({
    id: Slug,
    destination: z.string().min(1),
    startDate: IsoDate.optional(),
    endDate: IsoDate.optional(),
    durationDays: z.number().int().positive(),
    baseNeighborhood: z.string().optional(),
    occasion: z.string().optional(),
    travelerType: z.string().optional(),
    pace: z.enum(PACES),
    themes: z.array(z.string().min(1)),
    totalDistanceKm: z.number().nonnegative().optional(),
    days: z.array(TripBlueprintDaySchema).min(1),
  })
  .superRefine((trip, ctx) => {
    if (trip.durationDays !== trip.days.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['durationDays'],
        message: `durationDays is ${trip.durationDays} but there are ${trip.days.length} days`,
      });
    }
    const seenExperienceIds = new Set();
    trip.days.forEach((day, dayIndex) => {
      if (day.dayNumber !== dayIndex + 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['days', dayIndex, 'dayNumber'],
          message: `expected dayNumber ${dayIndex + 1}, got ${day.dayNumber}`,
        });
      }
      day.experiences.forEach((exp, expIndex) => {
        if (exp.sourceDayId !== day.id) {
          ctx.addIssue({
            code: 'custom',
            path: ['days', dayIndex, 'experiences', expIndex, 'sourceDayId'],
            message: `sourceDayId "${exp.sourceDayId}" does not match containing day "${day.id}"`,
          });
        }
        if (seenExperienceIds.has(exp.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['days', dayIndex, 'experiences', expIndex, 'id'],
            message: `duplicate experience id "${exp.id}"`,
          });
        }
        seenExperienceIds.add(exp.id);
      });
    });
  });

// Keyed by trip/album id, e.g. { "paris-2026": TripBlueprint }
export const BlueprintsFileSchema = z.record(z.string(), TripBlueprintSchema);

// ——— Generated itinerary (the CopiedTripPlan from the feature plan) ———
// This shape doubles as the LLM's structured-output schema (via
// zodOutputFormat) and the validator for anything rendered or persisted.
// Keep it structured-output-friendly: enums and required/optional only.
// Regex-constrained time/date fields make the API reject the schema as too
// complex, so those are plain strings here — generation.mjs cross-checks the
// "HH:MM" / "YYYY-MM-DD" formats and the repair pass fixes violations.

export const ITEM_STATUSES = ['preserved', 'modified', 'new'];

export const TRAVEL_MODES = ['walk', 'metro', 'taxi', 'bike', 'none'];

export const CopiedTripItemSchema = z.object({
  id: z.string().min(1),
  time: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(EXPERIENCE_CATEGORIES),
  durationMinutes: z.number().int().positive().optional(),
  neighborhood: z.string().optional(),
  travelModeFromPrevious: z.enum(TRAVEL_MODES).optional(),
  sourceExperienceId: z.string().optional(),
  sourceDayId: z.string().optional(),
  provenanceLabel: z.string().optional(),
  status: z.enum(ITEM_STATUSES),
});

export const CopiedTripDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1),
  theme: z.string().min(1),
  estimatedDistanceKm: z.number().nonnegative().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  neighborhoods: z.array(z.string()),
  items: z.array(CopiedTripItemSchema).min(1),
});

export const TripComparisonItemSchema = z.object({
  category: z.string().min(1),
  original: z.string().min(1),
  personalized: z.string().min(1),
  reason: z.string().min(1),
});

export const CopiedTripPlanSchema = z.object({
  title: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationDays: z.number().int().positive(),
  summary: z.string().min(1),
  transformationSummary: z.string().min(1),
  days: z.array(CopiedTripDaySchema).min(1),
  comparison: z.array(TripComparisonItemSchema),
  warnings: z.array(z.string()),
});

// What the personalization form collects. Validated client-side on submit
// and again server-side before generation.
export const CopyTripPreferencesSchema = z
  .object({
    startDate: IsoDate,
    durationDays: z.number().int().min(1).max(14),
    travelers: z.number().int().min(1).max(8),
    travelerType: z.enum(TRAVELER_TYPES),
    pace: z.enum(PACES),
    budget: z.enum(BUDGET_LEVELS),
    accommodationMode: z.enum(ACCOMMODATION_MODES),
    accommodationNeighborhood: z.string().max(80).optional(),
    transformations: z.array(z.enum(TRANSFORMATION_PREFS)).default([]),
    notes: z.string().max(600).optional(),
  })
  .superRefine((prefs, ctx) => {
    if (prefs.accommodationMode === 'custom' && !prefs.accommodationNeighborhood?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['accommodationNeighborhood'],
        message: 'Name the neighborhood you have in mind.',
      });
    }
  });

// What the generation API accepts. The server re-reads the blueprint from
// disk and re-derives the rules — the client only sends ids + preferences.
export const GenerateRequestSchema = z.object({
  tripId: Slug,
  selectedExperienceIds: z.array(Slug).min(1).max(200),
  mustKeepExperienceIds: z.array(Slug).max(200).default([]),
  removedExperienceIds: z.array(Slug).max(200).default([]),
  preferences: CopyTripPreferencesSchema,
  regenerate: z.boolean().optional(),
});
