'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

const AlbumImage = ({
  imageUrl,
  altText = 'Album image',
  className = '',
  priority = false,
  images = [], // Array of all images in the album
  currentIndex = 0 // Index of this image in the array
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!imageUrl) {
    return (
      <div className={`${className} min-h-[200px] flex items-center justify-center bg-gray-100 rounded-md`}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertTriangle className="h-4 w-4" />
          <span>No image URL provided</span>
        </div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className={`${className} min-h-[200px] flex items-center justify-center bg-gray-100 rounded-md`}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertTriangle className="h-4 w-4" />
          <span>Failed to load image</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative ${className} cursor-pointer`}
        onClick={() => setIsLightboxOpen(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md" />
        )}
        <div className="relative w-full h-full min-h-[200px]">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className={`
              object-cover rounded-md
              ${isLoading ? 'opacity-0' : 'opacity-100'}
              transition-opacity duration-300 ease-in-out
            `}
            onError={() => setImageError(true)}
            onLoadingComplete={() => setIsLoading(false)}
            sizes="(max-width: 640px) 100vw,
                   (max-width: 1024px) 50vw,
                   33vw"
            priority={priority}
            quality={85}
          />
        </div>
      </div>

      {isLightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default AlbumImage;