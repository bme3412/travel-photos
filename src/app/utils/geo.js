// src/app/utils/geo.js
//
// Small spherical-geometry helpers shared by the trip builder (server)
// and the trip replay map (client). Pure functions, no dependencies.

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Great-circle distance in kilometers between two {lat, lng} points.
 */
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Great-circle arc between two {lat, lng} points as an array of
 * [lng, lat] pairs (GeoJSON order), interpolated on the unit sphere so
 * long hops render as curved flight paths rather than straight lines.
 * Note: does not split arcs crossing the antimeridian — no trip in the
 * current collection does.
 */
export function greatCircleArc(a, b, numPoints = 48) {
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const lng2 = toRad(b.lng);

  const v1 = [
    Math.cos(lat1) * Math.cos(lng1),
    Math.cos(lat1) * Math.sin(lng1),
    Math.sin(lat1),
  ];
  const v2 = [
    Math.cos(lat2) * Math.cos(lng2),
    Math.cos(lat2) * Math.sin(lng2),
    Math.sin(lat2),
  ];

  const dot = Math.min(1, Math.max(-1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const angle = Math.acos(dot);

  // Effectively the same point — a two-vertex line is all we need.
  if (angle < 1e-6) {
    return [
      [a.lng, a.lat],
      [b.lng, b.lat],
    ];
  }

  const coords = [];
  const sinAngle = Math.sin(angle);
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const w1 = Math.sin((1 - t) * angle) / sinAngle;
    const w2 = Math.sin(t * angle) / sinAngle;
    const x = w1 * v1[0] + w2 * v2[0];
    const y = w1 * v1[1] + w2 * v2[1];
    const z = w1 * v1[2] + w2 * v2[2];
    coords.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
  }
  return coords;
}

/**
 * Map zoom that comfortably frames a stop whose photos spread over the
 * given radius (km from the stop centroid).
 */
export function zoomForSpreadKm(km) {
  if (km <= 1) return 12.5;
  if (km <= 3) return 11.5;
  if (km <= 8) return 10.5;
  if (km <= 25) return 9.5;
  if (km <= 60) return 8;
  return 6.5;
}
