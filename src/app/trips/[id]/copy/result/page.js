import { notFound } from 'next/navigation';
import { readPhotos } from '../../../../utils/fileHandler';
import { transformToCloudFront } from '../../../../utils/imageUtils';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';
import ResultClient from './ResultClient';

// The result of the copy flow: generation kickoff, the comparison module,
// the itinerary timeline, and the provenance drawer (which needs the source
// photo URLs resolved server-side).

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) return { title: 'Trip Not Found | Copy This Trip' };
  const city = blueprint.destination.split(',')[0];
  return { title: `Your version of ${city} | Copy This Trip` };
}

export default async function CopyTripResultPage({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) notFound();

  const photosData = await readPhotos();
  const photoUrlById = Object.fromEntries(
    (photosData?.photos || [])
      .filter((p) => p.albumId === id)
      .map((p) => [p.id, transformToCloudFront(p.url)])
  );

  return <ResultClient blueprint={blueprint} photoUrlById={photoUrlById} />;
}
