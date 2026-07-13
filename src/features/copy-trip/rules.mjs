// The deterministic transformation pipeline: converts the source blueprint,
// the user's selection, and their preferences into explicit rules BEFORE any
// LLM is involved. Each rule carries an `instruction` (fed to the generation
// prompt in the next phase) and, where the change is user-visible, a
// `comparison` seed ({category, original, personalized, reason}) that powers
// the "How your version changed" module. Pure functions — no I/O, no dates
// beyond what the caller passes in.

import { addDaysIso, formatDateRange, titleCase } from './format.mjs';
import { getCopyOptionsForTrip } from '@/features/neighborhoods/data';

export const PACE_DAILY_EXPERIENCES = { relaxed: 4, moderate: 6, fast: 8 };
export const PACE_DAILY_WALKING_KM = { relaxed: 8, moderate: 12, fast: 18 };
const PACE_ORDER = { relaxed: 0, moderate: 1, fast: 2 };

export function effectiveExperienceIds(session) {
  const removed = new Set(session.removedExperienceIds ?? []);
  return (session.selectedExperienceIds ?? []).filter((id) => !removed.has(id));
}

// Can the kept experiences plausibly fit the requested days at the requested
// pace? `over` drives the feasibility warning on the form.
export function assessFeasibility(session, preferences) {
  const count = effectiveExperienceIds(session).length;
  const days = Math.max(1, preferences.durationDays || 1);
  const perDay = count / days;
  const limit = PACE_DAILY_EXPERIENCES[preferences.pace] ?? PACE_DAILY_EXPERIENCES.moderate;
  return {
    count,
    days,
    perDay: Math.round(perDay * 10) / 10,
    limit,
    over: perDay > limit,
    fitsFast: perDay <= PACE_DAILY_EXPERIENCES.fast,
  };
}

// "MM-DD" values covered by an inclusive date range (short trips only).
function monthDays(startIso, endIso) {
  const out = new Set();
  let d = startIso;
  for (let i = 0; i < 60 && d <= endIso; i += 1) {
    out.add(d.slice(5));
    d = addDaysIso(d, 1);
  }
  return out;
}

export function deriveTransformationRules(blueprint, session, preferences) {
  const rules = [];
  const add = (code, instruction, comparison) =>
    rules.push(comparison ? { code, instruction, comparison } : { code, instruction });

  const city = blueprint.destination.split(',')[0];
  const byId = new Map(
    blueprint.days.flatMap((d) => d.experiences.map((e) => [e.id, e]))
  );
  const effIds = effectiveExperienceIds(session);
  const kept = effIds.map((id) => byId.get(id)).filter(Boolean);
  const mustKeep = (session.mustKeepExperienceIds ?? [])
    .filter((id) => effIds.includes(id))
    .map((id) => byId.get(id))
    .filter(Boolean);
  const removed = (session.removedExperienceIds ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean);
  const prefs = new Set(preferences.transformations ?? []);
  const keptIdSet = new Set(effIds);

  const expLimit = PACE_DAILY_EXPERIENCES[preferences.pace];
  const kmLimit = PACE_DAILY_WALKING_KM[preferences.pace];

  // Always: the arithmetic of the new trip, so day composition is explicit.
  add(
    'composition',
    `Build ${preferences.durationDays} day(s) for ${preferences.travelers} traveler(s). ` +
      `Target at most ${expLimit} experiences and roughly ${kmLimit} km on foot per day, ` +
      `clustering each day's stops by neighborhood to avoid backtracking. ` +
      `${kept.length} experiences were kept from the source trip.`
  );

  // Duration change
  if (preferences.durationDays !== blueprint.durationDays) {
    const longer = preferences.durationDays > blueprint.durationDays;
    const busiest = [...blueprint.days].sort(
      (a, b) => (b.distanceKm ?? 0) - (a.distanceKm ?? 0)
    )[0];
    add(
      'duration',
      longer
        ? `The original ran ${blueprint.durationDays} days; the new trip runs ${preferences.durationDays}. ` +
            `Spread the kept experiences across the extra time — split the most intense original day ` +
            `(${busiest.title}, ≈${busiest.distanceKm} km) rather than padding with generic filler.`
        : `The original ran ${blueprint.durationDays} days; the new trip runs ${preferences.durationDays}. ` +
            `Consolidate around must-keep experiences and drop optional stops rather than overpacking days.`,
      {
        category: 'Duration',
        original: `${blueprint.durationDays} days`,
        personalized: `${preferences.durationDays} days`,
        reason: longer
          ? 'The busiest original day is divided across the extra time instead of padded with filler.'
          : 'Optional stops give way to must-keeps to fit the shorter stay.',
      }
    );
  }

  // Pace change
  if (preferences.pace !== blueprint.pace) {
    add(
      'pace',
      `Adjust the rhythm from ${blueprint.pace} to ${preferences.pace}: no more than ` +
        `${expLimit} experiences or ~${kmLimit} km per day, with later starts or earlier ends where needed.`,
      {
        category: 'Pace',
        original: `${titleCase(blueprint.pace)}`,
        personalized: `${titleCase(preferences.pace)}`,
        reason: 'Daily stop count and distance are scaled to the pace you chose.',
      }
    );
  }

  // Evenings: the original stacked multiple booked evening activities into one
  // night; a slower/family/more-downtime version spreads them out.
  const wantsEasierEvenings =
    PACE_ORDER[preferences.pace] < PACE_ORDER[blueprint.pace] ||
    prefs.has('more-downtime') ||
    preferences.travelerType === 'family';
  if (wantsEasierEvenings) {
    for (const day of blueprint.days) {
      const eveningTours = day.experiences.filter(
        (e) =>
          keptIdSet.has(e.id) &&
          e.category === 'tour' &&
          (e.approximateStartTime ?? '') >= '17:00'
      );
      if (eveningTours.length >= 2 && preferences.durationDays >= 2) {
        const names = eveningTours.map((e) => e.name);
        add(
          'evenings',
          `The original packed ${names.join(' and ')} into one evening (${day.title}). ` +
            `Schedule them on separate evenings.`,
          {
            category: 'Evenings',
            original: `${names.join(' and ')} on the same evening`,
            personalized: 'Split across separate evenings',
            reason: 'Less schedule pressure at the pace you asked for.',
          }
        );
      }
    }
  }

  // Walking
  if (prefs.has('less-walking')) {
    add(
      'walking',
      `Minimize walking: keep each day within one or two adjacent neighborhoods, suggest metro or ` +
        `taxi between distant areas, and stay well under the ${kmLimit} km daily cap.`,
      {
        category: 'Walking',
        original: `≈ ${blueprint.totalDistanceKm} km captured over ${blueprint.durationDays} days`,
        personalized: 'Clustered days with transit between areas',
        reason: 'You asked for less walking.',
      }
    );
  }

  // Party
  const originalType = blueprint.travelerType ?? 'solo';
  if (preferences.travelerType !== originalType || preferences.travelers > 1) {
    const typeInstructions = {
      family:
        'Keep timing family-friendly: no late-night sequencing, frequent breaks, and no long uninterrupted walks.',
      couple:
        'Keep the evening river and night-view moments; if no special dinner was kept, add one marked "new".',
      friends:
        'Favor group-friendly experiences; keep tours and evening plans, and note where group bookings apply.',
      solo: 'Keep the solo-friendly texture: cafés, wandering, and flexible timing.',
    };
    add(
      'party',
      `The original trip was ${originalType}; this one is for ${preferences.travelers} ` +
        `traveler(s) (${preferences.travelerType}). ${typeInstructions[preferences.travelerType]} ` +
        `Never claim reservations or availability for the group.`,
      {
        category: 'Party',
        original: titleCase(originalType),
        personalized: `${titleCase(preferences.travelerType)} · ${preferences.travelers} ${
          preferences.travelers === 1 ? 'traveler' : 'travelers'
        }`,
        reason: 'Sequencing and meal choices adapt to who is traveling.',
      }
    );
  }

  // Budget (the chip lowers whatever budget level was chosen)
  const budget = prefs.has('lower-budget') ? 'budget' : preferences.budget;
  if (budget !== 'mid-range') {
    add(
      'budget',
      budget === 'budget'
        ? 'Keep costs down: prefer free or low-cost alternatives, keep paid activities only when must-keep, and flag every item that costs money.'
        : 'Premium comfort is welcome: nicer meals, skip-the-line or private variants marked "modified" or "new" — but never imply confirmed pricing.',
      {
        category: 'Budget',
        original: 'As traveled',
        personalized: budget === 'budget' ? 'Budget' : 'Premium',
        reason:
          budget === 'budget'
            ? 'Paid activities are trimmed or flagged so costs stay visible.'
            : 'Room for upgrades where they improve the day.',
      }
    );
  }

  // Accommodation
  if (preferences.accommodationMode === 'custom' && preferences.accommodationNeighborhood) {
    add(
      'base',
      `The traveler stays in ${preferences.accommodationNeighborhood} instead of ` +
        `${blueprint.baseNeighborhood}. Re-anchor days to start and end near the new base and ` +
        `avoid crossing the city late at night.`,
      {
        category: 'Base',
        original: blueprint.baseNeighborhood,
        personalized: preferences.accommodationNeighborhood,
        reason: 'Days are re-anchored to start and end near your base.',
      }
    );
  } else if (preferences.accommodationMode === 'undecided') {
    add(
      'base',
      `No base is chosen yet. Recommend one or two neighborhoods near the densest cluster of kept ` +
        `experiences (the original stayed in ${blueprint.baseNeighborhood}), marked as suggestions.`,
      {
        category: 'Base',
        original: blueprint.baseNeighborhood,
        personalized: 'To be decided — suggestions included',
        reason: 'You have not picked where to stay yet.',
      }
    );
  } else {
    add(
      'base',
      `Keep the original base (${blueprint.baseNeighborhood}); anchor mornings and evenings near it.`
    );
  }

  // Additive interests
  const additive = {
    'more-food':
      'Add one or two new food experiences per day near the kept route — marked "new", no availability claims.',
    'more-museums':
      'Add museum or gallery stops close to the kept route, marked "new"; do not invent opening hours.',
    'more-nightlife':
      'Add evening options (bars, music, late walks) marked "new" where the pace allows.',
    'more-local-neighborhoods':
      'When adding anything new, favor residential streets, markets, and local squares over headline sights.',
  };
  for (const [chip, instruction] of Object.entries(additive)) {
    if (prefs.has(chip)) add(chip, instruction);
  }

  // Family-friendly chip (only when the party rule didn't already cover it)
  if (prefs.has('family-friendly') && preferences.travelerType !== 'family') {
    add(
      'family-friendly',
      'Keep timing family-friendly: no late-night blocks, frequent breaks, shorter walking legs.'
    );
  }

  if (prefs.has('accessible-route')) {
    const stairHeavy = kept
      .filter((e) => /climb|steps|up the/i.test(e.name))
      .map((e) => e.name);
    add(
      'accessibility',
      `Prefer step-free routing and seated transport between areas. Flag stops with significant ` +
        `stairs${stairHeavy.length ? ` (e.g. ${stairHeavy.join(', ')})` : ''} and offer an ` +
        `accessible alternative marked "modified".`,
      {
        category: 'Accessibility',
        original: 'Stairs and hills as encountered',
        personalized: 'Step-free routing with flagged alternatives',
        reason: 'You asked for an accessible route.',
      }
    );
  }

  if (prefs.has('fewer-landmarks')) {
    add(
      'fewer-landmarks',
      'Drop optional landmark-category stops unless must-keep; keep the neighborhood and food texture of the original.'
    );
  }

  if (prefs.has('keep-exact-route')) {
    add(
      'route',
      'Preserve the original visit order and geography of the kept experiences; adjust only timing, breaks, and transit.',
      {
        category: 'Route',
        original: 'As traveled',
        personalized: 'Preserved',
        reason: 'You chose to keep the exact route.',
      }
    );
  }

  if (prefs.has('more-downtime')) {
    add(
      'downtime',
      'Schedule an explicit rest block each day — midday or after long stretches. The original relied on unplanned pauses.',
      {
        category: 'Downtime',
        original: 'Unplanned pauses only',
        personalized: 'A scheduled rest block each day',
        reason: 'You asked for more downtime.',
      }
    );
  }

  // Occasion: the source trip was anchored to an event; do the new dates hit it?
  if (blueprint.occasion && preferences.startDate && blueprint.startDate && blueprint.endDate) {
    const newEnd = addDaysIso(preferences.startDate, preferences.durationDays - 1);
    const original = monthDays(blueprint.startDate, blueprint.endDate);
    const overlaps = [...monthDays(preferences.startDate, newEnd)].some((md) =>
      original.has(md)
    );
    if (!overlaps) {
      add(
        'occasion',
        `The original trip centered on ${blueprint.occasion} ` +
          `(${formatDateRange(blueprint.startDate, blueprint.endDate)}); the new dates do not include it. ` +
          `Do not promise festival or event experiences — adapt anything that depended on it and mark it "modified".`,
        {
          category: 'Occasion',
          original: blueprint.occasion,
          personalized: 'Outside the festival window',
          reason: 'Your dates do not overlap the original occasion.',
        }
      );
    } else {
      add(
        'occasion',
        `The new dates overlap ${blueprint.occasion}, the occasion the original trip was built around — keep the experiences tied to it.`
      );
    }
  }

  // Feasibility: acknowledged overpacking still gets an explicit instruction.
  const feasibility = assessFeasibility(session, preferences);
  if (feasibility.over) {
    add(
      'overpacked',
      `${feasibility.count} kept experiences across ${feasibility.days} day(s) exceeds a comfortable ` +
        `${preferences.pace} pace (~${feasibility.limit}/day). Guarantee the must-keeps; mark the rest ` +
        `as optional or drop the least essential, explaining what was cut.`
    );
  }

  // Additions from the neighborhood guide: owner-curated options the
  // traveler picked beyond the original route. The id contract ("item id =
  // option id, status new") is what crossCheckPlan verifies.
  const addOnIds = session.addOnOptionIds ?? [];
  if (addOnIds.length) {
    const optionsById = getCopyOptionsForTrip(blueprint.id);
    const chosen = addOnIds.map((id) => optionsById.get(id)).filter(Boolean);
    if (chosen.length) {
      add(
        'additions',
        'The traveler picked these curated additions from the neighborhood guide — not part of the ' +
          'original trip. Include EACH as an item with status "new", its "id" set exactly to the ' +
          'option id, scheduled in or near its neighborhood: ' +
          chosen
            .map((o) => `${o.name} (id: ${o.id}, ${o.category}, in ${o.neighborhood}) — ${o.description}`)
            .join('; '),
        {
          category: 'Additions',
          original: 'The route as traveled',
          personalized: `${chosen.length} ${chosen.length === 1 ? 'pick' : 'picks'} from the neighborhood guide`,
          reason: 'You branched beyond the original trip while choosing.',
        }
      );
    }
  }

  if (mustKeep.length) {
    add(
      'must-keep',
      `These must appear in the itinerary, each carrying its sourceExperienceId: ` +
        `${mustKeep.map((e) => `${e.name} (${e.id})`).join('; ')}.`
    );
  }
  if (removed.length) {
    add(
      'removed',
      `Explicitly removed by the traveler — do not reintroduce: ${removed
        .map((e) => e.name)
        .join('; ')}.`
    );
  }

  if (preferences.notes?.trim()) {
    add('notes', `Traveler's own words, in ${city}: "${preferences.notes.trim()}"`);
  }

  return rules;
}
