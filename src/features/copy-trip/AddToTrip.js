'use client';

// "+ Add to my trip" for individual experiences inside the replay. The
// button seeds or grows the copy session in place; the toast confirms and
// links onward without ever interrupting the replay — the trip-level
// "Copy this trip" CTA stays the primary path.

import { useEffect } from 'react';
import Link from 'next/link';
import { create } from 'zustand';
import { Check, Plus } from 'lucide-react';
import useCopyTripStore, { useCopySessionHydrated } from './store';

// Ephemeral toast state, shared by every button on the page.
const useToastStore = create((set) => ({
  toast: null, // { name, outcome }
  timer: null,
  show(name, outcome) {
    set((state) => {
      if (state.timer) clearTimeout(state.timer);
      return {
        toast: { name, outcome },
        timer: setTimeout(() => set({ toast: null, timer: null }), 5000),
      };
    });
  },
}));

export function AddToTripButton({ tripId, experienceId, experienceName }) {
  const hydrated = useCopySessionHydrated();
  const addExperienceToTrip = useCopyTripStore((s) => s.addExperienceToTrip);
  const inTrip = useCopyTripStore(
    (s) =>
      s.session?.sourceTripId === tripId &&
      s.session.selectedExperienceIds.includes(experienceId) &&
      !(s.session.removedExperienceIds ?? []).includes(experienceId)
  );
  const show = useToastStore((s) => s.show);

  const added = hydrated && inTrip;

  return (
    <button
      type="button"
      aria-label={added ? `${experienceName} is in your trip` : `Add ${experienceName} to my trip`}
      title={added ? 'In your trip' : 'Add to my trip'}
      onClick={() => {
        if (!hydrated) return;
        const outcome = addExperienceToTrip(tripId, experienceId);
        show(experienceName, outcome);
      }}
      className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center self-center rounded-full
                  transition-colors duration-150 ${
                    added
                      ? 'bg-accent text-paper'
                      : 'text-ink/35 ring-1 ring-ink/20 hover:text-accent hover:ring-accent/60'
                  }`}
    >
      {added ? <Check className="h-3 w-3" strokeWidth={3} /> : <Plus className="h-3 w-3" />}
    </button>
  );
}

export function AddToTripToast({ tripId }) {
  const toast = useToastStore((s) => s.toast);
  const count = useCopyTripStore((s) =>
    s.session?.sourceTripId === tripId ? s.session.selectedExperienceIds.length : 0
  );

  // Don't leave a stale timer running on unmount.
  useEffect(() => () => {
    const { timer } = useToastStore.getState();
    if (timer) clearTimeout(timer);
  }, []);

  if (!toast) return null;

  return (
    <div
      role="status"
      data-add-to-trip-toast
      className="pointer-events-auto fixed inset-x-0 bottom-36 z-40 flex justify-center px-4 animate-fade-in sm:bottom-32"
    >
      <div className="flex max-w-md items-center gap-4 rounded-full bg-ink px-5 py-3 text-paper shadow-xl">
        <p className="min-w-0 truncate text-[13px]">
          {toast.outcome === 'exists' ? (
            <>Already in your trip — {toast.name}</>
          ) : (
            <>Added to your trip — {toast.name}</>
          )}
          {count > 1 && <span className="text-paper/50"> · {count} kept</span>}
        </p>
        <Link
          href={`/trips/${tripId}/copy/select`}
          className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-accent underline-offset-4
                     hover:underline"
        >
          View my copied trip
        </Link>
      </div>
    </div>
  );
}
