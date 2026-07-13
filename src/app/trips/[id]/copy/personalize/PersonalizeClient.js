'use client';

// Screen 3 of the copy flow: the personalization form. Answers live in the
// copy session as the user types (so back-navigation loses nothing), get
// validated with CopyTripPreferencesSchema on submit, and — when the kept
// experiences don't fit the requested days at the requested pace — surface
// the feasibility warning before continuing to the result.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import useCopyTripStore, { useCopySessionHydrated } from '@/features/copy-trip/store';
import { CopyTripPreferencesSchema } from '@/features/copy-trip/schema.mjs';
import {
  TRAVELER_TYPE_OPTIONS,
  PACE_OPTIONS,
  BUDGET_OPTIONS,
  TRANSFORMATION_OPTIONS,
} from '@/features/copy-trip/options';
import { assessFeasibility } from '@/features/copy-trip/rules.mjs';
import { getCopyGuide } from '@/features/neighborhoods/data';

const SECTION_KICKER = 'text-[11px] uppercase tracking-[0.25em] text-accent';
const FIELD_LABEL = 'text-[11px] uppercase tracking-[0.2em] text-muted';

function Section({ kicker, title, children }) {
  return (
    <section className="mt-12">
      <p className={SECTION_KICKER}>{kicker}</p>
      {title && <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// Single-choice pill row (traveler type, pace, budget)
function PillRadio({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-4 py-2 text-[13px] transition-colors duration-150 ${
              active
                ? 'bg-ink text-paper'
                : 'bg-transparent text-ink/70 ring-1 ring-ink/15 hover:ring-ink/40'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ value, min, max, onChange, unit, label }) {
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-ink/15 text-ink/70 ' +
    'transition-colors hover:ring-ink/40 disabled:opacity-30 disabled:hover:ring-ink/15';
  return (
    <div className="inline-flex items-center gap-4">
      <button
        type="button"
        className={btn}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Fewer ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[5.5rem] text-center text-[15px] text-ink">
        {value} {unit(value)}
      </span>
      <button
        type="button"
        className={btn}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`More ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

const DISPOSITIONS = [
  { value: 'must', label: 'Must keep' },
  { value: 'nice', label: 'Nice to have' },
  { value: 'remove', label: 'Remove' },
];

function DispositionControl({ value, onChange, name }) {
  return (
    <div
      role="radiogroup"
      aria-label={`Priority for ${name}`}
      className="inline-flex rounded-full ring-1 ring-ink/10 p-0.5 text-[10px] uppercase tracking-[0.12em]"
    >
      {DISPOSITIONS.map((d) => {
        const active = value === d.value;
        return (
          <button
            key={d.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d.value)}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              active
                ? d.value === 'remove'
                  ? 'bg-ink/70 text-paper'
                  : d.value === 'must'
                    ? 'bg-accent text-paper'
                    : 'bg-ink/10 text-ink'
                : 'text-ink/45 hover:text-ink'
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PersonalizeClient({ blueprint }) {
  const router = useRouter();
  const hydrated = useCopySessionHydrated();
  const session = useCopyTripStore((s) => s.session);
  const updateSession = useCopyTripStore((s) => s.updateSession);

  const byId = useMemo(
    () => new Map(blueprint.days.flatMap((d) => d.experiences.map((e) => [e.id, e]))),
    [blueprint]
  );
  const dayOfExp = useMemo(
    () =>
      new Map(
        blueprint.days.flatMap((d) => d.experiences.map((e) => [e.id, d]))
      ),
    [blueprint]
  );

  const forThisTrip = session && session.sourceTripId === blueprint.id;
  const selectedIds = useMemo(
    () => (forThisTrip ? session.selectedExperienceIds : []),
    [forThisTrip, session]
  );

  const defaults = useMemo(
    () => ({
      startDate: '',
      durationDays: blueprint.durationDays,
      travelers: 1,
      travelerType: blueprint.travelerType ?? 'solo',
      pace: blueprint.pace,
      budget: 'mid-range',
      accommodationMode: 'original',
      accommodationNeighborhood: '',
      transformations: [],
      notes: '',
    }),
    [blueprint]
  );

  const [form, setForm] = useState(defaults);

  // The neighborhood guide doubles as an informed base picker — the original
  // base itself is covered by the "original" mode, so it's excluded here.
  const baseGuide = useMemo(
    () => getCopyGuide(blueprint.id).filter((hood) => hood.name !== blueprint.baseNeighborhood),
    [blueprint]
  );
  const pickedBase = baseGuide.find((hood) => hood.name === form.accommodationNeighborhood);

  const [dispositions, setDispositions] = useState({});
  const [errors, setErrors] = useState({});
  const [warning, setWarning] = useState(null);
  const [restored, setRestored] = useState(false);

  // Restore saved answers once the persisted session arrives.
  useEffect(() => {
    if (!hydrated || restored) return;
    if (forThisTrip) {
      if (session.preferences) setForm((f) => ({ ...f, ...session.preferences }));
      const must = new Set(session.mustKeepExperienceIds ?? []);
      const gone = new Set(session.removedExperienceIds ?? []);
      const init = {};
      for (const id of session.selectedExperienceIds) {
        init[id] = must.has(id) ? 'must' : gone.has(id) ? 'remove' : 'nice';
      }
      setDispositions(init);
    }
    setRestored(true);
  }, [hydrated, restored, forThisTrip, session]);

  const patch = (partial) => {
    setForm((f) => {
      const next = { ...f, ...partial };
      updateSession({ preferences: next });
      return next;
    });
    setWarning(null);
  };

  const setDisposition = (expId, value) => {
    setDispositions((prev) => {
      const next = { ...prev, [expId]: value };
      updateSession({
        mustKeepExperienceIds: selectedIds.filter((id) => next[id] === 'must'),
        removedExperienceIds: selectedIds.filter((id) => next[id] === 'remove'),
      });
      return next;
    });
    setWarning(null);
  };

  const setTravelerType = (type) => {
    const minTravelers = type === 'solo' ? 1 : 2;
    patch({
      travelerType: type,
      travelers: type === 'solo' ? 1 : Math.max(minTravelers, form.travelers),
    });
  };

  const toggleTransformation = (value) => {
    const has = form.transformations.includes(value);
    patch({
      transformations: has
        ? form.transformations.filter((t) => t !== value)
        : [...form.transformations, value],
    });
  };

  const buildSessionLike = () => ({
    selectedExperienceIds: selectedIds,
    mustKeepExperienceIds: selectedIds.filter((id) => dispositions[id] === 'must'),
    removedExperienceIds: selectedIds.filter((id) => dispositions[id] === 'remove'),
  });

  const submit = ({ forcedPace = null, acceptOverpacked = false } = {}) => {
    const candidate = {
      ...form,
      ...(forcedPace ? { pace: forcedPace } : {}),
      notes: form.notes?.trim() || undefined,
      accommodationNeighborhood: form.accommodationNeighborhood?.trim() || undefined,
    };
    const parsed = CopyTripPreferencesSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] ?? '_'] = issue.message;
      }
      if (fieldErrors.startDate) fieldErrors.startDate = 'Pick a start date.';
      setErrors(fieldErrors);
      setWarning(null);
      return;
    }
    setErrors({});

    const sessionLike = buildSessionLike();
    const feasibility = assessFeasibility(sessionLike, parsed.data);
    if (feasibility.over && !acceptOverpacked) {
      if (forcedPace) setForm((f) => ({ ...f, pace: forcedPace }));
      setWarning(feasibility);
      return;
    }

    updateSession({
      preferences: parsed.data,
      mustKeepExperienceIds: sessionLike.mustKeepExperienceIds,
      removedExperienceIds: sessionLike.removedExperienceIds,
      status: 'configuring',
    });
    if (forcedPace) setForm((f) => ({ ...f, pace: forcedPace }));
    router.push(`/trips/${blueprint.id}/copy/result`);
  };

  if (!hydrated) return null;

  if (!forThisTrip || selectedIds.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 p-6 sm:p-8">
        <p className="text-[15px] leading-relaxed text-ink/70">
          Nothing is selected yet — choose the days and experiences to carry over first.
        </p>
        <Link
          href={`/trips/${blueprint.id}/copy/select`}
          className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                     text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-ink transition-colors duration-300"
        >
          Choose what to keep
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const keptCount = selectedIds.filter((id) => dispositions[id] !== 'remove').length;

  return (
    <div>
      <p className="mt-4 max-w-xl text-lg leading-[1.7] text-ink/75">
        A few questions, then your version gets built from the {keptCount} experiences
        you kept.
      </p>

      <Section kicker="The basics" title="Your dates and party">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <label htmlFor="copy-start-date" className={FIELD_LABEL}>
              Start date
            </label>
            <input
              id="copy-start-date"
              type="date"
              value={form.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              className="mt-2 block w-full max-w-[14rem] rounded-lg bg-transparent px-3 py-2 text-[15px]
                         text-ink ring-1 ring-ink/15 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {errors.startDate && (
              <p className="mt-2 text-[13px] text-accent">{errors.startDate}</p>
            )}
          </div>
          <div>
            <p className={FIELD_LABEL}>Days</p>
            <div className="mt-2">
              <Stepper
                value={form.durationDays}
                min={1}
                max={14}
                onChange={(v) => patch({ durationDays: v })}
                unit={(v) => (v === 1 ? 'day' : 'days')}
                label="days"
              />
            </div>
            <p className="mt-2 text-xs text-muted">The original ran {blueprint.durationDays} days.</p>
          </div>
          <div>
            <p className={FIELD_LABEL}>Who&rsquo;s going</p>
            <div className="mt-2">
              <PillRadio
                options={TRAVELER_TYPE_OPTIONS}
                value={form.travelerType}
                onChange={setTravelerType}
                label="Traveler type"
              />
            </div>
          </div>
          <div>
            <p className={FIELD_LABEL}>Travelers</p>
            <div className="mt-2">
              <Stepper
                value={form.travelers}
                min={form.travelerType === 'solo' ? 1 : 2}
                max={8}
                onChange={(v) => patch({ travelers: v })}
                unit={(v) => (v === 1 ? 'person' : 'people')}
                label="travelers"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section kicker="The rhythm" title="Pace and budget">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className={FIELD_LABEL}>Pace</p>
            <div className="mt-2">
              <PillRadio
                options={PACE_OPTIONS}
                value={form.pace}
                onChange={(v) => patch({ pace: v })}
                label="Pace"
              />
            </div>
            <p className="mt-2 text-xs text-muted">The original moved fast — 40 km in three days.</p>
          </div>
          <div>
            <p className={FIELD_LABEL}>Budget</p>
            <div className="mt-2">
              <PillRadio
                options={BUDGET_OPTIONS}
                value={form.budget}
                onChange={(v) => patch({ budget: v })}
                label="Budget"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section kicker="Where you'll stay" title="Your base">
        <div className="space-y-3">
          {[
            { mode: 'original', label: `${blueprint.baseNeighborhood} — the original base` },
            { mode: 'custom', label: 'Another neighborhood' },
            { mode: 'undecided', label: 'Not decided yet' },
          ].map(({ mode, label }) => {
            const active = form.accommodationMode === mode;
            return (
              <div key={mode}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => patch({ accommodationMode: mode })}
                  className="flex items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ring-1 transition-colors ${
                      active ? 'ring-accent' : 'ring-ink/25'
                    }`}
                  >
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </span>
                  <span className={`text-[15px] ${active ? 'text-ink' : 'text-ink/60'}`}>{label}</span>
                </button>
                {mode === 'custom' && active && (
                  <div className="ml-8 mt-3 space-y-3">
                    {baseGuide.length > 0 && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {baseGuide.map((hood) => {
                            const picked = form.accommodationNeighborhood === hood.name;
                            return (
                              <button
                                key={hood.id}
                                type="button"
                                role="radio"
                                aria-checked={picked}
                                onClick={() => patch({ accommodationNeighborhood: hood.name })}
                                className={`rounded-full px-4 py-2 text-[13px] transition-colors duration-200 ${
                                  picked
                                    ? 'bg-accent text-paper'
                                    : 'ring-1 ring-ink/15 text-ink/70 hover:ring-ink/40'
                                }`}
                              >
                                {hood.name}
                                <span className={`ml-2 text-[10px] uppercase tracking-[0.15em] ${picked ? 'text-paper/70' : 'text-muted'}`}>
                                  {hood.districts[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {pickedBase && (
                          <p className="max-w-md text-[13px] leading-relaxed text-muted">
                            {pickedBase.summary}
                          </p>
                        )}
                      </>
                    )}
                    <input
                      type="text"
                      value={form.accommodationNeighborhood}
                      onChange={(e) => patch({ accommodationNeighborhood: e.target.value })}
                      placeholder={baseGuide.length > 0 ? 'Or somewhere else…' : 'e.g. Le Marais'}
                      className="block w-full max-w-[18rem] rounded-lg bg-transparent px-3 py-2 text-[15px]
                                 text-ink ring-1 ring-ink/15 placeholder:text-ink/30
                                 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    {errors.accommodationNeighborhood && (
                      <p className="mt-2 text-[13px] text-accent">{errors.accommodationNeighborhood}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section kicker="What to change" title="Shape your version">
        <div className="flex flex-wrap gap-2">
          {TRANSFORMATION_OPTIONS.map((opt) => {
            const active = form.transformations.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleTransformation(opt.value)}
                className={`rounded-full px-4 py-2 text-[13px] transition-colors duration-150 ${
                  active
                    ? 'bg-accent/10 text-ink ring-1 ring-accent'
                    : 'text-ink/70 ring-1 ring-ink/15 hover:ring-ink/40'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section kicker="Your priorities" title="The experiences you kept">
        <p className="text-[13px] text-muted -mt-2 mb-4">
          Everything here made your cut on the last screen. Mark what the new itinerary must
          include — or let something go.
        </p>
        <ul className="divide-y divide-ink/[0.06] border-y border-ink/[0.06]">
          {selectedIds.map((id) => {
            const exp = byId.get(id);
            if (!exp) return null;
            const day = dayOfExp.get(id);
            const disposition = dispositions[id] ?? 'nice';
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0">
                  <p
                    className={`text-[15px] leading-snug ${
                      disposition === 'remove' ? 'text-ink/35 line-through' : 'text-ink'
                    }`}
                  >
                    {exp.name}
                  </p>
                  <p className="text-xs text-muted">
                    Day {day?.dayNumber}
                    {exp.neighborhood ? ` · ${exp.neighborhood}` : ''}
                  </p>
                </div>
                <DispositionControl
                  value={disposition}
                  onChange={(v) => setDisposition(id, v)}
                  name={exp.name}
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section kicker="Anything else" title="In your own words">
        <label htmlFor="copy-notes" className="sr-only">
          Anything else we should change?
        </label>
        <textarea
          id="copy-notes"
          rows={3}
          maxLength={600}
          value={form.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="For example: I want one museum each day, no activities before 10 AM, and one special dinner."
          className="block w-full rounded-xl bg-transparent px-4 py-3 text-[15px] leading-relaxed
                     text-ink ring-1 ring-ink/15 placeholder:text-ink/30
                     focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </Section>

      {warning && (
        <div className="mt-10 rounded-2xl bg-accent/[0.07] ring-1 ring-accent/30 p-6" role="alert">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Worth a look</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            You&rsquo;ve kept {warning.count} experiences across {warning.days}{' '}
            {warning.days === 1 ? 'day' : 'days'} — about {warning.perDay} a day, more than a{' '}
            {form.pace} pace comfortably fits (~{warning.limit}).
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() =>
                form.pace === 'fast' || !warning.fitsFast
                  ? submit({ acceptOverpacked: true })
                  : submit({ forcedPace: 'fast' })
              }
              className="inline-flex items-center gap-2.5 rounded-full bg-accent px-5 py-2.5
                         text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-ink transition-colors duration-300"
            >
              {form.pace === 'fast' || !warning.fitsFast
                ? 'Build it anyway'
                : 'Build a fast-paced version'}
            </button>
            <Link
              href={`/trips/${blueprint.id}/copy/select`}
              className="text-[11px] uppercase tracking-[0.2em] text-ink/60 hover:text-ink transition-colors"
            >
              Review selections
            </Link>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => submit()}
          className="inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5
                     text-[11px] uppercase tracking-[0.2em] text-paper shadow-sm
                     transition-colors duration-300 hover:bg-ink"
        >
          Build my version
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <span className="text-[13px] text-muted">
          {keptCount} experiences ·{' '}
          {selectedIds.filter((id) => dispositions[id] === 'must').length} must-keep
        </span>
      </div>
    </div>
  );
}
