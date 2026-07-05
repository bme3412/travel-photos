"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import { transformToCloudFront } from '../../utils/imageUtils';

// Display fields (locationName, albumTitle, country, flag) are resolved
// server-side — by the page and by /api/random-photo — via photoEnrichment.js
const formatCaption = (photo) => {
  const today = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
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
        <div className="animate-spin text-teal-600">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-gray-500">No photo available</p>
      </div>
    );
  }

  const caption = formatCaption(photo);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-2">
          📸 Photo of the Day
        </h1>
        <p className="text-gray-500 text-sm">
          Discover a new stunning travel photo every day from my collection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Photo Section */}
        <div className="lg:col-span-3 relative h-[70vh] lg:h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={transformToCloudFront(photo.url)}
            alt={`${caption.location}, ${caption.country}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700"
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        </div>

        {/* Info Section */}
        <div className="lg:col-span-2 p-6">
          <div className="space-y-8">
            {/* Caption Section */}
            <div className="space-y-4">
              <p className="text-sm tracking-wider text-gray-500 font-light uppercase">
                {caption.date}
              </p>
              <h2 className="text-4xl font-light text-gray-900">
                {caption.location}
              </h2>
              <p className="text-xl text-gray-600 font-light tracking-wide">
                {caption.flag} {caption.country}
              </p>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-base text-gray-700 leading-relaxed">
                  {photo.caption || `A stunning moment captured in ${caption.location}, ${caption.country}. This photo is part of my ${caption.albumTitle} collection, showcasing the beauty and character of this incredible destination.`}
                </p>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={getRandomPhoto}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg 
                       hover:bg-gray-800 transition-all duration-300 transform hover:scale-105
                       text-sm tracking-wider font-light disabled:opacity-50"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'See Another Photo'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Click to explore random photos from all my travels
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoOfTheDay;