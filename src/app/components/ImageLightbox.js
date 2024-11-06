// src/app/components/ImageLightbox.js
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X as CloseIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const LightboxImage = ({ src, alt, ...props }) => {
  // Replace HEIC with jpg in the src path
  const getJpgPath = (path) => path.replace(/\.HEIC$/i, '.jpg');
  
  const [imageSrc, setImageSrc] = useState(getJpgPath(src));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setImageSrc(getJpgPath(src));
    setIsLoading(false);
  }, [src]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 w-full h-full flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-200 w-full h-full flex items-center justify-center">
        <div className="text-red-500 text-center p-4">
          Error loading image<br />
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      {...props}
      onError={(e) => {
        console.error(`Error loading image: ${imageSrc}`);
        setError(new Error('Failed to load image'));
        e.target.src = '/images/placeholder.jpg';
      }}
    />
  );
};

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Close lightbox"
      >
        <CloseIcon className="w-8 h-8" />
      </button>

      {/* Navigation buttons */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Next image"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full">
        <LightboxImage
          src={currentImage.url}
          alt={currentImage.caption || 'Gallery image'}
          fill
          style={{ objectFit: 'contain' }}
          priority
          quality={85}
        />
        
        {/* Caption */}
        {currentImage.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
            <p className="text-center">{currentImage.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}