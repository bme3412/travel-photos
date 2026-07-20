'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import usePhotoStore from '../../store/usePhotoStore';
import ImageLightbox from '../../components/ImageLightbox';
import { ArrowLeft, BookOpen, Camera, Play, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { transformToCloudFront } from '../../utils/imageUtils';
import { bestPhoto } from '../../utils/photoRanking';
import TripViewSwitcher from '../../components/TripViewSwitcher';
import { storyHref } from '@/features/destinations/data';

const photoDay = (photo) =>
  photo?.takenAt ? photo.takenAt.slice(0, 10) : photo?.dateCreated || null;

const formatDay = (iso) => {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

// Lazy load the AlbumMap component
const AlbumMap = React.lazy(() => import('../../components/AlbumMap'));

// Album names carry a leading flag emoji — split it out so the serif display
// title stays clean and the flag can sit in the meta line (same convention as
// the homepage).
const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

const PhotoCard = React.memo(({ photo, index, onPhotoClick }) => {
  const cloudFrontUrl = transformToCloudFront(photo.url);

  return (
    <div
      className="group relative aspect-[3/2] overflow-hidden bg-ink/5 cursor-pointer"
      onClick={() => onPhotoClick({ ...photo, index, url: cloudFrontUrl })}
    >
      <Image
        src={cloudFrontUrl}
        alt={photo.title || photo.caption || 'Album photo'}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        priority={index < 6}
        loading={index < 6 ? 'eager' : 'lazy'}
        quality={75}
      />
      <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500" />
      {photo.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/35 to-transparent
                        px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-paper text-[12px] tracking-wide line-clamp-2">
            {photo.caption}
          </h3>
        </div>
      )}
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';

// Loading component for the map
const MapLoading = () => (
  <div className="h-[calc(100vh-160px)] flex items-center justify-center border border-ink/10">
    <div className="text-center space-y-3">
      <p className="font-display text-2xl text-ink/80">Drawing the map…</p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">One moment</p>
    </div>
  </div>
);

export default function AlbumPageClient({ initialAlbum }) {
  const isLightboxOpen = usePhotoStore((state) => state.isLightboxOpen);
  const selectedPhoto = usePhotoStore((state) => state.selectedPhoto);
  const openLightbox = usePhotoStore((state) => state.openLightbox);
  const closeLightbox = usePhotoStore((state) => state.closeLightbox);

  const [view, setView] = useState('grid');
  const [currentAlbum, setAlbum] = useState(initialAlbum);
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    if (initialAlbum) {
      setAlbum(initialAlbum);
    }
  }, [initialAlbum]);

  // Day deep-links (?day=YYYY-MM-DD) are read on the client so the album
  // page can stay statically generated.
  useEffect(() => {
    const day = new URLSearchParams(window.location.search).get('day');
    if (day) setActiveDay(day);
  }, []);

  const availableDays = useMemo(() => {
    const days = new Set();
    for (const photo of currentAlbum?.photos || []) {
      const day = photoDay(photo);
      if (day) days.add(day);
    }
    return [...days].sort();
  }, [currentAlbum]);

  const visiblePhotos = useMemo(() => {
    const photos = currentAlbum?.photos || [];
    if (!activeDay) return photos;
    return photos.filter((photo) => photoDay(photo) === activeDay);
  }, [currentAlbum, activeDay]);

  // Map day dates to sequential day-N hashes used by the scene replay.
  const daySceneId = activeDay
    ? `day-${Math.max(1, availableDays.indexOf(activeDay) + 1)}`
    : null;

  if (!currentAlbum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Camera className="h-10 w-10 text-ink/20 mb-5" />
        <p className="font-display text-2xl text-ink/70 mb-2">This album isn&apos;t in the archive</p>
        <Link
          href="/trips"
          className="group inline-flex items-center gap-2 mt-3 text-[11px] uppercase tracking-[0.2em] text-ink/70
                     border-b border-ink/20 pb-1 hover:border-accent hover:text-ink transition-colors duration-300"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          Back to original trips
        </Link>
      </div>
    );
  }

  const { flag, title } = splitFlag(currentAlbum.name);

  // Prominent replay call-to-action, shown on initial load above the grid.
  // Lead with the highest-rated photo (falls back to the first when unrated).
  const coverUrl = bestPhoto(visiblePhotos)?.url || bestPhoto(currentAlbum.photos)?.url || null;
  const trip = currentAlbum.tripSummary;
  const isMultiStop = trip && trip.stopCount > 1;
  const replayMeta = trip
    ? [
        isMultiStop ? `${trip.stopCount} stops` : null,
        trip.totalKm > 0 ? `~${trip.totalKm.toLocaleString()} km` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const replayHref = daySceneId
    ? `/trips/${currentAlbum.id}#${daySceneId}`
    : `/trips/${currentAlbum.id}`;
  const viewContext = {
    sceneId: daySceneId,
    dayDate: activeDay,
  };

  const selectDay = (day) => {
    setActiveDay(day);
    const url = day
      ? `/albums/${currentAlbum.id}?day=${day}`
      : `/albums/${currentAlbum.id}`;
    window.history.replaceState(null, '', url);
  };

  return (
    <div className="min-h-screen">
      {/* Album masthead */}
      <div className="border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              href={`/trips/${currentAlbum.id}`}
              className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                         hover:text-ink transition-colors duration-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to replay
            </Link>
            <TripViewSwitcher
              tripId={currentAlbum.id}
              active="photos"
              variant="light"
              context={viewContext}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">
                {title}
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted mt-3">
                {flag && <span className="mr-1.5 tracking-normal">{flag}</span>}
                {[
                  currentAlbum.year,
                  activeDay
                    ? `${visiblePhotos.length} photographs · ${formatDay(activeDay)}`
                    : `${currentAlbum.photoCount || currentAlbum.photos?.length || 0} photographs`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.18em]">
              {[['grid', 'Photographs'], ['map', 'Map']].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`pb-1 border-b transition-colors duration-200 ${
                    view === mode
                      ? 'text-ink border-accent'
                      : 'text-muted border-transparent hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {availableDays.length > 1 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => selectDay(null)}
                className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  !activeDay
                    ? 'bg-ink text-paper'
                    : 'bg-ink/5 text-ink/60 hover:text-ink'
                }`}
              >
                All days
              </button>
              {availableDays.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                    activeDay === day
                      ? 'bg-ink text-paper'
                      : 'bg-ink/5 text-ink/60 hover:text-ink'
                  }`}
                >
                  Day {index + 1}
                  <span
                    className={`ml-1.5 normal-case tracking-normal ${
                      activeDay === day ? 'text-paper/65' : 'text-ink/35'
                    }`}
                  >
                    {formatDay(day)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* Cross-links into the other trip lenses */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href={replayHref}
            className="group relative overflow-hidden rounded-2xl border border-ink/10 shadow-sm"
            aria-label={`Replay ${title}${activeDay ? ` day ${availableDays.indexOf(activeDay) + 1}` : ''}`}
          >
            {coverUrl && (
              <div className="absolute inset-0">
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 600px, 100vw"
                  className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/35" />
              </div>
            )}
            <div className="relative flex items-center gap-4 px-5 sm:px-7 py-7">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent text-paper">
                <Play className="h-5 w-5 fill-current translate-x-0.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-paper/70 mb-1">Trip replay</p>
                <h2 className="font-display text-2xl tracking-tight text-paper leading-tight">
                  {activeDay ? `Replay day ${availableDays.indexOf(activeDay) + 1}` : 'Replay this trip'}
                </h2>
                <p className="mt-1.5 text-sm text-paper/80">
                  {activeDay
                    ? formatDay(activeDay)
                    : `Retrace ${title}${replayMeta ? ` · ${replayMeta}` : ''}`}
                </p>
              </div>
              <ArrowRight className="ml-auto hidden sm:block h-5 w-5 text-paper/70 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href={storyHref(currentAlbum.id)}
            className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper px-5 sm:px-7 py-7
                       transition-colors hover:border-accent/40"
          >
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted mb-1">The dispatch</p>
              <h2 className="font-display text-2xl tracking-tight leading-tight">Read the story</h2>
              <p className="mt-1.5 text-sm text-ink/65">
                The written version of this trip, with the photographs in context.
              </p>
            </div>
            <ArrowRight className="ml-auto hidden sm:block h-5 w-5 text-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        </div>

        {view === 'map' ? (
          <div className="space-y-6 pt-8">
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-min pb-4">
                {visiblePhotos.map((photo, index) => (
                  <div key={photo.id} className="w-72 flex-shrink-0">
                    <PhotoCard
                      photo={photo}
                      index={index}
                      onPhotoClick={openLightbox}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Suspense fallback={<MapLoading />}>
              <AlbumMap album={{ ...currentAlbum, photos: visiblePhotos }} />
            </Suspense>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 pt-10">
            {visiblePhotos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onPhotoClick={openLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {isLightboxOpen && selectedPhoto && (
        <ImageLightbox
          images={visiblePhotos}
          currentIndex={Math.min(selectedPhoto.index, Math.max(0, visiblePhotos.length - 1))}
          onClose={closeLightbox}
          onNext={() => {
            if (!visiblePhotos.length) return;
            const nextIndex = (selectedPhoto.index + 1) % visiblePhotos.length;
            openLightbox({ ...visiblePhotos[nextIndex], index: nextIndex });
          }}
          onPrevious={() => {
            if (!visiblePhotos.length) return;
            const prevIndex =
              (selectedPhoto.index - 1 + visiblePhotos.length) % visiblePhotos.length;
            openLightbox({ ...visiblePhotos[prevIndex], index: prevIndex });
          }}
        />
      )}
    </div>
  );
}
