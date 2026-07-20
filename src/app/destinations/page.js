// The destination index: every place with at least one city-scoped visit,
// each card a single door to its hub (where Replay and Copy live). Legacy
// country-slug albums stay in /trips — this page only lists what the
// destination layer can ground.

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { readAlbums, readPhotos, readLocations, readNarratives } from '../utils/fileHandler';
import { buildAlbumSummaries } from '../utils/albumSummaries';
import { getJournalIndex } from '../utils/journalContent';
import { getDestinations } from '@/features/destinations/data';
import { tripHasBlueprint } from '@/features/copy-trip/availability';

export const metadata = {
  title: 'Destinations | Copy This Trip',
  description:
    'Places that have really been lived — each one a growing collection of real moments, ready to replay or copy.',
};

export const revalidate = 3600;

export default async function DestinationsPage() {
  const [albumsData, photosData, locationsData, narrativesData] = await Promise.all([
    readAlbums(),
    readPhotos(),
    readLocations(),
    readNarratives(),
  ]);
  const albums = albumsData?.albums ?? [];
  const summaries = buildAlbumSummaries(
    albumsData,
    photosData,
    locationsData || [],
    narrativesData,
    getJournalIndex()
  );
  const summaryById = new Map(summaries.map((s) => [s.id, s]));

  const destinations = getDestinations(albums).map((dest) => {
    const visitSummaries = dest.visits
      .map((visit) => summaryById.get(visit.id))
      .filter(Boolean);
    return {
      ...dest,
      cover: visitSummaries[0]?.coverPhoto ?? null,
      photoCount: visitSummaries.reduce((n, s) => n + (s.photoCount ?? 0), 0),
      copyable: dest.visits.some((visit) => tripHasBlueprint(visit.id)),
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">
          Places, deepened by every visit
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">Destinations</h1>
        <p className="mt-4 text-ink/70 leading-relaxed">
          Every place here has really been lived — replayed, written up, and photographed.
          Open one to replay the trip or copy it into your own.
        </p>
      </header>

      <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {destinations.map((dest) => (
          <Link
            key={dest.slug}
            href={`/destinations/${dest.slug}`}
            prefetch={false}
            className="group overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-ink/10
                       hover:ring-accent/50 transition-all duration-300"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
              {dest.cover?.url && (
                <Image
                  src={dest.cover.url}
                  alt={dest.name}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              {dest.copyable && (
                <span
                  className="absolute top-3 right-3 rounded-full bg-paper/90 px-3 py-1.5
                             text-[10px] uppercase tracking-[0.2em] text-ink opacity-90
                             group-hover:bg-accent group-hover:text-paper transition-colors duration-300"
                >
                  Available to copy
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
                {[
                  dest.country,
                  `Visited ${dest.visits.map((v) => v.year).join(' · ')}`,
                  `${dest.photoCount} ${dest.photoCount === 1 ? 'photograph' : 'photographs'}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl tracking-tight group-hover:text-accent transition-colors duration-300">
                  {dest.name}
                </h2>
                <ArrowRight className="h-4 w-4 text-ink/30 group-hover:text-accent transition-all duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-[13px] text-muted">
        Earlier journeys from before the destination pages live on in{' '}
        <Link href="/trips" className="text-accent underline-offset-4 hover:underline">
          Original Trips
        </Link>
        .
      </p>
    </div>
  );
}
