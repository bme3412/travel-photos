'use client';

// Copy-trip session state (the CopyTripSession from the feature plan),
// persisted to localStorage so selections and preferences survive navigation
// and reloads. One active session at a time; starting a copy of a different
// trip replaces it.

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const now = () => new Date().toISOString();
const newSessionId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `copy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const useCopyTripStore = create(
  persist(
    (set, get) => ({
      session: null,

      // Saved itineraries, keyed by source trip id — full session snapshots,
      // so a saved trip can be restored (and re-edited) even after the
      // active session was replaced by a new copy flow.
      savedTrips: {},

      // Reuse the existing session for this trip so selections survive
      // leaving and re-entering the flow; `reset: true` starts over.
      beginSession(sourceTripId, defaultExperienceIds = [], { reset = false } = {}) {
        const existing = get().session;
        if (!reset && existing && existing.sourceTripId === sourceTripId) {
          return existing;
        }
        const session = {
          id: newSessionId(),
          sourceTripId,
          selectedDayIds: [],
          selectedExperienceIds: defaultExperienceIds,
          mustKeepExperienceIds: [],
          removedExperienceIds: [],
          preferences: null,
          generatedPlan: null,
          status: 'selecting',
          createdAt: now(),
          updatedAt: now(),
        };
        set({ session });
        return session;
      },

      updateSession(patch) {
        const existing = get().session;
        if (!existing) return;
        set({ session: { ...existing, ...patch, updatedAt: now() } });
      },

      setSelectedExperienceIds(ids) {
        get().updateSession({ selectedExperienceIds: ids });
      },

      // "+ Add to my trip" from the replay: seed a session with just this
      // experience, or grow the existing one. Returns what happened so the
      // toast can phrase itself.
      addExperienceToTrip(sourceTripId, experienceId) {
        const existing = get().session;
        if (!existing || existing.sourceTripId !== sourceTripId) {
          get().beginSession(sourceTripId, [experienceId], { reset: true });
          return 'created';
        }
        if (existing.selectedExperienceIds.includes(experienceId)) {
          return 'exists';
        }
        get().updateSession({
          selectedExperienceIds: [...existing.selectedExperienceIds, experienceId],
          removedExperienceIds: (existing.removedExperienceIds ?? []).filter(
            (id) => id !== experienceId
          ),
        });
        return 'added';
      },

      // Manual edits to the generated itinerary. planRevision lets the UI
      // tell "as generated / as saved" apart from "has unsaved edits".
      applyPlanEdit(nextPlan) {
        const existing = get().session;
        if (!existing?.generatedPlan) return;
        get().updateSession({
          generatedPlan: nextPlan,
          planRevision: (existing.planRevision ?? 0) + 1,
        });
      },

      saveTrip() {
        const session = get().session;
        if (!session?.generatedPlan) return;
        set({
          savedTrips: {
            ...get().savedTrips,
            [session.sourceTripId]: { ...session, savedAt: now() },
          },
        });
      },

      // Bring a saved itinerary back as the active session (e.g. visiting
      // the result page after the session moved on to another trip).
      restoreSavedTrip(sourceTripId) {
        const saved = get().savedTrips[sourceTripId];
        if (saved) set({ session: { ...saved } });
      },

      resetSession() {
        set({ session: null });
      },
    }),
    { name: 'copy-trip-session' }
  )
);

// localStorage rehydrates after first client render; gate UI that shows
// persisted selections on this to avoid acting on the pre-hydration default.
export function useCopySessionHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCopyTripStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCopyTripStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

export default useCopyTripStore;
