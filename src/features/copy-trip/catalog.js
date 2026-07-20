import blueprintsData from '@/data/blueprints.json';
import { getCopyGuide } from '@/features/neighborhoods/data';
import { getTripBlueprint } from './blueprint';

// A compact, serializable catalog for product surfaces. Only validated
// blueprints are exposed, so a homepage card can never lead into a broken
// copy flow after a bad hand-edit to blueprints.json.
export function buildCopyTripCatalog(albums = []) {
  const albumsById = new Map(albums.map((album) => [album.id, album]));

  return Object.keys(blueprintsData)
    .map((tripId) => {
      const blueprint = getTripBlueprint(tripId);
      const album = albumsById.get(tripId);
      if (!blueprint || !album) return null;

      const guide = getCopyGuide(tripId);
      const experienceCount = blueprint.days.reduce(
        (count, day) => count + day.experiences.length,
        0
      );
      const copyOptionCount = guide.reduce(
        (count, neighborhood) => count + neighborhood.copyOptions.length,
        0
      );

      // Destination-first framing: the card leads with the collection
      // (moments, quarters); the visit date is trailing metadata.
      const visitedLabel = blueprint.startDate
        ? new Date(`${blueprint.startDate}T12:00:00`).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        : album.year
          ? String(album.year)
          : null;

      return {
        id: tripId,
        name: album.name,
        year: album.year,
        coverPhoto: album.coverPhoto,
        destination: blueprint.destination,
        durationDays: blueprint.durationDays,
        occasion: blueprint.occasion ?? null,
        themes: blueprint.themes.slice(0, 3),
        experienceCount,
        copyOptionCount,
        neighborhoodCount: guide.length,
        visitedLabel,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.year) - Number(a.year) || a.destination.localeCompare(b.destination));
}
