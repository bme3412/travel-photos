'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import usePhotoStore from '../../store/usePhotoStore';
import ImageLightbox from '../../components/ImageLightbox';
import { ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import { transformToCloudFront } from '../../utils/imageUtils';

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

  useEffect(() => {
    if (initialAlbum) {
      setAlbum(initialAlbum);
    }
  }, [initialAlbum]);

  if (!currentAlbum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Camera className="h-10 w-10 text-ink/20 mb-5" />
        <p className="font-display text-2xl text-ink/70 mb-2">This album isn&apos;t in the archive</p>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 mt-3 text-[11px] uppercase tracking-[0.2em] text-ink/70
                     border-b border-ink/20 pb-1 hover:border-accent hover:text-ink transition-colors duration-300"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          Back to the collection
        </Link>
      </div>
    );
  }

  const { flag, title } = splitFlag(currentAlbum.name);

  return (
    <div className="min-h-screen">
      {/* Album masthead */}
      <div className="border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                       hover:text-ink transition-colors duration-200 mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            The collection
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">
                {title}
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted mt-3">
                {flag && <span className="mr-1.5 tracking-normal">{flag}</span>}
                {[currentAlbum.year, `${currentAlbum.photoCount || currentAlbum.photos?.length || 0} photographs`]
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
              <Link
                href={`/trips/${currentAlbum.id}`}
                className="pb-1 border-b border-transparent text-muted hover:text-ink transition-colors duration-200"
                aria-label="Replay this trip on the map"
              >
                Replay
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {view === 'map' ? (
          <div className="space-y-6 pt-8">
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-min pb-4">
                {currentAlbum.photos?.map((photo, index) => (
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
              <AlbumMap album={currentAlbum} />
            </Suspense>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 pt-10">
            {currentAlbum.photos?.map((photo, index) => (
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
          images={currentAlbum.photos}
          currentIndex={selectedPhoto.index}
          onClose={closeLightbox}
          onNext={() => {
            const nextIndex = (selectedPhoto.index + 1) % currentAlbum.photos.length;
            openLightbox({ ...currentAlbum.photos[nextIndex], index: nextIndex });
          }}
          onPrevious={() => {
            const prevIndex = (selectedPhoto.index - 1 + currentAlbum.photos.length) % currentAlbum.photos.length;
            openLightbox({ ...currentAlbum.photos[prevIndex], index: prevIndex });
          }}
        />
      )}
    </div>
  );
}
