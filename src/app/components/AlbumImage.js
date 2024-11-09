'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

const AlbumImage = ({ src, alt, priority = false, quality = 75, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 2;

  const getImageUrl = (path) => {
    if (!path) return '';

    const cleanPath = path
      .replace(/\.HEIC$/i, '.jpg')
      .replace(/^\/?(images\/)?albums\//, '')
      .replace(/\/+/g, '/');

    return `https://${CLOUDFRONT_DOMAIN}/albums/${cleanPath}`;
  };

  useEffect(() => {
    if (!imageRef.current || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.unobserve(entries[0].target);
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.01
      }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleImageError = () => {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      setIsLoading(true);
      // Force image reload
      const img = imageRef.current?.querySelector('img');
      if (img) {
        const currentSrc = img.src;
        img.src = '';
        setTimeout(() => {
          img.src = currentSrc;
        }, 1000 * retryCount.current); // Exponential backoff
      }
    } else {
      setIsError(true);
      setIsLoading(false);
    }
  };

  if (!priority && !isInView) {
    return <div ref={imageRef} className="w-full h-full bg-gray-100" />;
  }

  if (isError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-gray-400 text-sm">Image not available</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={imageRef} className="relative w-full h-full">
      <Image
        src={getImageUrl(src)}
        alt={alt || 'Travel photo'}
        {...props}
        loading={priority ? 'eager' : 'lazy'}
        quality={quality}
        onError={handleImageError}
        onLoad={() => {
          setIsLoading(false);
          setIsError(false);
        }}
        onLoadingComplete={() => {
          setIsLoading(false);
          setIsError(false);
        }}
        sizes={props.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        className={`
          ${props.className || ''} 
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
      />
      {isLoading && !isError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

export default AlbumImage;