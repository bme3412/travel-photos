import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import Image from 'next/image';
import { transformToCloudFront } from '../utils/imageUtils';

const PhotoSidePanel = ({ location, isOpen, onClose, onPhotoClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sortedPhotos = useMemo(() =>
    location?.photos ? [...location.photos].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) : [],
    [location?.photos]
  );

  const navigatePhotos = (direction) => {
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % sortedPhotos.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  if (!location || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-ink/50 backdrop-blur-sm z-40 transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[28rem] max-w-full bg-paper border-l border-ink/10 z-50
                    flex flex-col transform transition-transform duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-6 border-b border-ink/10">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="font-display text-2xl tracking-tight leading-tight">
                {location.name}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted mt-2">
                {sortedPhotos.length} photographs
                {sortedPhotos[0]?.dateCreated && (
                  <> · {new Date(sortedPhotos[0].dateCreated).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}</>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-ink/40 hover:text-ink transition-colors duration-200 flex-shrink-0"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main photo */}
        {sortedPhotos.length > 0 && (
          <div className="relative h-72 flex-shrink-0 bg-ink/5 border-b border-ink/10">
            <Image
              src={transformToCloudFront(sortedPhotos[currentImageIndex].url)}
              alt={sortedPhotos[currentImageIndex].caption || 'Photo'}
              fill
              className="object-cover"
              sizes="448px"
            />

            {sortedPhotos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhotos('prev')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-ink/50 hover:bg-ink/70 text-paper
                             transition-colors duration-200 backdrop-blur-sm"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigatePhotos('next')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-ink/50 hover:bg-ink/70 text-paper
                             transition-colors duration-200 backdrop-blur-sm"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-ink/60 text-paper text-[11px]
                                tracking-[0.14em] tabular-nums backdrop-blur-sm">
                  {currentImageIndex + 1} / {sortedPhotos.length}
                </div>
              </>
            )}

            {sortedPhotos[currentImageIndex].caption && (
              <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-8 bg-gradient-to-t from-ink/80 via-ink/35 to-transparent">
                <p className="text-paper text-[12px] tracking-wide leading-relaxed">
                  {sortedPhotos[currentImageIndex].caption}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-5">
            All photographs
          </p>

          <div className="grid grid-cols-2 gap-3">
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative aspect-square overflow-hidden cursor-pointer bg-ink/5 transition-opacity duration-200 ${
                  index === currentImageIndex
                    ? 'ring-1 ring-accent ring-offset-2 ring-offset-paper'
                    : 'hover:opacity-80'
                }`}
                onClick={() => {
                  setCurrentImageIndex(index);
                  if (onPhotoClick) {
                    onPhotoClick({ ...photo, index });
                  }
                }}
              >
                <Image
                  src={transformToCloudFront(photo.url)}
                  alt={photo.caption || 'Photo'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 50vw, 224px"
                />

                {photo.dateCreated && (
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-ink/60 text-paper text-[10px]
                                  tracking-[0.1em] backdrop-blur-sm">
                    {new Date(photo.dateCreated).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {sortedPhotos.length === 0 && (
            <div className="text-center py-16">
              <Camera className="h-8 w-8 text-ink/20 mx-auto mb-4" />
              <p className="font-display text-xl text-ink/70 mb-1">No photographs here yet</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Check back soon</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PhotoSidePanel;
