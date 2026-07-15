// Index of neighborhoods — the place-based layer over the trips. Each card
// aggregates everything captured in that neighborhood across every trip
// (photos by GPS, experiences by registry refs), so coverage deepens as
// trips accrue. Unevenness is expected: cards state their own counts.

import Link from 'next/link';
import Image from 'next/image';
import { readPhotos } from '../utils/fileHandler';
import { transformToCloudFront } from '../utils/imageUtils';
import { getNeighborhoodsByCity } from '@/features/neighborhoods/data';

export const metadata = {
  title: 'Neighborhoods | Copy This Trip',
  description:
    'The same streets, a year older each time — every neighborhood, aggregated across trips.',
};

export const revalidate = 3600;

// Prefer the blueprint's spelling ("Kraków, Poland" -> "Kraków"); the
// capitalized slug is only a fallback for entries with no resolved trips.
const cityName = (slug, hoods) =>
  hoods?.[0]?.trips?.[0]?.destination.split(',')[0] ??
  slug.charAt(0).toUpperCase() + slug.slice(1);

export default async function NeighborhoodsIndexPage() {
  const photosData = await readPhotos();
  const cities = getNeighborhoodsByCity(photosData?.photos ?? []);
  const total = cities.reduce((n, c) => n + c.hoods.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">
          Places, not trips
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">Neighborhoods</h1>
        <p className="mt-4 text-ink/70 leading-relaxed">
          Trips end; neighborhoods accumulate. Everything photographed and walked in one quarter,
          gathered across every visit — pages that get deeper each year.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted">
          {total} {total === 1 ? 'neighborhood' : 'neighborhoods'} so far
        </p>
      </header>

      {cities.map(({ city, hoods }) => (
        <section key={city} className="mt-10 sm:mt-14">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted border-b border-ink/10 pb-3">
            {cityName(city, hoods)}
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {hoods.map((hood) => {
              const cover = hood.photos[0];
              return (
                <Link
                  key={hood.id}
                  href={`/neighborhoods/${hood.id}`}
                  prefetch={false}
                  className="group relative overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-ink/10
                             hover:ring-accent/50 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
                    {cover?.url && (
                      <Image
                        src={transformToCloudFront(cover.url)}
                        alt={hood.name}
                        fill
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                    <span
                      className="absolute top-3 right-3 rounded-full bg-paper/90 px-3 py-1.5
                                 text-[10px] uppercase tracking-[0.2em] text-ink opacity-90
                                 group-hover:bg-accent group-hover:text-paper transition-colors duration-300"
                    >
                      {hood.districts.join(' · ')}
                    </span>
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-paper/70 mb-1">
                        {hood.photos.length}{' '}
                        {hood.photos.length === 1 ? 'photograph' : 'photographs'} ·{' '}
                        {hood.experienceRefs.length}{' '}
                        {hood.experienceRefs.length === 1 ? 'experience' : 'experiences'}
                      </p>
                      <h3 className="font-display text-2xl text-paper tracking-tight leading-tight">
                        {hood.name}
                      </h3>
                    </div>
                  </div>
                  <p className="p-4 text-[14px] leading-relaxed text-ink/70">{hood.summary}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
