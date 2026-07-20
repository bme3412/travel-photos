'use client';

import Link from 'next/link';
import { tripHasBlueprint } from '@/features/copy-trip/availability';
import { copyFlowHref } from '@/features/copy-trip/routes';
import { storyHref } from '@/features/destinations/data';

// The persistent per-trip view control: Replay · Story · Photos.
//
// Optional `context` keeps day/scene focus when hopping between lenses:
//   { sceneId: 'day-2', dayDate: '2026-06-20' }
//
// `mode="film"` (replay surface): Story/Photos as quiet text links + a strong
// Copy CTA — no equal pill cluster fighting the day scrubber.
// Default mode keeps the pill switcher for Story and Photos pages.
const VIEWS = [
  {
    key: 'replay',
    label: 'Replay',
    href: (id, ctx) =>
      ctx?.sceneId ? `/trips/${id}#${ctx.sceneId}` : `/trips/${id}`,
  },
  {
    key: 'story',
    label: 'Story',
    href: (id) => storyHref(id),
  },
  {
    key: 'photos',
    label: 'Photos',
    href: (id, ctx) =>
      ctx?.dayDate ? `/albums/${id}?day=${ctx.dayDate}` : `/albums/${id}`,
  },
];

export default function TripViewSwitcher({
  tripId,
  active,
  variant = 'dark',
  context = null,
  mode = 'default',
  showCopy = true,
}) {
  const light = variant === 'light';
  const canCopy = tripHasBlueprint(tripId);

  if (mode === 'film') {
    const support = VIEWS.filter((view) => view.key !== 'replay');
    return (
      <div className="pointer-events-auto inline-flex items-center gap-3 sm:gap-4">
        <nav
          aria-label="Trip support views"
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]"
        >
          {support.map((view) => (
            <Link
              key={view.key}
              href={view.href(tripId, context)}
              className="text-paper/70 transition-colors hover:text-paper"
            >
              {view.label}
            </Link>
          ))}
        </nav>
        {canCopy && showCopy && (
          <Link
            href={copyFlowHref(tripId, 'select')}
            className="rounded-full bg-accent px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-paper
                       shadow-sm transition-colors duration-300 hover:bg-paper hover:text-ink"
          >
            <span className="hidden sm:inline">Copy this trip</span>
            <span className="sm:hidden">Copy</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="pointer-events-auto inline-flex items-center gap-2">
      <nav
        aria-label="Trip views"
        className={`inline-flex items-center rounded-full p-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm ${
          light ? 'bg-ink/5 ring-1 ring-ink/10' : 'bg-paper/90 shadow-sm'
        }`}
      >
        {VIEWS.map((view) =>
          view.key === active ? (
            <span
              key={view.key}
              aria-current="page"
              className="rounded-full bg-ink px-3.5 py-1.5 text-paper"
            >
              {view.label}
            </span>
          ) : (
            <Link
              key={view.key}
              href={view.href(tripId, context)}
              className="rounded-full px-3.5 py-1.5 text-ink/60 transition-colors hover:text-ink"
            >
              {view.label}
            </Link>
          )
        )}
      </nav>
      {canCopy && showCopy && (
        <Link
          href={copyFlowHref(tripId)}
          className="rounded-full bg-accent px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-paper
                     shadow-sm transition-colors duration-300 hover:bg-ink"
        >
          <span className="hidden sm:inline">Copy this trip</span>
          <span className="sm:hidden">Copy</span>
        </Link>
      )}
    </div>
  );
}
