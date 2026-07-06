// src/app/utils/tripBuilder.js
//
// Reconstructs a trip itinerary from an album's photos. Every photo has
// coordinates, so stops are derived by clustering photos geographically —
// locationId is too inconsistent to group on directly (it is sometimes a
// venue string like "Schönbrunn Palace, Vienna, Austria", sometimes a bare
// city, and sometimes a locations.json id like "loc72" shared by photos
// hundreds of km apart). Dates order the stops where they vary; bulk-imported
// albums share a single upload date, so the original photo order breaks ties.

// Explicit .js extensions so this module is importable from plain Node
// (scripts/generate-narratives.mjs) as well as the Next.js bundler.
import { transformToCloudFront } from './imageUtils.js';
import { haversineKm, zoomForSpreadKm } from './geo.js';

// Photos within this distance of a stop's centroid belong to that stop.
// City-scale: merges Vienna's venues into one stop while keeping Cairo
// and Luxor (~500 km apart) separate.
const CLUSTER_RADIUS_KM = 35;

// A stop takes its name (and editorial description) from the nearest
// curated destination within this distance.
const DESTINATION_MATCH_KM = 60;

// Derive a city-level label from a free-text locationId.
// "Paris" → "Paris"; "Vienna, Austria" → "Vienna";
// "Schönbrunn Palace, Vienna, Austria" → "Vienna"; "loc72" → locations.json name.
function placeLabel(locationId, locationsById) {
  if (!locationId) return null;
  const byId = locationsById.get(locationId);
  if (byId) return byId.name;
  const parts = locationId.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || null;
  if (parts.length === 2) return parts[0];
  return parts[parts.length - 2];
}

function mostCommon(values) {
  const counts = new Map();
  let best = null;
  for (const value of values) {
    if (!value) continue;
    const count = (counts.get(value) || 0) + 1;
    counts.set(value, count);
    if (!best || count > counts.get(best)) best = value;
  }
  return best;
}

function centroidOf(members) {
  const center = { lat: 0, lng: 0 };
  members.forEach((m, i) => {
    center.lat += (m.photo.coordinates.lat - center.lat) / (i + 1);
    center.lng += (m.photo.coordinates.lng - center.lng) / (i + 1);
  });
  return center;
}

/**
 * Build a replayable trip for an album.
 * Returns null when the album is unknown or has no photos.
 */
export function buildTrip(album, photosData, locationsData, destinationsData) {
  if (!album || !photosData?.photos) return null;

  const locationsList = Array.isArray(locationsData)
    ? locationsData
    : locationsData?.locations || [];
  const locationsById = new Map(locationsList.map((loc) => [loc.id, loc]));
  const destinations = Array.isArray(destinationsData)
    ? destinationsData
    : destinationsData?.destinations || [];

  const albumPhotos = photosData.photos.filter(
    (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
  );
  if (!albumPhotos.length) return null;

  // Greedy geographic clustering with an incrementally updated centroid.
  const clusters = [];
  albumPhotos.forEach((photo, index) => {
    const point = { lat: photo.coordinates.lat, lng: photo.coordinates.lng };
    let cluster = clusters.find((c) => haversineKm(c.center, point) <= CLUSTER_RADIUS_KM);
    if (!cluster) {
      cluster = { center: { ...point }, members: [] };
      clusters.push(cluster);
    }
    cluster.members.push({ photo, index });
    const n = cluster.members.length;
    cluster.center.lat += (point.lat - cluster.center.lat) / n;
    cluster.center.lng += (point.lng - cluster.center.lng) / n;
  });

  // Name each cluster: prefer the curated destination nearest to the
  // centroid — it carries a hand-written description — falling back to the
  // most common parsed label among the cluster's photos.
  clusters.forEach((cluster) => {
    let matched = null;
    for (const dest of destinations) {
      const distance = haversineKm(cluster.center, { lat: dest.latitude, lng: dest.longitude });
      if (distance <= DESTINATION_MATCH_KM && (!matched || distance < matched.distance)) {
        matched = { dest, distance };
      }
    }
    cluster.name =
      matched?.dest.name ||
      mostCommon(cluster.members.map((m) => placeLabel(m.photo.locationId, locationsById))) ||
      'Unknown stop';
    cluster.description = matched?.dest.description || null;
    cluster.country = matched?.dest.country || null;
  });

  // Adjacent clusters can resolve to the same destination (day trips around
  // one base, or an island split down the middle) — fold them into one stop.
  const byName = new Map();
  for (const cluster of clusters) {
    const existing = byName.get(cluster.name);
    if (existing) {
      existing.members.push(...cluster.members);
      existing.center = centroidOf(existing.members);
    } else {
      byName.set(cluster.name, cluster);
    }
  }

  const stops = [...byName.values()].map((cluster) => {
    const dates = cluster.members.map((m) => m.photo.dateCreated).sort();
    const spreadKm = Math.max(
      0,
      ...cluster.members.map((m) => haversineKm(cluster.center, m.photo.coordinates))
    );

    const photos = [...cluster.members]
      .sort((a, b) =>
        a.photo.dateCreated === b.photo.dateCreated
          ? a.index - b.index
          : a.photo.dateCreated.localeCompare(b.photo.dateCreated)
      )
      .map(({ photo }) => ({
        id: photo.id,
        url: transformToCloudFront(photo.url),
        caption: photo.caption || '',
        dateCreated: photo.dateCreated,
      }));

    return {
      name: cluster.name,
      description: cluster.description,
      country: cluster.country,
      center: {
        lat: Number(cluster.center.lat.toFixed(5)),
        lng: Number(cluster.center.lng.toFixed(5)),
      },
      zoom: zoomForSpreadKm(spreadKm),
      dateRange: [dates[0], dates[dates.length - 1]],
      photos,
      sortKey: [dates[0], Math.min(...cluster.members.map((m) => m.index))],
    };
  });

  stops.sort((a, b) =>
    a.sortKey[0] === b.sortKey[0]
      ? a.sortKey[1] - b.sortKey[1]
      : a.sortKey[0].localeCompare(b.sortKey[0])
  );
  stops.forEach((stop) => delete stop.sortKey);

  let totalKm = 0;
  for (let i = 1; i < stops.length; i++) {
    totalKm += haversineKm(stops[i - 1].center, stops[i].center);
  }

  const allDates = albumPhotos.map((p) => p.dateCreated).sort();

  return {
    id: album.id,
    name: album.name,
    year: album.year,
    photoCount: albumPhotos.length,
    totalKm: Math.round(totalKm),
    // Bulk-imported albums stamp every photo with one upload date; only
    // surface dates in the UI when they actually vary.
    hasReliableDates: new Set(allDates).size > 1,
    dateRange: [allDates[0], allDates[allDates.length - 1]],
    stops,
  };
}
