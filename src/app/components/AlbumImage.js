// src/app/components/AlbumImage.js

import React, { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';

const AlbumImage = ({ 
  imageUrl, 
  altText = 'Album image', 
  className = '', 
  priority = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className={`relative ${className}`}>
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
  );
};

export default AlbumImage;