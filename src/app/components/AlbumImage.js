// src/app/components/AlbumImage.js
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const AlbumImage = ({ src, alt, ...props }) => {
  const getImagePath = (path) => {
    if (!path) return '';

    // Clean the path
    const cleanPath = path
      .replace(/\.HEIC$/i, '.jpg')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/')
      .replace(/^images\/albums\//, '')
      .replace(/^albums\//, '');

    // Use S3 URL in production, local in development
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      return `https://global-travel.s3.us-east-1.amazonaws.com/albums/${cleanPath}`;
    }

    return `/images/albums/${cleanPath}`;
  };

  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);
    
    const processedSrc = getImagePath(src);
    console.log('Processing image:', {
      original: src,
      processed: processedSrc,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'
    });
    
    setImageSrc(processedSrc);
    setIsLoading(false);
  }, [src]);

  const handleImageError = (e) => {
    console.error('Image load error:', {
      src: imageSrc,
      error: e.message,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'
    });
    
    // Try local fallback in development
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
      const localPath = `/images/albums/${src}`;
      console.log('Attempting local fallback:', localPath);
      setImageSrc(localPath);
    } else {
      setError(new Error('Failed to load image'));
    }
  };

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm">
        <div className="text-red-500 p-2 text-center">
          <div>Unable to load image</div>
          <div className="text-xs mt-1 text-gray-500">{imageSrc}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-gray-200" />
      ) : (
        <Image
          src={imageSrc}
          alt={alt || 'Travel photo'}
          {...props}
          loading="eager"
          quality={85}
          onError={handleImageError}
          className={`${props.className || ''} transition-opacity duration-300`}
        />
      )}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-1">
          {process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'}
        </div>
      )}
    </div>
  );
};

export default AlbumImage;