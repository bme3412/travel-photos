import { notFound } from 'next/navigation';
import {
  readAlbums,
  readPhotos,
  readLocations,
  readDestinations,
  readNarratives,
} from '../../utils/fileHandler';
import { buildTrip } from '../../utils/tripBuilder';
import TripReplayClient from './TripReplayClient';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

async function getTripData(id) {
  try {
    const [albumsData, photosData, locationsData, destinationsData, narrativesData] =
      await Promise.all([
        readAlbums(),
        readPhotos(),
        readLocations(),
        readDestinations(),
        readNarratives(),
      ]);

    if (!albumsData || !photosData) return null;

    const album = albumsData.albums.find(
      (a) => a.id.toLowerCase() === id.toLowerCase()
    );
    if (!album) return null;

    const trip = buildTrip(album, photosData, locationsData, destinationsData);
    if (!trip) return null;

    // Overlay the generated/edited narrative (scripts/generate-narratives.mjs).
    // Stops fall back to the destination description when no narrative exists.
    const narrative = narrativesData?.[album.id];
    if (narrative) {
      trip.intro = narrative.intro || null;
      trip.stops.forEach((stop) => {
        stop.narrative = narrative.stops?.[stop.name] || null;
      });
    }

    return trip;
  } catch (error) {
    console.error('Error building trip data:', error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const albumsData = await readAlbums();
    if (!albumsData?.albums) return [];
    return albumsData.albums.map((album) => ({ id: album.id }));
  } catch (error) {
    console.error('Error generating trip static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const trip = await getTripData(id);

  if (!trip) {
    return {
      title: 'Trip Not Found | Passport & Ponder',
      description: 'This trip could not be found',
    };
  }

  const route = trip.stops.map((stop) => stop.name).join(' → ');
  const coverUrl = trip.stops[0]?.photos[0]?.url;

  return {
    title: `Replay: ${trip.name} | Passport & Ponder`,
    description: `Retrace the ${trip.year} journey — ${route}`,
    openGraph: {
      title: `Replay: ${trip.name}`,
      description: route,
      images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: trip.name }] : [],
    },
  };
}

export default async function TripPage({ params }) {
  const { id } = await params;
  const trip = await getTripData(id);

  if (!trip) {
    notFound();
  }

  return <TripReplayClient trip={trip} />;
}
