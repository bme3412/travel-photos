// The destination layer, derived entirely from the `<city>-<year>` trip-id
// convention (CLAUDE.md) — no registry file. Legacy country-slug albums
// ("france", "chile") don't match and are deliberately absent: a destination
// hub only claims visits that are grounded as city-scoped trips. Display
// name/country come from a visit's blueprint destination; like
// tripHasBlueprint, this reads the raw JSON without Zod so it stays safe
// in client bundles.

import blueprintsData from '@/data/blueprints.json';

const CITY_VISIT_RE = /^(.+)-(\d{4})$/;

// "paris-2026" -> "paris"; legacy ids -> null. Data-free on purpose.
export function getCitySlug(albumId) {
  const match = String(albumId ?? '').match(CITY_VISIT_RE);
  return match ? match[1] : null;
}

// Every destination with at least one `<city>-<year>` album:
// [{ slug, name, country, visits: [{ id, year }] }], visits newest first.
// "Kraków, Poland" -> name "Kraków", country "Poland"; the capitalized
// slug is only a fallback for visits with no blueprint (same pattern as
// the neighborhoods index).
export function getDestinations(albums = []) {
  const bySlug = new Map();
  for (const album of albums) {
    const match = String(album?.id ?? '').match(CITY_VISIT_RE);
    if (!match) continue;
    if (!bySlug.has(match[1])) bySlug.set(match[1], []);
    bySlug.get(match[1]).push({ id: album.id, year: Number(match[2]) });
  }
  return [...bySlug.entries()].map(([slug, visits]) => {
    visits.sort((a, b) => b.year - a.year);
    const destination = visits.map((v) => blueprintsData[v.id]?.destination).find(Boolean);
    const [name, country] = destination
      ? destination.split(', ')
      : [slug.charAt(0).toUpperCase() + slug.slice(1)];
    return { slug, name, country: country ?? null, visits };
  });
}

// The visit a copy of this destination starts from: the newest blueprint
// whose id matches `<slug>-<year>`. Null when the destination has none.
export function getCopySourceTripId(slug) {
  const wanted = String(slug ?? '').toLowerCase();
  const years = Object.keys(blueprintsData)
    .map((id) => id.match(CITY_VISIT_RE))
    .filter((match) => match && match[1] === wanted)
    .map((match) => Number(match[2]))
    .sort((a, b) => b - a);
  return years.length ? `${wanted}-${years[0]}` : null;
}

// One destination or null. Case-insensitive: album ids are lowercase.
export function getDestination(slug, albums = []) {
  const wanted = String(slug ?? '').toLowerCase();
  return getDestinations(albums).find((city) => city.slug === wanted) ?? null;
}
