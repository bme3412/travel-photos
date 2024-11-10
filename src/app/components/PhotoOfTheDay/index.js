"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';

const formatCaption = (photo) => {
  const today = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  return {
    date: today,
    location: photo.locationId,
    country: photo.albumId
  };
};

const PhotoOfTheDay = () => {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  const getRandomPhoto = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/random-photo');
      const data = await response.json();
      if (response.ok) setPhoto(data);
    } catch (error) {
      console.error('Error fetching photo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRandomPhoto();
  }, []);

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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Photo Section */}
        <div className="lg:col-span-3 relative h-[70vh] lg:h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={photo.url}
            alt={`${photo.locationId}, ${photo.albumId}`}
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
            <div className="space-y-1">
              <p className="text-sm tracking-wider text-gray-500 font-light">
                {caption.date}
              </p>
              <h3 className="text-2xl font-light text-gray-800">
                {caption.location}
              </h3>
              <p className="text-lg text-gray-600 font-light tracking-wide">
                {caption.country}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={getRandomPhoto}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg 
                       hover:bg-gray-800 transition-all duration-300 transform hover:scale-105
                       text-sm tracking-wider font-light"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Discover Another Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoOfTheDay;