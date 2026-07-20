// One city, every visit: the hub above the per-visit lenses. Visits are the
// `<city>-<year>` albums (derived, never curated — see features/cities);
// each card links out to the visit's replay, story, and photographs at
// their usual paths, plus the copy flow when a blueprint exists. The
// neighborhood grid reuses the registry joins, so both halves of the page
// deepen automatically when next year's trip lands. Quiet layer: reachable
// from replays and neighborhood pages, not the nav.

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { readAlbums, readPhotos, readLocations, readNarratives } from '../../utils/fileHandler';
import { buildAlbumSummaries } from '../../utils/albumSummaries';
import { getJournalIndex } from '../../utils/journalContent';
import { transformToCloudFront } from '../../utils/imageUtils';
import { getCities, getCity } from '@/features/cities/data';
import { tripHasBlueprint } from '@/features/copy-trip/availability';
import { getNeighborhoodsByCity } from '@/features/neighborhoods/data';

export const revalidate = 3600;

export async function generateStaticParams() {
  const albumsData = await readAlbums();
  return getCities(albumsData?.albums ?? []).map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }) {
  const { city: slug } = await params;
  const albumsData = await readAlbums();
  const city = getCity(slug, albumsData?.albums ?? []);
  if (!city) return { title: 'City Not Found | Copy This Trip' };
  return {
    title: `${city.name}${city.country ? `, ${city.country}` : ''} | Copy This Trip`,
    description: `Every visit to ${city.name}, gathered in one place — trip replays, dispatches, and photographs from ${city.visits
      .map((v) => v.year)
      .join(', ')}.`,
  };
}

// "🇫🇷 Menton" -> { flag: "🇫🇷", title: "Menton" }
const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

export default async function CityPage({ params }) {
  const { city: slug } = await params;
  const [albumsData, photosData, locationsData, narrativesData] = await Promise.all([
    readAlbums(),
    readPhotos(),
    readLocations(),
    readNarratives(),
  ]);
  const city = getCity(slug, albumsData?.albums ?? []);
  if (!city) notFound();

  const visitIds = new Set(city.visits.map((v) => v.id));
  const summaries = buildAlbumSummaries(
    { albums: (albumsData?.albums ?? []).filter((album) => visitIds.has(album.id)) },
    photosData,
    locationsData || [],
    narrativesData,
    getJournalIndex()
  );
  const visits = city.visits.map((visit) => ({
    ...visit,
    summary: summaries.find((s) => s.id === visit.id) ?? null,
  }));
  const totalPhotos = visits.reduce((n, v) => n + (v.summary?.photoCount ?? 0), 0);

  const hoods =
    getNeighborhoodsByCity(photosData?.photos ?? []).find((c) => c.city === city.slug)?.hoods ??
    [];

  const facts = [
    city.country,
    `Visited ${city.visits.map((v) => v.year).join(' · ')}`,
    `${totalPhotos} ${totalPhotos === 1 ? 'photograph' : 'photographs'}`,
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
      <Link
        href="/trips"
        className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                   hover:text-ink transition-colors duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
        All original trips
      </Link>

      <header className="mt-10 sm:mt-12 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">
          One city, every visit
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{city.name}</h1>
        <p className="mt-4 text-ink/70 leading-relaxed">
          Each visit replayed, written up, and photographed — a page that gets deeper every time
          this city comes around again.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted">
          {facts.join(' · ')}
        </p>
      </header>

      <section className="mt-10 sm:mt-14">
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted border-b border-ink/10 pb-3">
          {visits.length === 1 ? 'The visit' : 'The visits'}
        </h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {visits.map((visit) => {
            const { flag, title } = splitFlag(visit.summary?.name ?? '');
            const photoCount = visit.summary?.photoCount ?? 0;
            const copyEnabled = tripHasBlueprint(visit.id);
            return (
              <article key={visit.id} className="overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-ink/10">
                <Link
                  href={`/trips/${visit.id}`}
                  prefetch={false}
                  className="group relative block overflow-hidden hover:ring-accent/50 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
                    {visit.summary?.coverPhoto?.url && (
                      <Image
                        src={visit.summary.coverPhoto.url}
                        alt={title || visit.id}
                        fill
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />

                    <span
                      className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full
                                 bg-paper/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ink
                                 opacity-90 group-hover:bg-accent group-hover:text-paper transition-colors duration-300"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Replay
                    </span>

                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-paper/70 mb-1">
                        {visit.year} · {photoCount}{' '}
                        {photoCount === 1 ? 'photograph' : 'photographs'}
                      </p>
                      <h3 className="font-display text-2xl text-paper tracking-tight leading-tight">
                        {flag && <span className="mr-1.5">{flag}</span>}
                        {title || visit.id}
                      </h3>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-x-5 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted">
                  <Link href={`/trips/${visit.id}`} className="hover:text-ink transition-colors">
                    Replay
                  </Link>
                  <Link href={`/journal/${visit.id}`} className="hover:text-ink transition-colors">
                    Story
                  </Link>
                  <Link href={`/albums/${visit.id}`} className="hover:text-ink transition-colors">
                    Photos
                  </Link>
                </div>
                {copyEnabled && (
                  <Link
                    href={`/trips/${visit.id}/copy`}
                    className="group flex items-center justify-between border-t border-ink/10 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent hover:text-paper"
                  >
                    Available to copy
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {hoods.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted border-b border-ink/10 pb-3">
            Neighborhoods
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
      )}
    </div>
  );
}
