import { notFound } from 'next/navigation';
import { readPhotos } from '../../../../utils/fileHandler';
import { transformToCloudFront } from '../../../../utils/imageUtils';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';
import CopySelectClient from './CopySelectClient';

// Screen 2 of the copy flow: pick the days and experiences to carry into the
// personalized version. The server hands the client the validated blueprint
// plus resolved thumbnail URLs; selection state lives in the copy session.

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) return { title: 'Trip Not Found | Copy My Trip' };
  return {
    title: `Choose what to keep: ${blueprint.destination} | Copy My Trip`,
    description: `Select the days and experiences from the ${blueprint.destination} trip to carry into your version.`,
  };
}

export default async function CopyTripSelectPage({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) notFound();

  const photosData = await readPhotos();
  const photoUrlById = Object.fromEntries(
    (photosData?.photos || [])
      .filter((p) => p.albumId === id)
      .map((p) => [p.id, transformToCloudFront(p.url)])
  );

  return <CopySelectClient blueprint={blueprint} photoUrlById={photoUrlById} />;
}
