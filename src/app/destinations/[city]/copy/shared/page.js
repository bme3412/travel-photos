import { readPhotos } from '../../../../utils/fileHandler';
import { transformToCloudFront } from '../../../../utils/imageUtils';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';
import { getCopySourceTripId } from '@/features/destinations/data';
import { notFound } from 'next/navigation';
import SharedClient from './SharedClient';

// A shared version of a copied trip. The plan itself travels in the URL
// fragment (see features/copy-trip/share.mjs) so nothing is stored
// server-side; this page only supplies the blueprint context and source
// photo URLs for provenance. Share links are personal — keep them out of
// search indexes.

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { city } = await params;
  const blueprint = getTripBlueprint(getCopySourceTripId(city));
  if (!blueprint) return { title: 'Trip Not Found | Copy This Trip' };
  const cityName = blueprint.destination.split(',')[0];
  return {
    title: `A shared version of ${cityName} | Copy This Trip`,
    description: `A personalized ${cityName} itinerary, copied from a trip that really happened.`,
    robots: { index: false },
  };
}

export default async function SharedTripPage({ params }) {
  const { city } = await params;
  const id = getCopySourceTripId(city);
  const blueprint = getTripBlueprint(id);
  if (!blueprint) notFound();

  const photosData = await readPhotos();
  const photoUrlById = Object.fromEntries(
    (photosData?.photos || [])
      .filter((p) => p.albumId === id)
      .map((p) => [p.id, transformToCloudFront(p.url)])
  );

  return <SharedClient blueprint={blueprint} photoUrlById={photoUrlById} />;
}
