// Pure, immutable edit operations on a CopiedTripPlan — the manual-editing
// verbs of the copy flow (rename a day; edit, remove, reorder, re-day, and
// add items). Every function returns a new plan and leaves the input
// untouched; unknown day numbers / item ids return the plan unchanged.
// No drag-and-drop by design — these power simple move controls.

function mapDay(plan, dayNumber, fn) {
  return {
    ...plan,
    days: plan.days.map((day) => (day.dayNumber === dayNumber ? fn(day) : day)),
  };
}

export function renameDay(plan, dayNumber, title) {
  return mapDay(plan, dayNumber, (day) => ({ ...day, title }));
}

// patch: { title?, description?, time? } — time may be undefined to clear it.
export function updateItem(plan, dayNumber, itemId, patch) {
  return mapDay(plan, dayNumber, (day) => ({
    ...day,
    items: day.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  }));
}

export function removeItem(plan, dayNumber, itemId) {
  return mapDay(plan, dayNumber, (day) => ({
    ...day,
    items: day.items.filter((item) => item.id !== itemId),
  }));
}

// delta: -1 (up) or +1 (down); clamped at the day's edges.
export function moveItem(plan, dayNumber, itemId, delta) {
  return mapDay(plan, dayNumber, (day) => {
    const from = day.items.findIndex((item) => item.id === itemId);
    if (from === -1) return day;
    const to = from + delta;
    if (to < 0 || to >= day.items.length) return day;
    const items = [...day.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return { ...day, items };
  });
}

// Appends to the end of the target day; the traveler reorders from there.
export function moveItemToDay(plan, fromDayNumber, itemId, toDayNumber) {
  if (fromDayNumber === toDayNumber) return plan;
  const fromDay = plan.days.find((d) => d.dayNumber === fromDayNumber);
  const item = fromDay?.items.find((i) => i.id === itemId);
  if (!item || !plan.days.some((d) => d.dayNumber === toDayNumber)) return plan;
  return {
    ...plan,
    days: plan.days.map((day) => {
      if (day.dayNumber === fromDayNumber) {
        return { ...day, items: day.items.filter((i) => i.id !== itemId) };
      }
      if (day.dayNumber === toDayNumber) {
        return { ...day, items: [...day.items, item] };
      }
      return day;
    }),
  };
}

// A traveler-authored stop: status "new", no source provenance.
export function addCustomItem(plan, dayNumber, fields = {}) {
  const itemId = `custom-${Math.random().toString(36).slice(2, 8)}`;
  const item = {
    id: itemId,
    title: fields.title?.trim() || 'New stop',
    description: fields.description?.trim() || 'Your own addition.',
    time: fields.time || undefined,
    category: 'other',
    status: 'new',
    provenanceLabel: 'Added by you',
  };
  return {
    plan: mapDay(plan, dayNumber, (day) => ({ ...day, items: [...day.items, item] })),
    itemId,
  };
}
