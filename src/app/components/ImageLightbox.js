'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious
}) {
  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    switch(e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        onPrevious();
        break;
      case 'ArrowRight':
        onNext();
        break;
      default:
        break;
    }
  }, [onClose, onNext, onPrevious]);

  useEffect(() => {
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Cleanup
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  const currentImage = images[currentIndex];

  // Generate a descriptive alt text
  const getAltText = (image) => {
    if (!image) return '';
    return image.title || image.description || `Photo ${currentIndex + 1} of ${images.length}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close lightbox"
      >
        <X className="h-8 w-8" aria-hidden="true" />
      </button>

      {/* Navigation buttons */}
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2
                  hover:bg-white/10 rounded-full transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-8 w-8" aria-hidden="true" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2
                  hover:bg-white/10 rounded-full transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Next image"
      >
        <ChevronRight className="h-8 w-8" aria-hidden="true" />
      </button>

      {/* Image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {currentImage && (
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full max-h-[80vh] aspect-[3/2]">
              <Image
                src={currentImage.url}
                alt={getAltText(currentImage)}
                fill
                sizes="100vw"
                className="object-contain w-full h-full"
                priority={true} // Priority loading for lightbox images
                quality={85}
                onError={(e) => {
                  console.error(`Error loading image: ${currentImage.url}`);
                  e.target.src = '/images/placeholder.jpg';
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-medium mb-2">
                {currentImage.title || currentImage.caption}
              </h3>
              {currentImage.description && (
                <p className="text-gray-300 mb-2">
                  {currentImage.description}
                </p>
              )}
              {currentImage.locationId && (
                <p className="text-gray-300 flex items-center justify-center gap-2">
                  <span className="sr-only">Location:</span>
                  {currentImage.locationId}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image counter */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white"
        aria-live="polite"
        role="status"
      >
        Image {currentIndex + 1} of {images.length}
      </div>
    </div>
  );
}