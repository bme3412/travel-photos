'use client';

// The result of the copy flow. Arriving here with preferences set kicks off
// generation against /api/copy-trip/generate (guarded against duplicate
// submissions); the returned CopiedTripPlan is persisted into the copy
// session, so reloads render instantly without a rebuild. While the builder
// runs, the deterministic comparison cards from rules.mjs preview what will
// change; once the plan lands, the plan's own comparison takes over.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, RefreshCw, Ticket } from 'lucide-react';
import useCopyTripStore, { useCopySessionHydrated } from '@/features/copy-trip/store';
import ProvenanceDrawer from './ProvenanceDrawer';
import ItinerarySection from './ItinerarySection';
import { deriveTransformationRules, effectiveExperienceIds } from '@/features/copy-trip/rules.mjs';
import { addDaysIso, formatDateRange, titleCase } from '@/features/copy-trip/format.mjs';
import { BUDGET_OPTIONS } from '@/features/copy-trip/options';

const GENERATION_STAGES = [
  'Reading the original trip',
  'Grouping nearby experiences',
  'Adjusting the pace',
  'Building your itinerary',
];

function GenerationProgress() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    // A build runs ~2 minutes; pace the stages so the last one holds
    // while the itinerary is actually being written.
    const timer = setInterval(
      () => setStage((s) => Math.min(s + 1, GENERATION_STAGES.length - 1)),
      15_000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mt-14 rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 p-6 sm:p-8" aria-live="polite">
      <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Building your version</p>
      <ul className="mt-5 space-y-3">
        {GENERATION_STAGES.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-[15px]">
            <span
              className={`h-2 w-2 rounded-full ${
                i < stage ? 'bg-ink/30' : i === stage ? 'animate-pulse bg-accent' : 'bg-ink/10'
              }`}
            />
            <span className={i === stage ? 'text-ink' : i < stage ? 'text-ink/45' : 'text-ink/30'}>
              {label}
              {i === stage && '…'}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13px] text-muted">This takes a couple of minutes — worth the wait.</p>
    </section>
  );
}

function ComparisonCards({ comparisons, heading }) {
  if (!comparisons?.length) return null;
  return (
    <section className="mt-14">
      <p className="text-[11px] uppercase tracking-[0.25em] text-accent">{heading}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {comparisons.map((c, i) => (
          <div key={`${c.category}-${i}`} className="rounded-2xl bg-white/60 ring-1 ring-ink/10 p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{c.category}</p>
            <div className="mt-3 space-y-1.5 text-[15px]">
              <p className="text-ink/45">
                <span className="text-[11px] uppercase tracking-[0.15em] mr-2">Original</span>
                {c.original}
              </p>
              <p className="text-ink">
                <span className="text-[11px] uppercase tracking-[0.15em] mr-2 text-accent">Yours</span>
                {c.personalized}
              </p>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{c.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ResultClient({ blueprint, photoUrlById = {} }) {
  const hydrated = useCopySessionHydrated();
  const session = useCopyTripStore((s) => s.session);
  const updateSession = useCopyTripStore((s) => s.updateSession);
  const applyPlanEdit = useCopyTripStore((s) => s.applyPlanEdit);
  const saveTrip = useCopyTripStore((s) => s.saveTrip);
  const restoreSavedTrip = useCopyTripStore((s) => s.restoreSavedTrip);
  const savedTrip = useCopyTripStore((s) => s.savedTrips?.[blueprint.id]);

  const city = blueprint.destination.split(',')[0];
  const ready = Boolean(
    hydrated && session && session.sourceTripId === blueprint.id && session.preferences
  );
  const plan = ready ? session.generatedPlan : null;

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [drawerExperienceId, setDrawerExperienceId] = useState(null);
  const inFlight = useRef(false);

  // Provenance lookup: experience id -> { experience, day } in the blueprint.
  const sourceById = useMemo(() => {
    const map = new Map();
    for (const day of blueprint.days) {
      for (const experience of day.experiences) {
        map.set(experience.id, { experience, day });
      }
    }
    return map;
  }, [blueprint]);
  const drawerSource = drawerExperienceId ? sourceById.get(drawerExperienceId) : null;

  const rules = useMemo(
    () => (ready ? deriveTransformationRules(blueprint, session, session.preferences) : []),
    [ready, blueprint, session]
  );

  const generate = async ({ regenerate = false } = {}) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setGenerating(true);
    setGenerationError(null);
    updateSession({ status: 'generating' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 280_000);
    try {
      const res = await fetch('/api/copy-trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          tripId: blueprint.id,
          selectedExperienceIds: session.selectedExperienceIds,
          mustKeepExperienceIds: session.mustKeepExperienceIds ?? [],
          removedExperienceIds: session.removedExperienceIds ?? [],
          preferences: session.preferences,
          regenerate,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `The builder failed (${res.status}).`);
      // Revision bookkeeping: edits bump planRevision past planBaseRevision,
      // which is how "you have unsaved edits" is detected.
      const rev = (session.planRevision ?? 0) + 1;
      updateSession({
        generatedPlan: data.plan,
        status: 'complete',
        planRevision: rev,
        planBaseRevision: rev,
      });
    } catch (error) {
      const message =
        error?.name === 'AbortError'
          ? 'The builder took too long. Try again — it usually works on a second attempt.'
          : error?.message || 'Something went wrong building the itinerary.';
      setGenerationError(message);
      updateSession({ status: 'error' });
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
      inFlight.current = false;
    }
  };

  // If the active session moved on (or was reset) but this trip has a saved
  // version, bring the saved version back as the working session.
  useEffect(() => {
    if (hydrated && !ready && savedTrip) restoreSavedTrip(blueprint.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ready, savedTrip, blueprint.id]);

  // Arriving here after "Build my version" starts the build once — a saved
  // plan (or an error being shown) does not.
  useEffect(() => {
    if (ready && !session.generatedPlan && !generationError && !inFlight.current) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!hydrated) return null;

  // A restore is about to run — don't flash the empty state.
  if (!ready && savedTrip) return null;

  if (!ready) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-24">
          <div className="mt-16 rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 p-6 sm:p-8">
            <p className="text-[15px] leading-relaxed text-ink/70">
              There&rsquo;s no personalized version in progress for this trip yet.
            </p>
            <Link
              href={`/trips/${blueprint.id}/copy`}
              className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                         text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-ink transition-colors duration-300"
            >
              Start from the original trip
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // "Saved" means the saved snapshot is this exact session at this exact
  // edit revision; anything else (edits, a regeneration, a different run)
  // shows Save/Save changes. Unsaved *edits* additionally guard Regenerate.
  const savedMatches = Boolean(
    plan &&
      savedTrip &&
      savedTrip.id === session.id &&
      (savedTrip.planRevision ?? 0) === (session.planRevision ?? 0)
  );
  const hasUnsavedEdits =
    Boolean(plan) &&
    !savedMatches &&
    (session.planRevision ?? 0) > (session.planBaseRevision ?? 0);

  const prefs = session.preferences;
  const endDate = addDaysIso(prefs.startDate, prefs.durationDays - 1);
  const keptCount = effectiveExperienceIds(session).length;
  const mustKeepCount = (session.mustKeepExperienceIds ?? []).filter((id) =>
    session.selectedExperienceIds.includes(id)
  ).length;
  const budgetLabel = BUDGET_OPTIONS.find((b) => b.value === prefs.budget)?.label;
  const derivedComparisons = rules.filter((r) => r.comparison).map((r) => r.comparison);

  const summary = [
    { label: 'Dates', value: formatDateRange(prefs.startDate, endDate) },
    { label: 'Length', value: `${prefs.durationDays} ${prefs.durationDays === 1 ? 'day' : 'days'}` },
    {
      label: 'Party',
      value: `${titleCase(prefs.travelerType)} · ${prefs.travelers} ${
        prefs.travelers === 1 ? 'traveler' : 'travelers'
      }`,
    },
    { label: 'Pace', value: titleCase(prefs.pace) },
    { label: 'Budget', value: budgetLabel },
    {
      label: 'Base',
      value:
        prefs.accommodationMode === 'custom'
          ? prefs.accommodationNeighborhood
          : prefs.accommodationMode === 'undecided'
            ? 'To be decided'
            : blueprint.baseNeighborhood,
    },
    { label: 'From the original', value: `${keptCount} experiences · ${mustKeepCount} must-keep` },
  ].filter((f) => f.value);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-24">
        <div className="flex items-center justify-between">
          <Link
            href={`/trips/${blueprint.id}/copy/personalize`}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                       hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Edit preferences
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {blueprint.destination}
          </span>
        </div>

        <header className="mt-12 sm:mt-14">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-4">
            Copy this trip · Your version
          </p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
            {plan?.title || `Your version of ${city}`}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-[1.7] text-ink/75">
            {plan?.summary ||
              `${prefs.durationDays} ${prefs.pace}-paced ${
                prefs.durationDays === 1 ? 'day' : 'days'
              } based on the original ${blueprint.durationDays}-day ${city} trip.`}
          </p>
        </header>

        <dl className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
          {summary.map((f) => (
            <div key={f.label}>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{f.label}</dt>
              <dd className="mt-1 text-[15px] text-ink/90">{f.value}</dd>
            </div>
          ))}
        </dl>

        {generating && (
          <>
            <GenerationProgress />
            <ComparisonCards comparisons={derivedComparisons} heading="How your version will change" />
          </>
        )}

        {!generating && generationError && (
          <section className="mt-14 rounded-2xl bg-accent/[0.07] ring-1 ring-accent/30 p-6 sm:p-8" role="alert">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent">The builder hit a snag</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{generationError}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => generate()}
                className="inline-flex items-center gap-2.5 rounded-full bg-accent px-5 py-2.5
                           text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-ink transition-colors duration-300"
              >
                Try again
              </button>
              <Link
                href={`/trips/${blueprint.id}/copy/personalize`}
                className="text-[11px] uppercase tracking-[0.2em] text-ink/60 hover:text-ink transition-colors"
              >
                Edit preferences
              </Link>
            </div>
          </section>
        )}

        {!generating && plan && (
          <>
            {plan.transformationSummary && (
              <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-ink/65">
                {plan.transformationSummary}
              </p>
            )}

            <ComparisonCards
              comparisons={plan.comparison?.length ? plan.comparison : derivedComparisons}
              heading="How your version changed"
            />

            {plan.warnings?.length > 0 && (
              <section className="mt-10 rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Worth checking</p>
                <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink/70">
                  {plan.warnings.map((w, i) => (
                    <li key={i} className="flex gap-3">
                      <Ticket className="mt-1 h-3.5 w-3.5 shrink-0 text-accent/70" />
                      {w}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ItinerarySection
              plan={plan}
              onViewSource={setDrawerExperienceId}
              onApplyEdit={applyPlanEdit}
            />

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
              {savedMatches ? (
                <span className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[11px]
                                 uppercase tracking-[0.2em] text-ink/60 ring-1 ring-ink/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  Saved
                </span>
              ) : (
                <button
                  type="button"
                  onClick={saveTrip}
                  className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                             text-[11px] uppercase tracking-[0.2em] text-paper shadow-sm
                             transition-colors duration-300 hover:bg-ink"
                >
                  {savedTrip ? 'Save changes' : 'Save trip'}
                </button>
              )}
              <p className="text-[13px] text-muted">
                {savedMatches
                  ? 'This version is kept in this browser.'
                  : savedTrip
                    ? 'You have changes that aren’t in your saved version.'
                    : 'Keeps this version in this browser.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (
                    hasUnsavedEdits &&
                    !window.confirm('Regenerating will replace your unsaved edits. Continue?')
                  ) {
                    return;
                  }
                  generate({ regenerate: true });
                }}
                className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]
                           text-ink/60 hover:text-ink transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
                Regenerate
              </button>
            </div>
          </>
        )}
      </div>

      {drawerSource && (
        <ProvenanceDrawer
          tripId={blueprint.id}
          experience={drawerSource.experience}
          day={drawerSource.day}
          photoUrlById={photoUrlById}
          onClose={() => setDrawerExperienceId(null)}
        />
      )}
    </main>
  );
}
