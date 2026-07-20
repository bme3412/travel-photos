// Copy-flow URLs live under the destination hub (/destinations/<city>/copy)
// while sessions, blueprints, and provenance stay keyed by the visit's trip
// id — this is the one place that mapping is spelled out.

import { getCitySlug } from '../destinations/data';

export function copyFlowHref(tripId, step = '') {
  const base = `/destinations/${getCitySlug(tripId)}/copy`;
  return step ? `${base}/${step}` : base;
}
