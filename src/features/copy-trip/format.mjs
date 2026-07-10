// Small formatting helpers shared across the copy-trip screens.
// Dates are "YYYY-MM-DD" strings; times are 24h "HH:MM" strings.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "2026-06-19", "2026-06-21" -> "June 19–21, 2026" (spanning months/years spelled out)
export function formatDateRange(start, end) {
  if (!start) return null;
  const [y1, m1, d1] = start.split('-').map(Number);
  if (!end || end === start) return `${MONTHS[m1 - 1]} ${d1}, ${y1}`;
  const [y2, m2, d2] = end.split('-').map(Number);
  if (y1 === y2 && m1 === m2) return `${MONTHS[m1 - 1]} ${d1}–${d2}, ${y1}`;
  if (y1 === y2) return `${MONTHS[m1 - 1]} ${d1} – ${MONTHS[m2 - 1]} ${d2}, ${y1}`;
  return `${MONTHS[m1 - 1]} ${d1}, ${y1} – ${MONTHS[m2 - 1]} ${d2}, ${y2}`;
}

// "14:30" -> "2:30 PM"
export function fmtTime12(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
}

export const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// "2026-06-19" + 2 -> "2026-06-21" (UTC-safe day math on date-only strings)
export function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
