'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera as CameraIcon, ArrowRight, ArrowUpRight, Play } from 'lucide-react';
import usePhotoStore from '../store/usePhotoStore';

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

const FeaturedHero = ({ albums }) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || albums.length < 2) return;
    const timer = setInterval(() => {
      setActive((index) => (index + 1) % albums.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, albums.length, active]);

  if (!albums.length) return null;

  const album = albums[active];
  const { flag, title } = splitFlag(album.name);

  return (
    <section
      className="relative w-full h-[72vh] min-h-[480px] overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {albums.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === active ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.coverPhoto.url}
            alt={slide.coverPhoto.caption || `Cover photo for ${slide.name}`}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />

      {/* Destination selector — desktop, bottom right */}
      <div className="hidden md:flex flex-col items-end gap-2.5 absolute right-6 lg:right-10 bottom-14 z-10">
        {albums.map((slide, index) => {
          const slideTitle = splitFlag(slide.name).title;
          return (
            <button
              key={slide.id}
              onClick={() => setActive(index)}
              className={`group/sel flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                index === active ? 'text-paper' : 'text-paper/45 hover:text-paper/80'
              }`}
            >
              <span>{slideTitle}</span>
              <span
                className={`h-px transition-all duration-500 ${
                  index === active ? 'w-10 bg-accent' : 'w-4 bg-paper/40 group-hover/sel:bg-paper/70'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="max-w-7xl mx-auto px-6 pb-12 md:pb-16">
          {/* Re-keyed so the entrance animation replays per destination */}
          <div key={album.id}>
            <p className="fade-up text-[11px] uppercase tracking-[0.3em] text-paper/70 mb-4">
              Featured journal {flag && <span className="ml-1">{flag}</span>} — {album.year}
            </p>
            <h1 className="fade-up fade-up-1 font-display text-5xl md:text-7xl text-paper leading-[1.02] tracking-tight max-w-3xl">
              {title}
            </h1>
            <div className="fade-up fade-up-2 mt-6 flex items-center gap-6">
              <Link
                href={`/albums/${album.id}`}
                className="group inline-flex items-center gap-2 text-paper text-[12px] uppercase tracking-[0.2em]
                           border-b border-paper/40 pb-1 hover:border-accent hover:text-paper transition-colors duration-300"
              >
                Open the album
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <span className="text-[11px] uppercase tracking-[0.2em] text-paper/60">
                {album.photoCount} photographs
              </span>
            </div>
          </div>

          {/* Destination selector — mobile, tick marks */}
          <div className="flex md:hidden items-center gap-2 mt-7">
            {albums.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActive(index)}
                aria-label={`Show ${splitFlag(slide.name).title}`}
                className="py-2"
              >
                <span
                  className={`block h-px transition-all duration-500 ${
                    index === active ? 'w-8 bg-accent' : 'w-4 bg-paper/40'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ——————————————————————————— Stats strip ———————————————————————————
// A single slim line — present but quiet.

const StatsStrip = ({ stats }) => (
  <div className="border-b border-ink/10">
    <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-muted">
      <span><span className="text-ink">{stats.countries}</span> countries &amp; territories</span>
      <span aria-hidden="true">·</span>
      <span><span className="text-ink">{stats.photos.toLocaleString()}</span> photographs</span>
      <span aria-hidden="true">·</span>
      <span><span className="text-ink">{stats.albums}</span> albums</span>
    </div>
  </div>
);

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

// ——————————————————————————— Controls ———————————————————————————

const SORT_OPTIONS = [
  { value: 'year-desc', label: 'Newest first' },
  { value: 'year-asc', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'photos-desc', label: 'Most photos' },
];

const Controls = ({ sortBy, onSortChange, viewMode, onViewModeChange }) => (
  <div className="flex items-center gap-6">
    <select
      id="sort-select"
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value)}
      aria-label="Sort albums"
      className="bg-transparent text-[11px] uppercase tracking-[0.18em] text-ink/70 border-0 border-b border-ink/20
                 pb-1 pr-6 focus:outline-none focus:border-accent cursor-pointer hover:text-ink transition-colors"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>

    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
      {[['grid', 'Grid'], ['list', 'Index']].map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`pb-1 border-b transition-colors duration-200 ${
            viewMode === mode
              ? 'text-ink border-accent'
              : 'text-muted border-transparent hover:text-ink'
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
  const [viewMode, setViewMode] = useState('grid');

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

  // The hero rotates through the newest albums that have cover photos
  const featuredAlbums = React.useMemo(() =>
    [...albums]
      .sort((a, b) => b.year - a.year)
      .filter((album) => album.coverPhoto?.url)
      .slice(0, 5),
    [albums]
  );

  const processedAlbums = React.useMemo(() => {
    const result = albums.filter((album) => album?.id);

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
  }, [albums, sortBy]);

  const stats = React.useMemo(() => ({
    countries: 54, // Total countries/territories from travel century list
    photos: albums.reduce((acc, album) => acc + (album.photoCount || 0), 0),
    albums: albums.length,
  }), [albums]);

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
      <FeaturedHero albums={featuredAlbums} />
      <StatsStrip stats={stats} />

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-20">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2">The collection</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">All albums</h2>
          </div>
          <Controls
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {processedAlbums.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14 items-start">
              {processedAlbums.map((album, index) => (
                <AlbumGridCard
                  key={album.id}
                  album={album}
                  number={index + 1}
                  wide={index % 7 === 0}
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
