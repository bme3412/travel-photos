import React, { useEffect, useCallback } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full 
                   transition-colors duration-200"
        aria-label="Close lightbox"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation buttons */}
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 
                   hover:bg-white/10 rounded-full transition-colors duration-200"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 
                   hover:bg-white/10 rounded-full transition-colors duration-200"
        aria-label="Next image"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {currentImage && (
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full max-h-[80vh] aspect-[3/2]">
              <img
                src={currentImage.url}
                alt={currentImage.caption}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-medium mb-2">
                {currentImage.caption}
              </h3>
              <p className="text-gray-300">
                {currentImage.location}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}