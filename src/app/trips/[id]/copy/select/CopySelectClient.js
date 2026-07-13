'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Minus, Plus, Ticket } from 'lucide-react';
import useCopyTripStore, { useCopySessionHydrated } from '@/features/copy-trip/store';
import { fmtTime12 } from '@/features/copy-trip/format.mjs';
import { getCopyGuide } from '@/features/neighborhoods/data';

const CATEGORY_LABELS = {
  food: 'Food',
  landmark: 'Landmark',
  neighborhood: 'Neighborhood',
  tour: 'Tour',
  transport: 'Transport',
  shopping: 'Shopping',
  nightlife: 'Nightlife',
  rest: 'Rest',
  other: 'Moment',
};

// Tri-state check control shared by day headers (all/some/none) and
// experience rows (on/off).
function CheckControl({ state, onToggle, label }) {
  const checked = state === 'all';
  const partial = state === 'some';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? 'mixed' : checked}
      aria-label={label}
      onClick={onToggle}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors duration-150 ${
        checked || partial
          ? 'bg-accent text-paper'
          : 'bg-transparent ring-1 ring-inset ring-ink/30 hover:ring-ink/60'
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {partial && <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  );
}

function ExperienceRow({ experience, selected, onToggle }) {
  const meta = [
    fmtTime12(experience.approximateStartTime),
    experience.approximateDurationMinutes ? `${experience.approximateDurationMinutes} min` : null,
    CATEGORY_LABELS[experience.category] || experience.category,
    experience.neighborhood,
  ].filter(Boolean);

  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="pt-0.5">
        <CheckControl
          state={selected ? 'all' : 'none'}
          onToggle={onToggle}
          label={`Keep "${experience.name}"`}
        />
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="min-w-0 flex-1 text-left"
      >
        <span className={`block text-[15px] leading-snug transition-colors ${selected ? 'text-ink' : 'text-ink/45'}`}>
          {experience.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
          {meta.join(' · ')}
          {experience.sourcePhotoIds.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {experience.sourcePhotoIds.length}
            </span>
          )}
          {experience.bookingRequired && (
            <span className="inline-flex items-center gap-1 text-accent/90">
              <Ticket className="h-3 w-3" />
              Booked activity
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function DayCard({ day, photoUrlById, selectedIds, onToggleDay, onToggleExperience, expanded, onToggleExpanded }) {
  const expIds = day.experiences.map((e) => e.id);
  const selectedCount = expIds.filter((eid) => selectedIds.has(eid)).length;
  const dayState = selectedCount === 0 ? 'none' : selectedCount === expIds.length ? 'all' : 'some';

  const thumbs = (day.route || [])
    .map((pt) => pt.photoId)
    .filter((pid) => pid && photoUrlById[pid])
    .filter((_, i, arr) => i % Math.ceil(arr.length / 5) === 0)
    .slice(0, 5);

  const meta = [
    day.distanceKm != null ? `${day.distanceKm} km captured` : null,
    day.startTime && day.endTime ? `${fmtTime12(day.startTime)} – ${fmtTime12(day.endTime)}` : null,
    `${(day.route || []).length} photos`,
  ].filter(Boolean);

  return (
    <section className="rounded-2xl bg-white/60 ring-1 ring-ink/10 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <CheckControl
            state={dayState}
            onToggle={() => onToggleDay(day, dayState)}
            label={`Keep all of day ${day.dayNumber}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent">
            Day {day.dayNumber}
            {day.weather ? ` · ${day.weather.highF}°F` : ''}
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight leading-tight">{day.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{day.summary}</p>
          <p className="mt-3 text-xs text-muted">{meta.join(' · ')}</p>
          <p className="mt-1 text-xs text-muted">{day.neighborhoods.join(' · ')}</p>

          {thumbs.length > 0 && (
            <div className="mt-4 flex gap-2">
              {thumbs.map((pid) => (
                <div key={pid} className="relative h-14 w-14 overflow-hidden rounded-lg bg-ink/5">
                  <Image
                    src={photoUrlById[pid]}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ink/60
                       hover:text-ink transition-colors"
          >
            {selectedCount} of {expIds.length} experiences kept
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {expanded && (
            <ul className="mt-2 divide-y divide-ink/[0.06] border-t border-ink/[0.06]">
              {day.experiences.map((exp) => (
                <ExperienceRow
                  key={exp.id}
                  experience={exp}
                  selected={selectedIds.has(exp.id)}
                  onToggle={() => onToggleExperience(exp.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// A curated addition from the neighborhood guide — selecting it branches
// the copy beyond the original route.
function OptionRow({ option, added, onToggle }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={added}
        aria-label={`Add "${option.name}"`}
        onClick={onToggle}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
          added ? 'bg-accent text-paper' : 'bg-transparent ring-1 ring-inset ring-accent/40 text-accent hover:ring-accent'
        }`}
      >
        {added ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
        <span className={`block text-[15px] leading-snug ${added ? 'text-ink' : 'text-ink/70'}`}>
          {option.name}
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-accent/80">
            {CATEGORY_LABELS[option.category] || option.category}
          </span>
        </span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{option.description}</span>
        {option.bookingRequired && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent/90">
            <Ticket className="h-3 w-3" />
            Booked activity
          </span>
        )}
      </button>
    </li>
  );
}

function NeighborhoodCard({
  hood,
  experiences,
  photoUrlById,
  selectedIds,
  addOnIds,
  onToggleExperience,
  onToggleOption,
}) {
  const selectedCount = experiences.filter((e) => selectedIds.has(e.id)).length;
  const addedCount = hood.copyOptions.filter((o) => addOnIds.has(o.id)).length;
  const thumbs = experiences
    .flatMap((e) => e.sourcePhotoIds)
    .filter((pid) => photoUrlById[pid])
    .slice(0, 5);

  return (
    <section className="rounded-2xl bg-white/60 ring-1 ring-ink/10 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight leading-tight">{hood.name}</h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {hood.districts.join(' · ')}
        </span>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{hood.summary}</p>

      {thumbs.length > 0 && (
        <div className="mt-4 flex gap-2">
          {thumbs.map((pid) => (
            <div key={pid} className="relative h-14 w-14 overflow-hidden rounded-lg bg-ink/5">
              <Image src={photoUrlById[pid]} alt="" fill sizes="56px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {experiences.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
            From my trip · {selectedCount} of {experiences.length} kept
          </p>
          <ul className="mt-1 divide-y divide-ink/[0.06]">
            {experiences.map((exp) => (
              <ExperienceRow
                key={exp.id}
                experience={exp}
                selected={selectedIds.has(exp.id)}
                onToggle={() => onToggleExperience(exp.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {hood.copyOptions.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent">
            More options here{addedCount > 0 ? ` · ${addedCount} added` : ''}
          </p>
          <ul className="mt-1 divide-y divide-ink/[0.06]">
            {hood.copyOptions.map((option) => (
              <OptionRow
                key={option.id}
                option={option}
                added={addOnIds.has(option.id)}
                onToggle={() => onToggleOption(option.id)}
              />
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/neighborhoods/${hood.id}`}
        className="mt-4 inline-block text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors"
      >
        Read more about {hood.name} →
      </Link>
    </section>
  );
}

export default function CopySelectClient({ blueprint, photoUrlById }) {
  const router = useRouter();
  const hydrated = useCopySessionHydrated();
  const session = useCopyTripStore((s) => s.session);
  const beginSession = useCopyTripStore((s) => s.beginSession);
  const setSelectedExperienceIds = useCopyTripStore((s) => s.setSelectedExperienceIds);
  const updateSession = useCopyTripStore((s) => s.updateSession);
  const toggleAddOnOption = useCopyTripStore((s) => s.toggleAddOnOption);

  const allIds = useMemo(
    () => blueprint.days.flatMap((d) => d.experiences.map((e) => e.id)),
    [blueprint]
  );

  // The neighborhood guide: registry entries for this city, each carrying
  // this trip's experiences plus the owner's curated extra options.
  const guide = useMemo(() => getCopyGuide(blueprint.id), [blueprint.id]);
  const experiencesById = useMemo(
    () => new Map(blueprint.days.flatMap((d) => d.experiences.map((e) => [e.id, e]))),
    [blueprint]
  );
  const claimedIds = useMemo(
    () => new Set(guide.flatMap((hood) => hood.experienceIds)),
    [guide]
  );
  const unclaimed = useMemo(
    () => allIds.filter((eid) => !claimedIds.has(eid)).map((eid) => experiencesById.get(eid)),
    [allIds, claimedIds, experiencesById]
  );

  // Neighborhood-first when the guide has content for this trip.
  const [view, setView] = useState(guide.length > 0 ? 'neighborhood' : 'day');
  const addOnIds = useMemo(
    () =>
      new Set(
        session && session.sourceTripId === blueprint.id ? session.addOnOptionIds ?? [] : []
      ),
    [session, blueprint.id]
  );

  // Everything starts selected: the mental model is "start from the real
  // trip and prune", not "build up from nothing".
  useEffect(() => {
    if (hydrated) beginSession(blueprint.id, allIds);
  }, [hydrated, blueprint.id, allIds, beginSession]);

  const selectedIds = useMemo(() => {
    const ids =
      session && session.sourceTripId === blueprint.id
        ? session.selectedExperienceIds
        : allIds;
    return new Set(ids);
  }, [session, blueprint.id, allIds]);

  const [expandedDays, setExpandedDays] = useState(() => new Set([blueprint.days[0]?.id]));

  const applySelection = (nextSet) => setSelectedExperienceIds(allIds.filter((eid) => nextSet.has(eid)));

  const toggleExperience = (expId) => {
    const next = new Set(selectedIds);
    if (next.has(expId)) next.delete(expId);
    else next.add(expId);
    applySelection(next);
  };

  const toggleDay = (day, dayState) => {
    const next = new Set(selectedIds);
    const expIds = day.experiences.map((e) => e.id);
    if (dayState === 'all') expIds.forEach((eid) => next.delete(eid));
    else expIds.forEach((eid) => next.add(eid));
    applySelection(next);
  };

  const toggleExpanded = (dayId) =>
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });

  const selectedCount = selectedIds.size;

  const continueToPersonalize = () => {
    if (selectedCount === 0) return;
    const selectedDayIds = blueprint.days
      .filter((d) => d.experiences.every((e) => selectedIds.has(e.id)))
      .map((d) => d.id);
    updateSession({ selectedDayIds, status: 'configuring' });
    router.push(`/trips/${blueprint.id}/copy/personalize`);
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-36">
        <div className="flex items-center justify-between">
          <Link
            href={`/trips/${blueprint.id}/copy`}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                       hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Overview
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {blueprint.destination}
          </span>
        </div>

        <header className="mt-12 sm:mt-14">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-4">
            Copy this trip · Step 2 of 3
          </p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
            Choose what to keep
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-[1.7] text-ink/75">
            Keep whole days or hand-pick experiences — or browse by neighborhood and branch beyond
            the route with picks from the guide. Everything stays traceable.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] uppercase tracking-[0.2em]">
            {guide.length > 0 && (
              <div className="flex rounded-full ring-1 ring-ink/15 p-0.5" role="tablist" aria-label="Browse by">
                {[
                  { key: 'neighborhood', label: 'By neighborhood' },
                  { key: 'day', label: 'By day' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={view === key}
                    onClick={() => setView(key)}
                    className={`rounded-full px-4 py-1.5 transition-colors duration-200 ${
                      view === key ? 'bg-accent text-paper' : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => applySelection(new Set(allIds))}
              className="text-ink/60 hover:text-ink transition-colors"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => applySelection(new Set())}
              className="text-ink/60 hover:text-ink transition-colors"
            >
              Clear all
            </button>
          </div>
        </header>

        {view === 'neighborhood' ? (
          <div className="mt-8 space-y-5">
            {guide.map((hood) => (
              <NeighborhoodCard
                key={hood.id}
                hood={hood}
                experiences={hood.experienceIds.map((eid) => experiencesById.get(eid)).filter(Boolean)}
                photoUrlById={photoUrlById}
                selectedIds={selectedIds}
                addOnIds={addOnIds}
                onToggleExperience={toggleExperience}
                onToggleOption={toggleAddOnOption}
              />
            ))}
            {unclaimed.length > 0 && (
              <section className="rounded-2xl bg-white/60 ring-1 ring-ink/10 p-5 sm:p-6">
                <h2 className="font-display text-2xl tracking-tight leading-tight">
                  Elsewhere on the trip
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/70">
                  Moments that don&rsquo;t belong to one quarter — arrivals, crossings, and the bits
                  between neighborhoods.
                </p>
                <ul className="mt-3 divide-y divide-ink/[0.06]">
                  {unclaimed.map((exp) => (
                    <ExperienceRow
                      key={exp.id}
                      experience={exp}
                      selected={selectedIds.has(exp.id)}
                      onToggle={() => toggleExperience(exp.id)}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {blueprint.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                photoUrlById={photoUrlById}
                selectedIds={selectedIds}
                onToggleDay={toggleDay}
                onToggleExperience={toggleExperience}
                expanded={expandedDays.has(day.id)}
                onToggleExpanded={() => toggleExpanded(day.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky continue bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-ink/10 bg-paper/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <p className="text-[13px] text-muted">
            {selectedCount === 0 ? (
              <span className="text-accent">Keep at least one experience to continue.</span>
            ) : (
              <>
                <span className="text-ink">{selectedCount}</span> of {allIds.length} experiences kept
                {addOnIds.size > 0 && (
                  <>
                    {' · '}
                    <span className="text-accent">+{addOnIds.size}</span>{' '}
                    {addOnIds.size === 1 ? 'addition' : 'additions'}
                  </>
                )}
              </>
            )}
          </p>
          <button
            type="button"
            onClick={continueToPersonalize}
            disabled={selectedCount === 0}
            className={`inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[11px] uppercase
                        tracking-[0.2em] transition-colors duration-300 ${
                          selectedCount === 0
                            ? 'cursor-not-allowed bg-ink/10 text-ink/35'
                            : 'bg-accent text-paper shadow-sm hover:bg-ink'
                        }`}
          >
            Personalize my version
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </main>
  );
}
