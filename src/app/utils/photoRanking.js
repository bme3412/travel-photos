// src/app/utils/photoRanking.js
//
// Quality-aware selection helpers, driven by the `rating` (1-5) that
// scripts/score-photos.mjs writes onto each photo. Every helper degrades to the
// original first-photo / original-order behavior when a set has no ratings, so
// the 55 unrated albums are unaffected until they're scored.

// Explicit .js extensions so this is importable from plain Node (tripBuilder is
// used by scripts/) as well as the Next.js bundler.

// Below this the photo is hidden from the replay filmstrip (still in the
// library, still on the album grid). 2 hides only the true throwaways (rating
// 1 — blurry, accidental, filler) and keeps everything from snapshot-grade up.
const HIDE_BELOW = 2;
// Never let curation empty a stop — keep at least this many, best-first, even
// when everything scored low.
const MIN_KEEP = 6;

// The single strongest photo, for a hero or album cover. Falls back to the
// first photo when nothing in the set is rated.
export function bestPhoto(photos) {
  if (!photos?.length) return null;
  let best = null;
  for (const photo of photos) {
    if (typeof photo.rating !== 'number') continue;
    if (!best || photo.rating > best.rating) best = photo;
  }
  return best || photos[0];
}

// Filmstrip ordering for one stop: best-first, then hide the weakest (with a
// floor). No-op — original order preserved — when the stop has no ratings.
// Array.prototype.sort is stable in Node 12+, so ties keep chronological order.
export function curateStopPhotos(photos) {
  if (!photos?.some((p) => typeof p.rating === 'number')) return photos;
  const ranked = [...photos].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const strong = ranked.filter((p) => (p.rating ?? 0) >= HIDE_BELOW);
  return strong.length >= MIN_KEEP ? strong : ranked.slice(0, MIN_KEEP);
}
