'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera as CameraIcon, ArrowRight, ArrowUpRight, ChevronDown, Play } from 'lucide-react';
import usePhotoStore from '../store/usePhotoStore';
import CopyTripCard from './CopyTripCard';
import CopyTripResume from './CopyTripResume';
import { storyHref } from '@/features/destinations/data';

// Album names carry a leading flag emoji ("🇪🇬 Egyptian Explorations") —
// split it out so the serif display title stays clean and the flag can sit
// in the meta line where it belongs.
const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

const formatMeta = (album) => {
  const parts = [album.year, `${album.photoCount || 0} photographs`];
  if (album.coverPhoto?.locationName) parts.push(album.coverPhoto.locationName);
  return parts.join(' · ');
};

// ————————————————————————————— Hero —————————————————————————————
// A minimalist front door: paper ground, masthead kicker, statement headline —
// no backdrop photography or rotation. The copy-trip photo cards below the
// statement are the only imagery, and the primary CTAs.

const FeaturedHero = ({ copyTrips }) => {
  return (
    <section className="w-full border-b border-ink/10">
      <div className="mx-auto flex max-w-7xl flex-col px-6 pt-14 pb-16 sm:pt-20">
        <h1 className="fade-up font-display text-4xl sm:text-6xl text-ink leading-[1.06] tracking-tight max-w-3xl [text-wrap:balance]">
          Choose a trip that really happened.{' '}
          <em className="italic font-light text-accent">Make it yours.</em>
        </h1>
        <p className="fade-up fade-up-1 mt-5 max-w-2xl text-ink/70 leading-relaxed">
          Keep the moments you love, change the pace and dates, and leave with a
          personalized itinerary.
        </p>
        <div className="fade-up fade-up-2 mt-12 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {copyTrips.map((trip, index) => (
            <CopyTripCard key={trip.id} trip={trip} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ————————————————————————— Copy-my-trip band —————————————————————————
// The product pitch, printed as its own department right under the cover:
// what "copy my trip" means in three steps, and which trips are open for it.

const COPY_STEPS = [
  {
    title: 'Replay the route',
    text: 'The newest dispatches are real itineraries — every photograph GPS-anchored, replayed day by day on the map.',
  },
  {
    title: 'Make it yours',
    text: 'Pick the moments worth keeping, then set your own dates, party, pace, and budget.',
  },
  {
    title: 'Travel with it',
    text: 'Get a personalized day-by-day itinerary, every stop still linked back to the original moment it came from.',
  },
];

const CopyTripBand = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-14">
      <div aria-hidden="true">
        <div className="h-[3px] bg-ink" />
        <div className="mt-[3px] h-px bg-ink/25" />
      </div>
      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2.5">How it works</p>
        <h2 className="font-display text-3xl md:text-4xl tracking-tight max-w-2xl [text-wrap:balance]">
          Don&rsquo;t just read the trip — take it with you.
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
        {COPY_STEPS.map((step, index) => (
          <div key={step.title} className="border-t border-ink/15 pt-4">
            <p className="text-[11px] text-muted tabular-nums">№ {String(index + 1).padStart(2, '0')}</p>
            <h3 className="font-display text-xl tracking-tight mt-2">{step.title}</h3>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

    </section>
  );
};

// ————————————————————————————— Cards —————————————————————————————

const AlbumGridCard = ({ album, number, wide = false }) => {
  const { flag, title } = splitFlag(album.name);
  const cover = album.coverPhoto;
  const router = useRouter();

  // Jump straight into the trip replay. The card itself is a Link, so this
  // must be a button (nested anchors are invalid) that intercepts the click.
  const openReplay = (event) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/trips/${album.id}`);
  };

  return (
    <Link
      href={`/albums/${album.id}`}
      className={`group block ${wide ? 'sm:col-span-2' : ''}`}
      prefetch={true}
    >
      <div className={`relative overflow-hidden bg-ink/5 ${wide ? 'aspect-[3/2]' : 'aspect-[4/5]'}`}>
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={cover.caption || `Cover photo for ${album.name}`}
            fill
            sizes={wide
              ? '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw'
              : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            quality={80}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-ink/20">
            <CameraIcon className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500" />

        {/* Replay affordance — visible on hover (desktop) and always on touch */}
        <button
          type="button"
          onClick={openReplay}
          aria-label={`Replay ${title} on the map`}
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-accent
                     pl-2.5 pr-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium text-paper shadow-lg
                     transition-all duration-300 hover:bg-ink hover:scale-105
                     opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
                     focus-visible:opacity-100 focus-visible:translate-y-0
                     max-sm:opacity-100 max-sm:translate-y-0"
        >
          <Play className="h-3 w-3 fill-current" />
          Replay
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-ink/15 flex items-start gap-4">
        <span className="text-[11px] text-muted tabular-nums pt-1.5">
          № {String(number).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <h3 className={`font-display tracking-tight leading-snug group-hover:text-accent transition-colors duration-300 ${wide ? 'text-2xl' : 'text-xl'}`}>
            {title}
          </h3>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-1.5">
            {flag && <span className="mr-1.5 tracking-normal">{flag}</span>}
            {formatMeta(album)}
          </p>
        </div>
      </div>
    </Link>
  );
};

const AlbumIndexRow = ({ album, number }) => {
  const { flag, title } = splitFlag(album.name);
  const cover = album.coverPhoto;
  const router = useRouter();

  const openReplay = (event) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/trips/${album.id}`);
  };

  return (
    <li>
      <Link href={`/albums/${album.id}`} className="group flex items-center gap-5 sm:gap-8 py-5" prefetch={true}>
        <span className="text-[11px] text-muted tabular-nums w-8 flex-shrink-0">
          {String(number).padStart(2, '0')}
        </span>
        <div className="relative w-16 h-12 sm:w-20 sm:h-14 overflow-hidden bg-ink/5 flex-shrink-0">
          {cover?.url && (
            <Image
              src={cover.url}
              alt=""
              fill
              sizes="80px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <h3 className="font-display text-lg sm:text-2xl tracking-tight flex-1 min-w-0 truncate group-hover:text-accent transition-colors duration-300">
          {flag && <span className="mr-2 text-base align-middle">{flag}</span>}
          {title}
        </h3>
        <span className="hidden md:inline text-[11px] uppercase tracking-[0.18em] text-muted whitespace-nowrap">
          {formatMeta(album)}
        </span>
        <button
          type="button"
          onClick={openReplay}
          aria-label={`Replay ${title} on the map`}
          className="hidden sm:inline-flex items-center gap-1.5 flex-shrink-0 text-[10px] uppercase tracking-[0.18em]
                     text-muted hover:text-accent transition-colors duration-200"
        >
          <Play className="h-3 w-3 fill-current" />
          Replay
        </button>
        <ArrowUpRight className="h-4 w-4 text-ink/30 group-hover:text-accent transition-colors duration-300 flex-shrink-0" />
      </Link>
    </li>
  );
};

// ——————————————————————————— Dispatches feed ———————————————————————————
// Blog-style reading list: each album is a "dispatch" whose narrative intro
// is the excerpt and whose stops are its chapters. Links to /journal/[id].

const dispatchMeta = (album) =>
  [
    album.chapterCount > 1 ? `${album.chapterCount} chapters` : null,
    `${album.photoCount} photographs`,
    album.readMin ? `${album.readMin} min read` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

const DispatchRow = ({ album }) => {
  const { flag, title } = splitFlag(album.name);
  const cover = album.coverPhoto;

  return (
    <Link
      href={storyHref(album.id)}
      className="group grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 sm:gap-8 py-8 sm:py-10 items-center"
      prefetch={false}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink/5">
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={cover.caption || title}
            fill
            sizes="(min-width: 640px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-ink/20">
            <CameraIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
          {flag && <span className="mr-1.5 tracking-normal">{flag}</span>}
          Dispatch · {album.year}
        </p>
        <h3 className="font-display text-2xl sm:text-3xl tracking-tight leading-snug group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        {album.excerpt && (
          <p className="mt-2.5 text-ink/70 leading-relaxed line-clamp-2 sm:line-clamp-3">{album.excerpt}</p>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ink group-hover:text-accent transition-colors duration-300">
            Read the dispatch
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">{dispatchMeta(album)}</span>
        </div>
      </div>
    </Link>
  );
};

// ——————————————————————————— Controls ———————————————————————————

const SORT_OPTIONS = [
  { value: 'year-desc', label: 'Newest first' },
  { value: 'year-asc', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'photos-desc', label: 'Most photos' },
];

// Sort reads as a quiet outlined control; the view switch reuses the segmented
// pill from the trip pages (TripViewSwitcher) so the whole site shares one
// switching idiom.
const Controls = ({ sortBy, onSortChange, viewMode, onViewModeChange }) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative">
      <select
        id="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort albums"
        className="appearance-none cursor-pointer rounded-full border border-ink/15 bg-transparent py-2 pl-4 pr-9
                   text-[11px] uppercase tracking-[0.18em] text-ink/70 transition-colors
                   hover:border-ink/40 hover:text-ink focus:border-accent focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
    </div>

    <div className="inline-flex items-center rounded-full bg-ink/5 p-1 text-[11px] uppercase tracking-[0.18em] ring-1 ring-ink/10">
      {[['feed', 'Journal'], ['grid', 'Grid'], ['list', 'Index']].map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          aria-pressed={viewMode === mode}
          className={`rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
            viewMode === mode ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

// ————————————————————————————— Page —————————————————————————————

const PhotoAlbumExplorer = ({ initialAlbums = null, copyTrips = [] }) => {
  // Store state
  const albums = usePhotoStore((state) => state.albums);
  const loading = usePhotoStore((state) => state.loading);
  const setAlbums = usePhotoStore((state) => state.setAlbums);
  const setLoading = usePhotoStore((state) => state.setLoading);
  const setError = usePhotoStore((state) => state.setError);

  // Local state
  const [sortBy, setSortBy] = useState('year-desc');
  const [viewMode, setViewMode] = useState('feed');

  useEffect(() => {
    // If initialAlbums provided (from SSR), use them directly
    if (initialAlbums) {
      setAlbums(initialAlbums);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from API (fallback for client-side navigation)
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/albums");
        if (!response.ok) {
          throw new Error("Failed to fetch albums");
        }
        const data = await response.json();

        // Albums arrive as summaries (coverPhoto + photoCount) from the API
        setAlbums(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching albums:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [initialAlbums, setAlbums, setLoading, setError]);

  // The store is only populated in the effect above, which never runs on the
  // server — render from the SSR prop until then so the page ships with real
  // content (hero CTA, copy band, dispatch feed) instead of an empty shell.
  const sourceAlbums = albums.length > 0 ? albums : initialAlbums || [];

  const processedAlbums = React.useMemo(() => {
    const result = sourceAlbums.filter((album) => album?.id);

    result.sort((a, b) => {
      switch (sortBy) {
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'photos-desc':
          return (b.photoCount || 0) - (a.photoCount || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [sourceAlbums, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-display text-2xl text-ink/80">Gathering the journeys…</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Copy This Trip</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FeaturedHero copyTrips={copyTrips} />

      <CopyTripResume trips={copyTrips} />

      <CopyTripBand />

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-20">
        {/* Section header — a printed department opening: thick-thin rule,
            kicker, headline with a hanging count, controls on the same line */}
        <div className="mb-12">
          <div aria-hidden="true">
            <div className="h-[3px] bg-ink" />
            <div className="mt-[3px] h-px bg-ink/25" />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2.5">The source material</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight">
                {viewMode === 'feed' ? 'Explore the original trips' : 'All original trips'}
                <sup className="ml-2.5 font-sans text-xs tracking-[0.08em] text-muted tabular-nums">
                  {processedAlbums.length}
                </sup>
              </h2>
            </div>
            <Controls
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {processedAlbums.length > 0 ? (
          viewMode === 'feed' ? (
            <div className="max-w-5xl mx-auto">
              <div className="border-t border-ink/10 divide-y divide-ink/10">
                {processedAlbums.slice(0, 8).map((album) => (
                  <DispatchRow key={album.id} album={album} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/trips"
                  className="group inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-[11px] uppercase tracking-[0.2em] text-ink/70 transition-colors hover:border-accent hover:text-accent"
                >
                  Browse all trip replays
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14 items-start">
              {processedAlbums.map((album, index) => (
                <AlbumGridCard
                  key={album.id}
                  album={album}
                  number={index + 1}
                  wide={index > 0 && index % 7 === 0}
                />
              ))}
            </div>
          ) : (
            <ol className="border-y border-ink/10 divide-y divide-ink/10">
              {processedAlbums.map((album, index) => (
                <AlbumIndexRow key={album.id} album={album} number={index + 1} />
              ))}
            </ol>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <p className="font-display text-2xl text-ink/70 mb-2">Nothing here yet</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              The journals are still at the printer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoAlbumExplorer;
