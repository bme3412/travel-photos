'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import usePhotoStore from '../../store/usePhotoStore';
import AlbumMap from '../../components/AlbumMap';
import AlbumStats from '../../components/AlbumStats';
import ImageLightbox from '../../components/ImageLightbox';
import { ArrowLeft, Grid, Map as MapIcon, Loader, MapPin, Camera } from 'lucide-react';
import Link from 'next/link';

const shimmer = (w, h) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#eee" offset="20%" />
      <stop stop-color="#f5f5f5" offset="50%" />
      <stop stop-color="#eee" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#eee" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const PhotoCard = React.memo(({ photo, index, onPhotoClick }) => {
  return (
    <div 
      className="group relative aspect-[3/2] rounded-xl overflow-hidden bg-gray-100 cursor-pointer
                 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      onClick={() => onPhotoClick({ ...photo, index })}
    >
      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
      <Image
        src={photo.url}
        alt={photo.caption}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
        priority={index < 4} // Prioritize loading first 4 images
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                      p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-medium text-lg mb-1 drop-shadow-sm">
          {photo.caption}
        </h3>
        <p className="text-white/90 text-sm flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {photo.location}
        </p>
      </div>
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';

export default function AlbumPage() {
  const params = useParams();
  const {
    currentAlbum,
    isLightboxOpen,
    selectedPhoto,
    openLightbox,
    closeLightbox,
    setCurrentAlbum,
    setLoading,
    setError,
    loading,
  } = usePhotoStore();
  const [view, setView] = React.useState('grid');

  useEffect(() => {
    const fetchAlbumData = async (id) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) throw new Error('Failed to fetch album data.');
        const data = await response.json();
        setCurrentAlbum(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAlbumData(params.id);
    }
  }, [params.id, setCurrentAlbum, setLoading, setError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader className="h-12 w-12 text-teal-600 animate-spin" />
        <p className="text-gray-600 animate-pulse">Loading album...</p>
      </div>
    );
  }

  if (!currentAlbum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Camera className="h-16 w-16 text-gray-400" />
        <p className="text-gray-600 text-lg">Album not found.</p>
        <Link 
          href="/"
          className="text-teal-600 hover:text-teal-700 flex items-center gap-2 mt-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to albums
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-teal-600 hover:text-teal-700 
                       transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Albums
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{currentAlbum.name}</h1>
              <p className="text-gray-600 flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-1 text-teal-600" />
                {currentAlbum.country}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('grid')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  view === 'grid'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Grid View"
              >
                <Grid size={22} />
              </button>
              <button
                onClick={() => setView('map')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  view === 'map'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Map View"
              >
                <MapIcon size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <AlbumStats album={currentAlbum} />

        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {currentAlbum.photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onPhotoClick={openLightbox}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <AlbumMap locations={currentAlbum.locations} />
          </div>
        )}
      </div>

      {isLightboxOpen && selectedPhoto && (
        <ImageLightbox
          images={currentAlbum.photos}
          currentIndex={selectedPhoto.index}
          onClose={closeLightbox}
          onNext={() => {
            const nextIndex = (selectedPhoto.index + 1) % currentAlbum.photos.length;
            openLightbox({ ...currentAlbum.photos[nextIndex], index: nextIndex });
          }}
          onPrevious={() => {
            const prevIndex = (selectedPhoto.index - 1 + currentAlbum.photos.length) % currentAlbum.photos.length;
            openLightbox({ ...currentAlbum.photos[prevIndex], index: prevIndex });
          }}
        />
      )}
    </div>
  );
}
