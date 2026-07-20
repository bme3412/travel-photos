// Server-side generation logic for the copy-trip feature: prompt assembly
// and post-generation cross-checks against the source blueprint. The API
// route owns transport concerns (rate limiting, caching, the Anthropic
// call); this module owns what gets said and what counts as a valid result.
// Never import this from client components — it embeds full prompt text.

import { deriveTransformationRules, effectiveExperienceIds } from './rules.mjs';
import { CopiedTripPlanSchema } from './schema.mjs';

// Sonnet: structured transformation over structured input doesn't need Opus,
// and this runs behind a public, unauthenticated endpoint where latency and
// cost per request matter. Override with COPY_TRIP_MODEL if needed.
export const GENERATION_MODEL = process.env.COPY_TRIP_MODEL || 'claude-sonnet-4-6';

// Static so the system block stays byte-identical across requests and can be
// prompt-cached. Volatile content (trip data, preferences) goes in the user
// message.
export const SYSTEM_PROMPT = `You transform a real completed trip into a personalized itinerary.

The completed trip is the source of truth for its actual places, sequence, route, pace, and experiences. Your job is not to write a generic destination itinerary. Your job is to preserve the selected parts of the source trip while adapting them to the traveler's dates, duration, pace, party type, budget, and preferences.

Rules:
- Every preserved or modified item must carry the sourceExperienceId and sourceDayId of the source experience it comes from, and status "preserved" (kept essentially as-is, timing aside) or "modified" (meaningfully changed: split, re-scoped, adapted).
- Newly introduced items must have status "new" and NO sourceExperienceId. Add new items only where the traveler's preferences call for them; never pad days with generic filler.
- Never claim reservations, availability, exact opening hours, or prices. For anything that requires booking, say so without implying it is arranged.
- Cluster each day geographically using the coordinates provided; avoid backtracking across the city.
- Respect the requested pace: the daily experience count and walking distance limits in the instructions are hard targets.
- Give every item a provenanceLabel: e.g. "Preserved from Day 2 of the original trip", "Adapted from the original Day 1 morning", "New suggestion".
- Write descriptions in your own words, grounded in the source data — do not copy the source summaries verbatim.
- Times are 24-hour "HH:MM" strings. Dates are "YYYY-MM-DD". Distances are kilometers.
- durationDays must equal the requested number of days, with exactly that many entries in days, numbered from 1.
- The comparison array must explain the major differences between the original trip and this version (duration, pace, walking, evenings, party, base — whichever genuinely changed), each with original, personalized, and reason.
- Use warnings for anything the traveler should sanity-check (seasonal events, feasibility trade-offs you had to make).

Follow every instruction in the instructions list.

Be concise: item descriptions are one or two short sentences; include at most 5 warnings, most important first.

OUTPUT FORMAT — return ONLY a JSON object (no markdown fences, no prose before or after) with exactly this shape:

{
  "title": string,                     // e.g. "Your version of Paris"
  "destination": string,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "durationDays": number,
  "summary": string,                   // 1-2 sentences describing this version
  "transformationSummary": string,     // 1-2 sentences on how it differs from the original
  "days": [{
    "dayNumber": number,               // 1-based, sequential
    "title": string,
    "theme": string,                   // short, e.g. "Islands and the Seine"
    "estimatedDistanceKm": number,     // walking distance for the day
    "startTime": "HH:MM", "endTime": "HH:MM",
    "neighborhoods": [string],
    "items": [{
      "id": string,                    // unique slug for this item
      "time": "HH:MM",
      "title": string,
      "description": string,           // 1-2 sentences, your own words
      "category": "food"|"landmark"|"neighborhood"|"tour"|"transport"|"shopping"|"nightlife"|"rest"|"other",
      "durationMinutes": number,
      "neighborhood": string,          // optional
      "travelModeFromPrevious": "walk"|"metro"|"taxi"|"bike"|"none",
      "sourceExperienceId": string,    // REQUIRED for preserved/modified; OMIT for new
      "sourceDayId": string,           // the source day id, when sourceExperienceId is present
      "provenanceLabel": string,
      "status": "preserved"|"modified"|"new"
    }]
  }],
  "comparison": [{ "category": string, "original": string, "personalized": string, "reason": string }],
  "warnings": [string]                 // empty array if none
}`;

// Strip the blueprint to what the model needs: identity, geography, timing,
// and narrative texture — not the 49-point GPS route arrays.
function compactBlueprint(blueprint, selection) {
  const kept = new Set(effectiveExperienceIds(selection));
  const mustKeep = new Set(selection.mustKeepExperienceIds ?? []);
  const removed = new Set(selection.removedExperienceIds ?? []);

  return {
    id: blueprint.id,
    destination: blueprint.destination,
    dates: `${blueprint.startDate} to ${blueprint.endDate}`,
    durationDays: blueprint.durationDays,
    baseNeighborhood: blueprint.baseNeighborhood,
    occasion: blueprint.occasion,
    travelerType: blueprint.travelerType,
    pace: blueprint.pace,
    themes: blueprint.themes,
    totalDistanceKm: blueprint.totalDistanceKm,
    days: blueprint.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      date: day.date,
      startTime: day.startTime,
      endTime: day.endTime,
      distanceKm: day.distanceKm,
      neighborhoods: day.neighborhoods,
      summary: day.summary,
      weather: day.weather,
      inferredBreaks: day.inferredBreaks,
      experiences: day.experiences.map((exp) => ({
        id: exp.id,
        name: exp.name,
        category: exp.category,
        placeName: exp.placeName,
        neighborhood: exp.neighborhood,
        approximateStartTime: exp.approximateStartTime,
        approximateDurationMinutes: exp.approximateDurationMinutes,
        lat: exp.latitude != null ? Math.round(exp.latitude * 1e4) / 1e4 : undefined,
        lng: exp.longitude != null ? Math.round(exp.longitude * 1e4) / 1e4 : undefined,
        bookingRequired: exp.bookingRequired,
        narrativeNote: exp.sourceNarrativeExcerpt,
        disposition: removed.has(exp.id)
          ? 'removed-by-traveler'
          : mustKeep.has(exp.id) && kept.has(exp.id)
            ? 'must-keep'
            : kept.has(exp.id)
              ? 'keep'
              : 'not-selected',
      })),
    })),
  };
}

export function buildGenerationRequest(blueprint, selection, preferences) {
  const rules = deriveTransformationRules(blueprint, selection, preferences);
  const payload = {
    sourceTrip: compactBlueprint(blueprint, selection),
    travelerPreferences: preferences,
    instructions: rules.map((r) => r.instruction),
  };

  return {
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content:
          'Build the personalized itinerary from this source trip and these preferences:\n\n' +
          JSON.stringify(payload, null, 1),
      },
    ],
    rules,
  };
}

// Everything the JSON schema can't express: referential integrity back to the
// blueprint and agreement with the request. Returns a list of human-readable
// problems — empty means the plan is acceptable.
// Parse the model's text into a schema-valid plan. Constrained decoding
// (output_config json_schema) rejected this schema as too complex to
// compile, so the shape is enforced the classic way: prompt-specified
// format, JSON.parse, Zod validation, and a repair pass driven by the
// problems returned here (plus crossCheckPlan).
export function parsePlanText(text) {
  let raw = (text ?? '').trim();
  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) raw = fenced[1];
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return { plan: null, problems: ['the response is not a JSON object'] };
  }
  let data;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch (error) {
    return { plan: null, problems: [`the response is not valid JSON (${error.message})`] };
  }
  const result = CopiedTripPlanSchema.safeParse(data);
  if (!result.success) {
    return {
      plan: null,
      problems: result.error.issues
        .slice(0, 12)
        .map((i) => `${i.path.join('.') || 'plan'}: ${i.message}`),
    };
  }
  return { plan: result.data, problems: [] };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

// What a provenanceLabel's leading words claim about the item's status.
// Only clear leading keywords count — free-form labels make no claim, and
// flagging those would send fine plans to the repair pass.
function labelClaimedStatus(label = '') {
  const l = label.trim().toLowerCase();
  if (/^new\b/.test(l)) return 'new';
  if (/^(preserved|kept|unchanged)\b/.test(l)) return 'preserved';
  if (/^(adapted|modified|adjusted|reworked|re-?scoped|split|shortened|condensed|moved|combined|expanded)\b/.test(l)) {
    return 'modified';
  }
  return null;
}

export function crossCheckPlan(plan, blueprint, selection, preferences) {
  const problems = [];
  const experienceIds = new Set(
    blueprint.days.flatMap((d) => d.experiences.map((e) => e.id))
  );
  const dayIds = new Set(blueprint.days.map((d) => d.id));
  const effective = new Set(effectiveExperienceIds(selection));
  const removed = new Set(selection.removedExperienceIds ?? []);

  if (plan.durationDays !== preferences.durationDays) {
    problems.push(
      `durationDays is ${plan.durationDays}; the traveler asked for ${preferences.durationDays}`
    );
  }
  if (plan.days.length !== plan.durationDays) {
    problems.push(`durationDays is ${plan.durationDays} but there are ${plan.days.length} days`);
  }

  for (const dateField of ['startDate', 'endDate']) {
    if (plan[dateField] && !YMD.test(plan[dateField])) {
      problems.push(`${dateField} "${plan[dateField]}" is not "YYYY-MM-DD"`);
    }
  }

  const citedSourceIds = new Set();
  plan.days.forEach((day, i) => {
    if (day.dayNumber !== i + 1) {
      problems.push(`day at position ${i + 1} has dayNumber ${day.dayNumber}`);
    }
    for (const timeField of ['startTime', 'endTime']) {
      if (day[timeField] && !HHMM.test(day[timeField])) {
        problems.push(`day ${day.dayNumber} ${timeField} "${day[timeField]}" is not 24-hour "HH:MM"`);
      }
    }
    for (const item of day.items) {
      const where = `day ${day.dayNumber} item "${item.title}"`;
      if (item.time && !HHMM.test(item.time)) {
        problems.push(`${where} time "${item.time}" is not 24-hour "HH:MM"`);
      }
      if (item.status === 'new') {
        if (item.sourceExperienceId) {
          problems.push(`${where} has status "new" but cites sourceExperienceId "${item.sourceExperienceId}"`);
        }
      } else {
        if (!item.sourceExperienceId) {
          problems.push(`${where} has status "${item.status}" but no sourceExperienceId`);
        } else if (!experienceIds.has(item.sourceExperienceId)) {
          problems.push(`${where} cites unknown sourceExperienceId "${item.sourceExperienceId}"`);
        } else if (removed.has(item.sourceExperienceId)) {
          problems.push(`${where} reintroduces "${item.sourceExperienceId}", which the traveler removed`);
        } else if (!effective.has(item.sourceExperienceId)) {
          problems.push(`${where} cites "${item.sourceExperienceId}", which the traveler did not select`);
        }
      }
      if (item.sourceExperienceId) citedSourceIds.add(item.sourceExperienceId);
      if (item.sourceDayId && !dayIds.has(item.sourceDayId)) {
        problems.push(`${where} cites unknown sourceDayId "${item.sourceDayId}"`);
      }
      const claimed = labelClaimedStatus(item.provenanceLabel);
      if (claimed && claimed !== item.status) {
        problems.push(
          `${where} has status "${item.status}" but its provenanceLabel ` +
            `"${item.provenanceLabel}" reads as "${claimed}" — make them agree`
        );
      }
    }
  });

  const mustKeep = new Set(selection.mustKeepExperienceIds ?? []);
  for (const mustId of mustKeep) {
    if (effective.has(mustId) && !citedSourceIds.has(mustId)) {
      problems.push(`must-keep experience "${mustId}" does not appear in the itinerary`);
    }
  }

  // No silent drops: an overpacked build may cut optional kept experiences,
  // but every cut must be owned — the experience named in a warning or a
  // comparison entry. (Missing must-keeps are already hard errors above.)
  const expById = new Map(
    blueprint.days.flatMap((d) => d.experiences.map((e) => [e.id, e]))
  );
  const acknowledgments = [
    ...(plan.warnings ?? []),
    ...(plan.comparison ?? []).flatMap((c) => [c.original, c.personalized, c.reason]),
    plan.transformationSummary ?? '',
  ]
    .join('\n')
    .toLowerCase();
  for (const keptId of effective) {
    if (citedSourceIds.has(keptId) || mustKeep.has(keptId)) continue;
    const exp = expById.get(keptId);
    const mentions = [exp?.name, exp?.placeName, keptId].filter(Boolean);
    if (!mentions.some((m) => acknowledgments.includes(String(m).toLowerCase()))) {
      problems.push(
        `kept experience "${exp?.name ?? keptId}" (${keptId}) was dropped silently — ` +
          `either schedule it or name it in a warning that explains the cut`
      );
    }
  }

  // Neighborhood-guide additions: each requested option must appear as a
  // "new" item whose id is exactly the option id (the contract set by the
  // additions rule in rules.mjs).
  const itemsById = new Map(
    plan.days.flatMap((d) => d.items.map((item) => [item.id, item]))
  );
  for (const optionId of selection.addOnOptionIds ?? []) {
    const item = itemsById.get(optionId);
    if (!item) {
      problems.push(
        `requested addition "${optionId}" does not appear as an item with that id`
      );
    } else if (item.status !== 'new') {
      problems.push(`addition "${optionId}" must have status "new", got "${item.status}"`);
    }
  }

  return problems;
}
