'use client';

// The read-only view of a shared plan. The plan arrives in the URL
// fragment, is decoded and validated client-side (a bad link shows the
// invalid state, never a crash), and renders with full provenance — the
// drawer still traces every kept stop to its source moment. Doubles as
// the print/PDF export: the action chrome is print-hidden.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Printer } from 'lucide-react';
import ItinerarySection from '../result/ItinerarySection';
import ProvenanceDrawer from '../result/ProvenanceDrawer';
import { decodeSharePayload } from '@/features/copy-trip/share.mjs';
import { CopiedTripPlanSchema } from '@/features/copy-trip/schema.mjs';
import { copyFlowHref } from '@/features/copy-trip/routes';
import { addDaysIso, formatDateRange, titleCase } from '@/features/copy-trip/format.mjs';

export default function SharedClient({ blueprint, photoUrlById = {} }) {
  const [state, setState] = useState({ status: 'loading' });
  const [drawerExperienceId, setDrawerExperienceId] = useState(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#p=/, '');
    let cancelled = false;
    (async () => {
      const payload = hash ? await decodeSharePayload(decodeURIComponent(hash)) : null;
      const parsed = payload?.plan ? CopiedTripPlanSchema.safeParse(payload.plan) : null;
      if (cancelled) return;
      if (!parsed?.success || payload.tripId !== blueprint.id) {
        setState({ status: 'invalid' });
      } else {
        setState({ status: 'ready', plan: parsed.data, prefs: payload.prefs ?? null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blueprint.id]);

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

  const city = blueprint.destination.split(',')[0];

  if (state.status === 'loading') return null;

  if (state.status === 'invalid') {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-24">
          <div className="mt-16 rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Shared trip</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              This share link is incomplete or damaged — ask for it to be sent again, or start
              your own version from the original trip.
            </p>
            <Link
              href={copyFlowHref(blueprint.id)}
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

  const { plan, prefs } = state;
  const facts = prefs
    ? [
        prefs.startDate && prefs.durationDays
          ? {
              label: 'Dates',
              value: formatDateRange(prefs.startDate, addDaysIso(prefs.startDate, prefs.durationDays - 1)),
            }
          : null,
        { label: 'Length', value: `${plan.durationDays} ${plan.durationDays === 1 ? 'day' : 'days'}` },
        prefs.travelerType
          ? { label: 'Party', value: titleCase(prefs.travelerType) }
          : null,
        prefs.pace ? { label: 'Pace', value: titleCase(prefs.pace) } : null,
      ].filter(Boolean)
    : [{ label: 'Length', value: `${plan.durationDays} ${plan.durationDays === 1 ? 'day' : 'days'}` }];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-24">
        <header className="mt-8 sm:mt-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-4">
            Copy this trip · A shared version of {city}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
            {plan.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-[1.7] text-ink/75">{plan.summary}</p>
        </header>

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{f.label}</dt>
              <dd className="mt-1 text-[15px] text-ink/90">{f.value}</dd>
            </div>
          ))}
        </dl>

        <ItinerarySection plan={plan} onViewSource={setDrawerExperienceId} heading="The itinerary" />

        <p className="mt-8 text-[13px] leading-relaxed text-muted">
          Every stop marked &ldquo;From original&rdquo; traces back to a moment that really
          happened on the {city} trip — tap &ldquo;View original moment&rdquo; to see it.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4 print:hidden">
          <Link
            href={copyFlowHref(blueprint.id)}
            className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                       text-[11px] uppercase tracking-[0.2em] text-paper shadow-sm
                       transition-colors duration-300 hover:bg-ink"
          >
            Make your own copy
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/trips/${blueprint.id}`}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]
                       text-ink/60 hover:text-ink transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Replay the original trip
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]
                       text-ink/60 hover:text-ink transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / save as PDF
          </button>
        </div>
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
