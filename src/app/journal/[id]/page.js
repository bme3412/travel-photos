import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Play, ArrowRight } from 'lucide-react';
import {
  readAlbums,
  readPhotos,
  readLocations,
  readDestinations,
  readNarratives,
} from '../../utils/fileHandler';
import { buildTrip } from '../../utils/tripBuilder';
import PostGallery from './PostGallery';

// PROTOTYPE — a long-form "dispatch" reading experience for one trip, built
// from the same data as the replay (buildTrip + narratives). Reachable at
// /journal/[id]; /journal/egypt is the worked example.
export const revalidate = 3600;

const READ_WPM = 220;

const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatRange = ([from, to]) =>
  from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;

async function getPost(id) {
  const [albumsData, photosData, locationsData, destinationsData, narrativesData] =
    await Promise.all([
      readAlbums(),
      readPhotos(),
      readLocations(),
      readDestinations(),
      readNarratives(),
    ]);

  if (!albumsData || !photosData) return null;

  const album = albumsData.albums.find((a) => a.id.toLowerCase() === id.toLowerCase());
  if (!album) return null;

  const trip = buildTrip(album, photosData, locationsData, destinationsData);
  if (!trip) return null;

  const narrative = narrativesData?.[album.id];
  if (narrative) {
    trip.intro = narrative.intro || null;
    trip.stops.forEach((stop) => {
      stop.narrative = narrative.stops?.[stop.name] || null;
    });
  }
  return trip;
}

export async function generateStaticParams() {
  try {
    const albumsData = await readAlbums();
    return albumsData?.albums?.map((album) => ({ id: album.id })) || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const trip = await getPost(id);
  if (!trip) return { title: 'Dispatch Not Found | Passport & Ponder' };
  const { title } = splitFlag(trip.name);
  const cover = trip.stops[0]?.photos[0]?.url;
  return {
    title: `${title} | Passport & Ponder`,
    description: trip.intro?.slice(0, 200) || `A travel dispatch from ${title}`,
    openGraph: {
      title,
      description: trip.intro?.slice(0, 200) || '',
      images: cover ? [{ url: cover, width: 1200, height: 630, alt: title }] : [],
    },
  };
}

export default async function JournalPost({ params }) {
  const { id } = await params;
  const trip = await getPost(id);
  if (!trip) notFound();

  const { flag, title } = splitFlag(trip.name);
  const cover = trip.stops[0]?.photos[0];
  const country = trip.stops[0]?.country;

  const words = [trip.intro, ...trip.stops.map((s) => s.narrative)]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/).length;
  const readMin = Math.max(1, Math.round(words / READ_WPM));

  const dateline =
    (trip.hasReliableDates && trip.visits.find((v) => v.label)?.label) || trip.year;

  return (
    <article className="bg-paper">
      {/* ——— Hero ——— */}
      <header className="relative h-[68vh] min-h-[440px] w-full overflow-hidden bg-ink">
        {cover?.url && (
          <Image src={cover.url} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/20" />

        <div className="absolute top-0 inset-x-0">
          <div className="max-w-5xl mx-auto px-6 pt-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-paper/80
                         hover:text-paper transition-colors duration-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              The journal
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-5xl mx-auto px-6 pb-12 sm:pb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-paper/75 mb-4">
              Dispatch {flag && <span className="mx-1">{flag}</span>}
              {country ? `· ${country} ` : ''}· {dateline}
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-paper leading-[1.02] tracking-tight max-w-3xl">
              {title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={`/trips/${trip.id}`}
                className="inline-flex items-center gap-2.5 bg-accent text-paper rounded-full px-5 py-2.5
                           text-[11px] uppercase tracking-[0.2em] hover:bg-paper hover:text-ink transition-colors duration-300"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Replay the journey
              </Link>
              <span className="text-[11px] uppercase tracking-[0.2em] text-paper/70">
                {trip.stops.length} {trip.stops.length === 1 ? 'chapter' : 'chapters'} ·{' '}
                {trip.photoCount} photographs · {readMin} min read
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ——— Body ——— */}
      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">
        {/* Lead / standfirst */}
        {trip.intro && (
          <p className="max-w-2xl mx-auto font-display text-2xl sm:text-[28px] leading-[1.4] tracking-tight text-ink/90">
            {trip.intro}
          </p>
        )}

        {/* Chapters */}
        {trip.stops.map((stop, i) => (
          <section key={`${i}-${stop.name}`} className="mt-16 sm:mt-24">
            <div className="max-w-2xl mx-auto">
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">
                Chapter {String(i + 1).padStart(2, '0')}
                {stop.hasDates ? ` · ${formatRange(stop.dateRange)}` : ''}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight leading-tight">
                {stop.name}
                {stop.country && stop.country !== stop.name && (
                  <span className="text-ink/35"> — {stop.country}</span>
                )}
              </h2>
              {stop.narrative && (
                <p
                  className={`mt-5 text-lg leading-[1.75] text-ink/80 ${
                    i === 0
                      ? 'first-letter:float-left first-letter:font-display first-letter:text-6xl first-letter:leading-[0.85] first-letter:pr-3 first-letter:pt-1 first-letter:text-accent'
                      : ''
                  }`}
                >
                  {stop.narrative}
                </p>
              )}
            </div>

            <div className="max-w-4xl mx-auto">
              <PostGallery photos={stop.photos} albumId={trip.id} place={stop.name} />
            </div>
          </section>
        ))}

        {/* Closing CTA */}
        <div className="mt-20 sm:mt-28 max-w-2xl mx-auto text-center border-t border-ink/10 pt-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-4">Keep exploring</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/trips/${trip.id}`}
              className="inline-flex items-center gap-2.5 bg-ink text-paper rounded-full px-6 py-3
                         text-[11px] uppercase tracking-[0.2em] hover:bg-accent transition-colors duration-300"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Replay this journey
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink/70
                         hover:text-accent transition-colors duration-200"
            >
              More dispatches
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
