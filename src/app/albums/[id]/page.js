'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import usePhotoStore from '../../store/usePhotoStore';
import ImageLightbox from '../../components/ImageLightbox';
import { ArrowLeft, Grid, Map as MapIcon, Loader, Camera } from 'lucide-react';
import Link from 'next/link';

// Lazy load the AlbumMap component
const AlbumMap = React.lazy(() => import('../../components/AlbumMap'));

const transformToCloudFront = (url) => {
  if (!url) return '';
  const path = url
    .replace('https://global-travel.s3.us-east-1.amazonaws.com/', '')
    .replace('https://d1mnon53ja4k10.cloudfront.net/', '')
    .replace(/\.HEIC$/i, '.jpg');
  return `https://d1mnon53ja4k10.cloudfront.net/${path}`;
};

const PhotoCard = React.memo(({ photo, index, onPhotoClick }) => {
  const cloudFrontUrl = transformToCloudFront(photo.url);

  return (
    <div 
      className="group relative aspect-[3/2] rounded-xl overflow-hidden bg-gray-100 cursor-pointer
                 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      onClick={() => onPhotoClick({ ...photo, index, url: cloudFrontUrl })}
    >
      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
      <Image
        src={cloudFrontUrl}
        alt={photo.title || 'Album photo'}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority={index < 4}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                      p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-medium text-lg">
          {photo.title}
        </h3>
      </div>
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';

// Loading component for the map
const MapLoading = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
    <div className="h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-8 w-8 text-teal-600 animate-spin" />
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  </div>
);

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
  const [view, setView] = useState('grid'); // Start with grid view to avoid loading map initially

  useEffect(() => {
    const fetchAlbumData = async (id) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) throw new Error('Failed to fetch album data.');
        const data = await response.json();

        if (data.photos) {
          data.photos = data.photos.map(photo => ({
            ...photo,
            originalUrl: photo.url,
            url: transformToCloudFront(photo.url)
          }));
        }

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
          href="/albums"
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
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/albums" 
                className="text-teal-600 hover:text-teal-700 transition-colors duration-200 group"
              >
                <ArrowLeft className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-200" />
              </Link>
              <h1 className="text-xl font-bold text-gray-800">{currentAlbum.name}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                  view === 'grid'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Grid View"
              >
                <Grid size={20} />
                <span className="text-sm font-medium">Photos</span>
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-3 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                  view === 'map'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Map View"
              >
                <MapIcon size={20} />
                <span className="text-sm font-medium">Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {view === 'map' ? (
          <div className="space-y-4 pt-4">
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-min pb-4">
                {currentAlbum.photos?.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="w-72 flex-shrink-0 transform transition-all duration-300 hover:scale-105"
                  >
                    <PhotoCard
                      photo={photo}
                      index={index}
                      onPhotoClick={openLightbox}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <Suspense fallback={<MapLoading />}>
              <AlbumMap album={currentAlbum} />
            </Suspense>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {currentAlbum.photos?.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onPhotoClick={openLightbox}
              />
            ))}
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