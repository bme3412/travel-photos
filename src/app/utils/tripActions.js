// src/app/utils/tripActions.js
//
// Turns a replay stop into "act on this place" deep links — the Copy-this-trip
// experiment. The hypothesis is that authentic first-person imagery drives
// intent to book; these links are the measurable surface for that intent.
//
// Every link is a real, working provider search that functions with no
// affiliate account. When the corresponding NEXT_PUBLIC_* id is set the link
// is decorated so clicks are attributable/commissionable — but the id is
// optional, so the feature ships and can be tested before any partner signup.

// Affiliate ids are read at module scope: NEXT_PUBLIC_* is inlined at build
// time, so this is a plain string (or undefined) on the client.
const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID;
const GYG_PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID;

const enc = encodeURIComponent;

// "Paris" + "France" → "Paris, France"; drops a country that just repeats the
// stop name (curated country-level destinations set country === name).
const placeQuery = (stop) =>
  stop.country && stop.country !== stop.name ? `${stop.name}, ${stop.country}` : stop.name;

// Where to stay — Booking.com search by place. aid is Booking's affiliate id.
function stayHref(stop) {
  const base = `https://www.booking.com/searchresults.html?ss=${enc(placeQuery(stop))}`;
  return BOOKING_AID ? `${base}&aid=${enc(BOOKING_AID)}` : base;
}

// Things to do — GetYourGuide tours/experiences search by place.
function doHref(stop) {
  const base = `https://www.getyourguide.com/s/?q=${enc(placeQuery(stop))}`;
  return GYG_PARTNER_ID ? `${base}&partner_id=${enc(GYG_PARTNER_ID)}` : base;
}

// Getting around — Google Maps centered on the stop's photo centroid, which is
// more precise than a place-name search for the exact spot the photos were taken.
function mapHref(stop) {
  return `https://www.google.com/maps/search/?api=1&query=${stop.center.lat},${stop.center.lng}`;
}

// The ordered actions offered for a single stop. `provider` is what gets logged
// on click, so keep it stable.
export function stopActions(stop) {
  return [
    { key: 'stay', label: 'Where to stay', provider: 'booking', href: stayHref(stop) },
    { key: 'do', label: 'Things to do', provider: 'getyourguide', href: doHref(stop) },
    { key: 'map', label: 'Open in Maps', provider: 'google-maps', href: mapHref(stop) },
  ];
}

// Plain-text itinerary for the clipboard "copy" action — a shareable trip plan
// with a booking link per stop and attribution back to the site.
export function itineraryText(trip, siteUrl) {
  const route = trip.stops.map((s) => s.name).join(' → ');
  const lines = [
    `${trip.name}${trip.year ? ` — ${trip.year}` : ''}`,
    `Retrace this route: ${route}`,
    '',
  ];
  trip.stops.forEach((stop, i) => {
    lines.push(`${i + 1}. ${placeQuery(stop)}`);
    lines.push(`   Stay: ${stayHref(stop)}`);
    lines.push(`   Do:   ${doHref(stop)}`);
  });
  if (siteUrl) lines.push('', `Replay the full trip: ${siteUrl}/trips/${trip.id}`);
  return lines.join('\n');
}
