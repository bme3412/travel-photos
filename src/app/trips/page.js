// src/app/trips/page.js
//
// Index of trip replays. Lists every trip with a clickable card that opens its
// scroll/replay experience at /trips/[id]. Data mirrors the home page's album
// summaries (cover photo + counts only), sorted newest-first.

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';
import { readAlbums, readPhotos, readLocations, readNarratives } from '../utils/fileHandler';
import { buildAlbumSummaries } from '../utils/albumSummaries';
import { getJournalIndex } from '../utils/journalContent';
import { tripHasBlueprint } from '@/features/copy-trip/availability';

export const metadata = {
  title: 'Original Trips | Copy This Trip',
  description: 'See the real journeys behind Copy This Trip, replayed stop by stop.',
};

export const revalidate = 3600;

// "🇫🇷 Menton" -> { flag: "🇫🇷", title: "Menton" }
const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

async function getTrips() {
  try {
    const [albumsData, photosData, locationsData, narrativesData] = await Promise.all([
      readAlbums(),
      readPhotos(),
      readLocations(),
      readNarratives(),
    ]);
    if (!albumsData || !photosData) return [];
    const summaries = buildAlbumSummaries(
      albumsData,
      photosData,
      locationsData || [],
      narrativesData,
      getJournalIndex()
    );
    // Newest trips first (stable for equal years).
    return summaries
      .map((trip, i) => ({ trip, i }))
      .sort((a, b) => (Number(b.trip.year) || 0) - (Number(a.trip.year) || 0) || a.i - b.i)
      .map(({ trip }) => trip);
  } catch (error) {
    console.error('Error building trips index:', error);
    return [];
  }
}

export default async function TripsIndexPage() {
  const trips = await getTrips();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">The source material</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">Original Trips</h1>
        <p className="mt-4 text-ink/70 leading-relaxed">
          These are the journeys behind every copied itinerary. Retrace the photographs and route,
          then make an available trip your own.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted">
          {trips.length} {trips.length === 1 ? 'journey' : 'journeys'}
        </p>
      </header>

      {trips.length === 0 ? (
        <p className="mt-12 text-ink/60">No trips yet.</p>
      ) : (
        <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {trips.map((trip) => {
            const { flag, title } = splitFlag(trip.name);
            const copyEnabled = tripHasBlueprint(trip.id);
            return (
              <article key={trip.id} className="overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-ink/10">
                <Link
                  href={`/trips/${trip.id}`}
                  prefetch={false}
                  className="group relative block overflow-hidden hover:ring-accent/50 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
                    {trip.coverPhoto?.url && (
                      <Image
                        src={trip.coverPhoto.url}
                        alt={title}
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
                        {trip.year} · {trip.photoCount}{' '}
                        {trip.photoCount === 1 ? 'photograph' : 'photographs'}
                      </p>
                      <h2 className="font-display text-2xl text-paper tracking-tight leading-tight">
                        {flag && <span className="mr-1.5">{flag}</span>}
                        {title}
                      </h2>
                    </div>
                  </div>
                </Link>
                {copyEnabled && (
                  <Link
                    href={`/trips/${trip.id}/copy/select`}
                    className="group flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent hover:text-paper"
                  >
                    Copy this trip
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
