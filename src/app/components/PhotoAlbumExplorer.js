'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera as CameraIcon, ArrowRight, ArrowUpRight, ChevronDown, Play } from 'lucide-react';
import usePhotoStore from '../store/usePhotoStore';
import { tripHasBlueprint } from '@/features/copy-trip/availability';

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
// Rotating multi-destination hero: crossfades between the featured albums,
// auto-advances, and exposes a destination selector. Pauses on hover.

// A brand / value-proposition front door — rotating cover imagery as an
// ambient backdrop behind the journal's statement and primary CTAs. It no
// longer spotlights a specific album (the dispatches feed below does that).
//
// Composed like a magazine cover: masthead kicker, statement headline with an
// italic serif emphasis, CTAs, and a hairline "folio" bar along the bottom
// edge carrying the archive stats and a numbered index of the rotating covers.
const HERO_INTERVAL_MS = 6000;

const HeroStat = ({ value, label }) => (
  <div>
    <div className="font-display text-2xl sm:text-3xl leading-none text-paper tabular-nums">
      {value}
    </div>
    <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-paper/55">{label}</div>
  </div>
);

const FeaturedHero = ({ albums, stats, copyTrip }) => {
  const [active, setActive] = useState(0);

  // One timeout per slide (not an interval) so a manual jump from the index
  // restarts the full rotation — and stays in step with the progress hairline.
  useEffect(() => {
    if (albums.length < 2) return undefined;
    const timer = setTimeout(
      () => setActive((index) => (index + 1) % albums.length),
      HERO_INTERVAL_MS
    );
    return () => clearTimeout(timer);
  }, [active, albums.length]);

  const latest = albums[0];
  const current = albums[active] ? splitFlag(albums[active].name) : null;

  return (
    <section className="relative w-full h-[84vh] min-h-[560px] overflow-hidden bg-ink">
      {albums.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === active ? 'opacity-100 hero-drift' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.coverPhoto.url}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
      {/* Bottom-weighted scrim + a soft pool of shade behind the text column,
          so the photography stays bright where the type isn't. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/5" />
      <div className="absolute inset-0 bg-[radial-gradient(110%_85%_at_18%_88%,rgba(27,23,19,0.5),transparent_62%)]" />
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-10 md:pb-12">
        <p className="fade-up flex items-center gap-3.5 text-[11px] uppercase tracking-[0.35em] text-paper/70 mb-5">
          <span className="h-px w-12 bg-accent" aria-hidden="true" />
          Passport &amp; Ponder — a travel journal
        </p>
        <h1 className="fade-up fade-up-1 font-display text-4xl sm:text-6xl md:text-7xl text-paper leading-[1.02] tracking-tight max-w-4xl [text-wrap:balance]">
          Follow the journey, replay the route — then{' '}
          <em className="italic font-light">copy the trip</em> as your own.
        </h1>
        <p className="fade-up fade-up-1 mt-5 max-w-2xl text-paper/75 leading-relaxed">
          A photographic journal across {stats.countries} countries — where the newest
          dispatches are GPS-true itineraries you can personalize and take with you.
        </p>
        <div className="fade-up fade-up-2 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {copyTrip && (
            <Link
              href={`/trips/${copyTrip.id}/copy`}
              className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                         text-[11px] uppercase tracking-[0.2em] text-paper transition-colors duration-300 hover:bg-paper hover:text-ink"
            >
              Copy the {splitFlag(copyTrip.name).title} trip
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
          <Link
            href="/trips"
            className="group inline-flex items-center gap-2 border-b border-paper/40 pb-1 text-[11px] uppercase
                       tracking-[0.2em] text-paper transition-colors duration-300 hover:border-accent"
          >
            Watch a trip replay
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          {latest && (
            <Link
              href={`/journal/${latest.id}`}
              className="group inline-flex items-center gap-2 border-b border-paper/40 pb-1 text-[11px] uppercase
                         tracking-[0.2em] text-paper transition-colors duration-300 hover:border-accent"
            >
              Read the latest dispatch
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Folio bar: archive stats on the left, the rotating-cover index on
            the right — a printed footer line inside the cover. */}
        <div className="fade-up fade-up-3 mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t border-paper/20 pt-6">
          <div className="flex items-end gap-x-8 sm:gap-x-10">
            <HeroStat value={stats.countries} label="Countries & territories" />
            <HeroStat value={stats.photos.toLocaleString()} label="Photographs" />
            <HeroStat value={stats.albums} label="Journals" />
          </div>

          {albums.length > 1 && current && (
            <div className="hidden sm:flex flex-col items-end gap-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-paper/75">
                <span className="text-paper/45">№ {String(active + 1).padStart(2, '0')}</span>
                <span className="mx-2 text-paper/30">—</span>
                {current.title}
                {albums[active].year && <span className="text-paper/45"> · {albums[active].year}</span>}
              </p>
              <div className="flex items-center gap-1.5">
                {albums.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show ${slide.name}`}
                    aria-current={index === active}
                    className="group/seg relative h-4 w-9"
                  >
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-paper/30 transition-colors group-hover/seg:bg-paper/60" />
                    {index === active && (
                      <span
                        className="hero-progress absolute left-0 top-1/2 h-px -translate-y-1/2 bg-paper"
                        style={{ animationDuration: `${HERO_INTERVAL_MS}ms` }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
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

const CopyTripBand = ({ trips }) => {
  if (!trips.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 pt-14">
      <div aria-hidden="true">
        <div className="h-[3px] bg-ink" />
        <div className="mt-[3px] h-px bg-ink/25" />
      </div>
      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2.5">Copy my trip</p>
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

      <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
        <span className="mr-1 text-[11px] uppercase tracking-[0.22em] text-muted">
          Open for copying
        </span>
        {trips.map((trip) => {
          const { flag, title } = splitFlag(trip.name);
          return (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}/copy`}
              className="group inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2
                         text-[11px] uppercase tracking-[0.18em] text-ink/70 transition-colors duration-200
                         hover:border-accent hover:text-accent"
            >
              {flag && <span className="tracking-normal">{flag}</span>}
              {title}
              {trip.year && <span className="text-muted">· {trip.year}</span>}
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          );
        })}
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
      href={`/journal/${album.id}`}
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

const PhotoAlbumExplorer = ({ initialAlbums = null }) => {
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

  // The hero rotates through the newest albums that have cover photos
  const featuredAlbums = React.useMemo(() =>
    [...sourceAlbums]
      .sort((a, b) => b.year - a.year)
      .filter((album) => album.coverPhoto?.url)
      .slice(0, 5),
    [sourceAlbums]
  );

  // Trips with copy-trip blueprints, newest first. Paris leads the hero CTA —
  // it's the flagship dispatch — with the first copyable trip as fallback.
  const copyableAlbums = React.useMemo(
    () => sourceAlbums.filter((album) => tripHasBlueprint(album.id)).sort((a, b) => b.year - a.year),
    [sourceAlbums]
  );
  const heroCopyTrip =
    copyableAlbums.find((album) => album.id === 'paris-2026') ?? copyableAlbums[0] ?? null;

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

  const stats = React.useMemo(() => ({
    countries: 57, // Total countries/territories from travel century list
    photos: sourceAlbums.reduce((acc, album) => acc + (album.photoCount || 0), 0),
    albums: sourceAlbums.length,
  }), [sourceAlbums]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-display text-2xl text-ink/80">Gathering the journals…</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Passport &amp; Ponder</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FeaturedHero albums={featuredAlbums} stats={stats} copyTrip={heroCopyTrip} />

      <CopyTripBand trips={copyableAlbums} />

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
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2.5">The journal</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight">
                {viewMode === 'feed' ? 'Latest dispatches' : 'All albums'}
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
                {processedAlbums.map((album) => (
                  <DispatchRow key={album.id} album={album} />
                ))}
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
