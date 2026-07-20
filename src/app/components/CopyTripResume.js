'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark } from 'lucide-react';
import useCopyTripStore, { useCopySessionHydrated } from '@/features/copy-trip/store';
import { copyFlowHref } from '@/features/copy-trip/routes';

function sessionHref(session) {
  const base = copyFlowHref(session.sourceTripId);
  if (session.generatedPlan || ['generating', 'complete', 'error'].includes(session.status)) {
    return `${base}/result`;
  }
  if (session.status === 'configuring') return `${base}/personalize`;
  return `${base}/select`;
}

export default function CopyTripResume({ trips = [] }) {
  const hydrated = useCopySessionHydrated();
  const session = useCopyTripStore((state) => state.session);
  const savedTrips = useCopyTripStore((state) => state.savedTrips);

  if (!hydrated) return null;

  const latestSaved = Object.values(savedTrips ?? {}).sort((a, b) =>
    String(b.savedAt ?? '').localeCompare(String(a.savedAt ?? ''))
  )[0];
  const resumable = session ?? latestSaved;
  if (!resumable) return null;

  const trip = trips.find((item) => item.id === resumable.sourceTripId);
  const destination = trip?.destination ?? resumable.sourceTripId.replace(/-\d{4}$/, '');
  const isComplete = Boolean(resumable.generatedPlan);

  return (
    <aside className="max-w-7xl mx-auto px-6 pt-8" aria-label="Continue your copied trip">
      <div className="flex flex-col gap-4 border-y border-ink/15 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Bookmark className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
              {isComplete ? 'Your saved trip' : 'Pick up where you left off'}
            </p>
            <p className="mt-1 font-display text-xl tracking-tight">{destination}</p>
          </div>
        </div>
        <Link
          href={sessionHref(resumable)}
          className="group inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em] text-accent sm:self-auto"
        >
          {isComplete ? 'Open your itinerary' : 'Continue your trip'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </aside>
  );
}
