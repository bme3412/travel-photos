// Offline reverse-geocoding for Paris: a curated set of landmarks/quarters with
// coordinates. nearestPlace() maps a GPS point to the closest named place within
// a small radius (a pragmatic stand-in for arrondissement polygons; extend the
// list or swap for point-in-polygon later). Used to label the route and detect
// neighborhood transitions on the trip report.

import { haversineKm } from './geo';

// name = the specific place shown in the trail; area = the broader quarter used
// to detect neighborhood transitions.
const PLACES = [
  { name: 'Pont Neuf', area: 'Île de la Cité', lat: 48.857, lng: 2.34 },
  { name: 'Notre-Dame', area: 'Île de la Cité', lat: 48.853, lng: 2.3499 },
  { name: 'Île Saint-Louis', area: 'Île Saint-Louis', lat: 48.8517, lng: 2.357 },
  { name: 'Saint-Germain', area: 'Saint-Germain', lat: 48.854, lng: 2.3335 },
  { name: 'Les Invalides', area: 'Invalides', lat: 48.8566, lng: 2.3125 },
  { name: 'Louvre', area: 'Tuileries–Louvre', lat: 48.8606, lng: 2.3376 },
  { name: 'Tuileries', area: 'Tuileries–Louvre', lat: 48.8634, lng: 2.3275 },
  { name: 'Concorde', area: 'Tuileries–Louvre', lat: 48.8656, lng: 2.3212 },
  { name: 'Champs-Élysées', area: 'Champs-Élysées', lat: 48.8698, lng: 2.3079 },
  { name: 'Arc de Triomphe', area: 'Champs-Élysées', lat: 48.8738, lng: 2.295 },
  { name: 'Eiffel Tower', area: 'Champ de Mars', lat: 48.8584, lng: 2.2945 },
  { name: 'Sacré-Cœur', area: 'Montmartre', lat: 48.8867, lng: 2.3431 },
  { name: 'Gare de l’Est', area: 'Gare de l’Est', lat: 48.876, lng: 2.359 },
  { name: 'Hôtel de Ville', area: 'Le Marais', lat: 48.8565, lng: 2.3524 },
  { name: 'Le Marais', area: 'Le Marais', lat: 48.8575, lng: 2.362 },
];

// Nearest named place within maxKm, else null.
export function nearestPlace(gps, maxKm = 0.7) {
  if (!gps || gps.lat == null || gps.lng == null) return null;
  let best = null;
  let bestKm = Infinity;
  for (const p of PLACES) {
    const km = haversineKm(gps, p);
    if (km < bestKm) {
      bestKm = km;
      best = p;
    }
  }
  return best && bestKm <= maxKm ? { name: best.name, area: best.area } : null;
}
