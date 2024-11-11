'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X as CloseIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const LightboxImage = ({ src, alt, onLoadingComplete, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const imageRef = useRef(null);
  
  const handleLoad = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        {...props}
        className={`
          object-contain
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-all duration-500 ease-out
        `}
        onLoadingComplete={handleLoad}
        onError={(e) => {
          console.error(`Error loading image: ${src}`);
          setError(new Error('Failed to load image'));
        }}
        quality={85}
      />
    </div>
  );
};

export default function ImageLightbox({ 
  images, 
  currentIndex, 
  onClose,
  onNext,
  onPrevious
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [preloadedIndexes, setPreloadedIndexes] = useState(new Set([currentIndex]));
  
  // Preload adjacent images
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const indexesToPreload = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length
    ];
    
    indexesToPreload.forEach(index => {
      if (!preloadedIndexes.has(index)) {
        const img = new window.Image();
        img.src = images[index].url;
        setPreloadedIndexes(prev => new Set([...prev, index]));
      }
    });
  }, [currentIndex, images, preloadedIndexes]);

  const handleKeyDown = useCallback((e) => {
    if (isAnimating) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        onPrevious?.();
        break;
      case 'ArrowRight':
        onNext?.();
        break;
      case 'Escape':
        onClose?.();
        break;
      default:
        break;
    }
  }, [onNext, onPrevious, onClose, isAnimating]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  const handleTransition = (action) => {
    if (isAnimating) return;
    setIsAnimating(true);
    action();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="fixed inset-0 z-[60] backdrop-blur-lg bg-black/95 transition-all duration-300">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 
                     transition-all duration-200 backdrop-blur-sm z-50"
          aria-label="Close lightbox"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleTransition(onPrevious)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 
                     text-white hover:bg-black/50 transition-all duration-200 backdrop-blur-sm z-50"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleTransition(onNext)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 
                     text-white hover:bg-black/50 transition-all duration-200 backdrop-blur-sm z-50"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto px-4">
          <LightboxImage
            src={currentImage.url}
            alt={currentImage.caption || 'Gallery image'}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
            onLoadingComplete={() => setIsAnimating(false)}
          />
          
          {(currentImage.caption || currentImage.locationId) && (
            <div className="absolute bottom-4 left-4 right-4 p-6 bg-black/30 backdrop-blur-sm 
                          rounded-xl border border-white/10">
              <div className="max-w-3xl mx-auto">
                {currentImage.caption && (
                  <h3 className="text-white text-lg font-medium mb-1">
                    {currentImage.caption}
                  </h3>
                )}
                {currentImage.locationId && (
                  <p className="text-gray-300 text-sm">
                    {currentImage.locationId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm 
                      text-white text-sm z-50">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}