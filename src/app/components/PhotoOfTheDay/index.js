"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { transformToCloudFront } from '../../utils/imageUtils';

// Display fields (locationName, albumTitle, country, flag) are resolved
// server-side — by the page and by /api/random-photo — via photoEnrichment.js
const formatCaption = (photo) => {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    date: today,
    location: photo.locationName || photo.locationId,
    albumTitle: photo.albumTitle || photo.albumId,
    country: photo.country || '',
    flag: photo.flag || ''
  };
};

const PhotoOfTheDay = ({ initialPhoto = null }) => {
  const [photo, setPhoto] = useState(initialPhoto);
  const [loading, setLoading] = useState(!initialPhoto);

  const getRandomPhoto = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/random-photo?random=true');
      const data = await response.json();
      if (response.ok) setPhoto(data);
    } catch (error) {
      console.error('Error fetching photo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If initialPhoto is provided from SSR, use it
    if (initialPhoto) {
      setPhoto(initialPhoto);
      setLoading(false);
    } else {
      // Otherwise fetch from API (fallback)
      getRandomPhoto();
    }
  }, [initialPhoto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-3">
          <p className="font-display text-2xl text-ink/80">Choosing today&apos;s photograph…</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Copy This Trip</p>
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-6">
        <p className="font-display text-2xl text-ink/70 mb-2">Nothing developed today</p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Try again in a moment</p>
      </div>
    );
  }

  const caption = formatCaption(photo);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2">{caption.date}</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Photo of the day</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
        {/* Photo Section */}
        <div className="lg:col-span-3 relative aspect-[3/2] lg:aspect-auto lg:h-[78vh] overflow-hidden bg-ink/5">
          <Image
            src={transformToCloudFront(photo.url)}
            alt={`${caption.location}, ${caption.country}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        </div>

        {/* Info Section */}
        <div className="lg:col-span-2 lg:pt-2">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight leading-tight">
                {caption.location}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted mt-3">
                {caption.flag && <span className="mr-1.5 tracking-normal">{caption.flag}</span>}
                {caption.country}
              </p>
            </div>

            {photo.caption && (
              <p className="text-base leading-relaxed text-ink/80 border-t border-ink/10 pt-6">
                {photo.caption}
              </p>
            )}

            <div className="flex flex-col gap-5 pt-2">
              <button
                onClick={getRandomPhoto}
                disabled={loading}
                className="group inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em]
                           text-ink/70 border-b border-ink/20 pb-1 hover:border-accent hover:text-ink
                           transition-colors duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Developing…' : 'Draw another'}
              </button>

              {photo.albumId && (
                <Link
                  href={`/albums/${photo.albumId}`}
                  className="group inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em]
                             text-muted hover:text-ink transition-colors duration-300"
                >
                  From {caption.albumTitle}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoOfTheDay;
