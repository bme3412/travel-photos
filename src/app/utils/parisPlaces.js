// Offline reverse-geocoding for trip-report cities: a curated set of
// landmarks/quarters with coordinates. nearestPlace() maps a GPS point to the
// closest named place within a small radius (a pragmatic stand-in for real
// polygons; extend the list or swap for point-in-polygon later). Cities are far
// enough apart that one flat list serves every trip. Used to label the route
// and detect neighborhood transitions on the trip report.

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
  // Berlin
  { name: 'Brandenburg Gate', area: 'Brandenburg Gate', lat: 52.5163, lng: 13.3777 },
  { name: 'Pariser Platz', area: 'Brandenburg Gate', lat: 52.5162, lng: 13.38 },
  { name: 'Reichstag', area: 'Reichstag & Spreebogen', lat: 52.5186, lng: 13.3762 },
  { name: 'Spreebogen', area: 'Reichstag & Spreebogen', lat: 52.5192, lng: 13.372 },
  { name: 'Potsdamer Platz', area: 'Potsdamer Platz', lat: 52.5096, lng: 13.376 },
  { name: 'Checkpoint Charlie', area: 'Checkpoint Charlie', lat: 52.5075, lng: 13.3903 },
  { name: 'Zoologischer Garten', area: 'Zoologischer Garten', lat: 52.5073, lng: 13.338 },
  // Kraków (+ the Oświęcim memorial, a day trip)
  { name: 'Rynek Główny', area: 'Rynek Główny', lat: 50.0617, lng: 19.9373 },
  { name: 'St. Mary’s Basilica', area: 'Rynek Główny', lat: 50.0616, lng: 19.9394 },
  { name: 'Mały Rynek', area: 'Mały Rynek', lat: 50.0613, lng: 19.9402 },
  { name: 'Floriańska Gate & Barbican', area: 'Floriańska', lat: 50.0651, lng: 19.9414 },
  { name: 'Sts. Peter & Paul', area: 'Grodzka', lat: 50.0577, lng: 19.9385 },
  { name: 'Kanonicza', area: 'Grodzka', lat: 50.0567, lng: 19.9377 },
  { name: 'Wawel', area: 'Wawel', lat: 50.0541, lng: 19.9352 },
  { name: 'Vistula boulevards', area: 'Vistula bend', lat: 50.05, lng: 19.9328 },
  { name: 'Birkenau (Auschwitz II)', area: 'Birkenau', lat: 50.0344, lng: 19.1806 },
  { name: 'Birkenau memorial, west end', area: 'Birkenau', lat: 50.034, lng: 19.171 },
  { name: 'Auschwitz I', area: 'Auschwitz I', lat: 50.0275, lng: 19.2033 },
  // Menton
  { name: 'Rue Saint-Michel', area: 'Lower town', lat: 43.7752, lng: 7.5045 },
  { name: 'Les Halles', area: 'Lower town', lat: 43.775, lng: 7.5062 },
  { name: 'Musée Jean Cocteau', area: 'Seafront', lat: 43.7741, lng: 7.506 },
  { name: 'Plage des Sablettes', area: 'Seafront', lat: 43.7752, lng: 7.509 },
  { name: 'Vieux Port', area: 'Seafront', lat: 43.7743, lng: 7.5105 },
  { name: 'Rampes Saint-Michel', area: 'Old town', lat: 43.7761, lng: 7.5074 },
  { name: 'Parvis Saint-Michel', area: 'Old town', lat: 43.7768, lng: 7.5081 },
  { name: 'Cimetière du Vieux-Château', area: 'Vieux-Château', lat: 43.7786, lng: 7.5076 },
  { name: 'Vieux-Château east terrace', area: 'Vieux-Château', lat: 43.778, lng: 7.5103 },
  { name: 'Avenue Félix Faure', area: 'Ville nouvelle', lat: 43.7751, lng: 7.5029 },
  { name: 'Jardin Biovès', area: 'Ville nouvelle', lat: 43.7746, lng: 7.501 },
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
