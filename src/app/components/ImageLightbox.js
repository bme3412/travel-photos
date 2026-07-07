'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X as CloseIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const LightboxImage = ({ src, alt, onLoadingComplete, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);

  const imageRef = useRef(null);
  
  const handleLoad = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-paper animate-spin" />
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
        onError={() => {
          console.error(`Error loading image: ${src}`);
          setIsLoading(false);
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
    <div className="fixed inset-0 z-[60] backdrop-blur-lg bg-ink/95 transition-all duration-300">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/50 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-paper/70 hover:text-paper
                     transition-colors duration-200 z-50"
          aria-label="Close lightbox"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleTransition(onPrevious)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-paper/70 hover:text-paper
                     transition-colors duration-200 z-50"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <button
          onClick={() => handleTransition(onNext)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-paper/70 hover:text-paper
                     transition-colors duration-200 z-50"
          aria-label="Next image"
        >
          <ChevronRight className="w-7 h-7" />
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
            <div className="absolute bottom-4 left-4 right-4 px-6 py-5 bg-ink/50 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto text-center">
                {currentImage.caption && (
                  <h3 className="font-display text-paper text-xl tracking-tight mb-1">
                    {currentImage.caption}
                  </h3>
                )}
                {currentImage.locationId && (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-paper/60">
                    {currentImage.locationId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-4 px-3 py-1 bg-ink/50 backdrop-blur-sm
                      text-paper/80 text-[12px] tracking-[0.14em] tabular-nums z-50">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}