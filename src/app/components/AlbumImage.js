// src/app/components/AlbumImage.js
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const AlbumImage = ({ src, alt, ...props }) => {
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

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm">
        <div className="text-red-500 p-2 text-center">
          Failed to load image<br />
          {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full animate-pulse bg-gray-200 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageSrc}
        alt={alt}
        {...props}
        loading="eager"
        onError={(e) => {
          console.error(`Error loading image: ${imageSrc}`);
          setError(new Error('Failed to load image'));
          e.target.src = '/images/placeholder.jpg';
        }}
      />
    </div>
  );
};

export default AlbumImage;