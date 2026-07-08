// src/app/utils/tripBuilder.js
//
// Reconstructs a replayable itinerary from an album's photos. Albums are
// country-scoped and often mix several distinct trips (Paris in 2019, 2022
// and 2025 all live in the France album), so the builder works in two
// passes: photos are first segmented into "visits" by capture date — a long
// gap starts a new visit — then each visit's photos are clustered
// geographically into stops. locationId is too inconsistent to group on
// directly (it is sometimes a venue string like "Schönbrunn Palace, Vienna,
// Austria", sometimes a bare city, and sometimes a locations.json id like
// "loc72" shared by photos hundreds of km apart).
//
// Date hygiene: bulk imports stamp every photo with the upload date, and the
// same stamp shows up across unrelated albums (nobody shoots Santiago, Rio
// and Singapore on the same afternoon). Any date seen in several albums is
// treated as an upload artifact; its photos form a trailing undated visit
// segmented by geography alone, and the UI hides their dates.

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

// A capture-date gap longer than this starts a new visit. Wide enough to
// keep a multi-week itinerary together (Beijing → Shanghai, ten days apart),
// narrow enough to split returns to the same place months or years later.
const VISIT_GAP_DAYS = 21;

// A dateCreated value appearing in at least this many albums is an upload
// stamp, not a capture date.
const BULK_DATE_MIN_ALBUMS = 3;

const DAY_MS = 86400000;
const daysBetween = (a, b) => Math.abs(Date.parse(b) - Date.parse(a)) / DAY_MS;

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

// Dates stamped across several albums at once are upload dates.
function findBulkDates(allPhotos) {
  const albumsByDate = new Map();
  for (const photo of allPhotos) {
    if (!photo.dateCreated) continue;
    let albums = albumsByDate.get(photo.dateCreated);
    if (!albums) albumsByDate.set(photo.dateCreated, (albums = new Set()));
    albums.add(photo.albumId);
  }
  const bulk = new Set();
  for (const [date, albums] of albumsByDate) {
    if (albums.size >= BULK_DATE_MIN_ALBUMS) bulk.add(date);
  }
  return bulk;
}

// "June 2019", "April – May 2024", "December 2019 – January 2020".
function visitLabel([from, to], monthStyle) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  const full = (d) => d.toLocaleDateString('en-US', { month: monthStyle, year: 'numeric' });
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return full(a);
  if (a.getFullYear() === b.getFullYear()) {
    return `${a.toLocaleDateString('en-US', { month: monthStyle })} – ${full(b)}`;
  }
  return `${full(a)} – ${full(b)}`;
}

// Greedy geographic clustering with an incrementally updated centroid.
//
// A photo may carry an explicit `place` label to force separation that pure
// geography can't resolve — e.g. Praslin and La Digue are only ~12 km apart,
// inside CLUSTER_RADIUS_KM, so without this they collapse into one stop.
// Photos with no `place` (the vast majority) cluster on geography alone, so
// this is a no-op for every album that doesn't opt in.
function clusterMembers(members) {
  const clusters = [];
  for (const member of members) {
    const point = { lat: member.photo.coordinates.lat, lng: member.photo.coordinates.lng };
    const place = member.photo.place || null;
    let cluster = clusters.find(
      (c) => c.place === place && haversineKm(c.center, point) <= CLUSTER_RADIUS_KM
    );
    if (!cluster) {
      cluster = { center: { ...point }, members: [], place };
      clusters.push(cluster);
    }
    cluster.members.push(member);
    const n = cluster.members.length;
    cluster.center.lat += (point.lat - cluster.center.lat) / n;
    cluster.center.lng += (point.lng - cluster.center.lng) / n;
  }
  return clusters;
}

// Name each cluster — prefer the curated destination nearest to the
// centroid (it carries a hand-written description), falling back to the
// most common parsed label among the cluster's photos — then fold clusters
// that resolve to the same destination (day trips around one base, or an
// island split down the middle) into one stop.
function nameAndMergeClusters(clusters, locationsById, destinations) {
  clusters.forEach((cluster) => {
    let matched = null;
    for (const dest of destinations) {
      const distance = haversineKm(cluster.center, { lat: dest.latitude, lng: dest.longitude });
      if (distance <= DESTINATION_MATCH_KM && (!matched || distance < matched.distance)) {
        matched = { dest, distance };
      }
    }
    // An explicit place label wins the stop name (and takes its editorial
    // description from a like-named destination when one exists) — this both
    // names close-packed places correctly and sidesteps a country-level
    // destination outranking a same-coordinate city (Seychelles vs Mahe).
    const placedDest = cluster.place
      ? destinations.find((d) => d.name === cluster.place)
      : null;
    const chosen = placedDest || matched?.dest || null;
    cluster.name =
      cluster.place ||
      matched?.dest.name ||
      mostCommon(cluster.members.map((m) => placeLabel(m.photo.locationId, locationsById))) ||
      'Unknown stop';
    cluster.description = chosen?.description || null;
    cluster.country = chosen?.country || null;
  });

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
  return [...byName.values()];
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

  const bulkDates = findBulkDates(photosData.photos);

  // Segment into visits: photos with credible capture dates split on long
  // gaps; bulk-stamped photos have no usable date and form a trailing
  // undated visit. Bulk-imported albums share a single upload date, so the
  // original photo order breaks ties throughout.
  const dated = [];
  const undated = [];
  albumPhotos.forEach((photo, index) => {
    const target = photo.dateCreated && !bulkDates.has(photo.dateCreated) ? dated : undated;
    target.push({ photo, index });
  });
  dated.sort((a, b) =>
    a.photo.dateCreated === b.photo.dateCreated
      ? a.index - b.index
      : a.photo.dateCreated.localeCompare(b.photo.dateCreated)
  );

  const visitGroups = [];
  for (const member of dated) {
    const current = visitGroups[visitGroups.length - 1];
    const lastDate = current?.members[current.members.length - 1].photo.dateCreated;
    if (current && daysBetween(lastDate, member.photo.dateCreated) <= VISIT_GAP_DAYS) {
      current.members.push(member);
    } else {
      visitGroups.push({ hasDates: true, members: [member] });
    }
  }
  if (undated.length) visitGroups.push({ hasDates: false, members: undated });

  // Cluster each visit's photos into stops. Stop names can repeat across
  // visits (Paris in 2019 and again in 2022) — that is the point.
  const stops = [];
  const visits = visitGroups.map((group, visitIndex) => {
    const clusters = nameAndMergeClusters(
      clusterMembers(group.members),
      locationsById,
      destinations
    );

    const visitStops = clusters.map((cluster) => {
      const dates = cluster.members.map((m) => m.photo.dateCreated).sort();
      const spreadKm = Math.max(
        0,
        ...cluster.members.map((m) => haversineKm(cluster.center, m.photo.coordinates))
      );

      // Geographic extent of the stop's photos, as a [[minLng,minLat],
      // [maxLng,maxLat]] box. Lets the map frame each stop to its actual
      // footprint (fitBounds) instead of a fixed centroid zoom. Degenerate
      // (a single geocoded point) when every photo shares one coordinate.
      const lats = cluster.members.map((m) => m.photo.coordinates.lat);
      const lngs = cluster.members.map((m) => m.photo.coordinates.lng);
      const bounds = [
        [Number(Math.min(...lngs).toFixed(5)), Number(Math.min(...lats).toFixed(5))],
        [Number(Math.max(...lngs).toFixed(5)), Number(Math.max(...lats).toFixed(5))],
      ];

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
        visitIndex,
        hasDates: group.hasDates,
        center: {
          lat: Number(cluster.center.lat.toFixed(5)),
          lng: Number(cluster.center.lng.toFixed(5)),
        },
        zoom: zoomForSpreadKm(spreadKm),
        bounds,
        dateRange: [dates[0], dates[dates.length - 1]],
        photos,
        sortKey: [dates[0], Math.min(...cluster.members.map((m) => m.index))],
      };
    });

    visitStops.sort((a, b) =>
      a.sortKey[0] === b.sortKey[0]
        ? a.sortKey[1] - b.sortKey[1]
        : a.sortKey[0].localeCompare(b.sortKey[0])
    );
    visitStops.forEach((stop) => delete stop.sortKey);
    stops.push(...visitStops);

    const dates = group.members.map((m) => m.photo.dateCreated).sort();
    const dateRange = [dates[0], dates[dates.length - 1]];
    return {
      label: group.hasDates ? visitLabel(dateRange, 'long') : null,
      shortLabel: group.hasDates ? visitLabel(dateRange, 'short') : null,
      hasDates: group.hasDates,
      dateRange,
      stopCount: visitStops.length,
      photoCount: group.members.length,
    };
  });

  // Distance is only meaningful between stops of the same visit — there is
  // no leg between trips taken years apart.
  let totalKm = 0;
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].visitIndex === stops[i - 1].visitIndex) {
      totalKm += haversineKm(stops[i - 1].center, stops[i].center);
    }
  }

  const allDates = albumPhotos.map((p) => p.dateCreated).sort();

  return {
    id: album.id,
    name: album.name,
    year: album.year,
    photoCount: albumPhotos.length,
    totalKm: Math.round(totalKm),
    // True when at least one visit carries credible capture dates.
    hasReliableDates: visits.some((visit) => visit.hasDates),
    dateRange: [allDates[0], allDates[allDates.length - 1]],
    visits,
    stops,
  };
}
