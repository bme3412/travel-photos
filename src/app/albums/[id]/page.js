// src/app/albums/[id]/page.js
'use client';
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import usePhotoStore from '../../store/usePhotoStore';
import AlbumStats from '../../components/AlbumStats';
import AlbumMap from '../../components/AlbumMap';
import ImageLightbox from '../../components/ImageLightbox';
import { ArrowLeft, Grid, Map as MapIcon, Loader, MapPin } from 'lucide-react';
import Link from 'next/link';

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
  const [view, setView] = React.useState('grid'); // 'grid' or 'map'

  useEffect(() => {
    const fetchAlbumData = async (id) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch album data.');
        }
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-12 w-12 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!currentAlbum) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-xl">Album not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <Link href="/" className="inline-flex items-center text-teal-700 hover:text-teal-900 mb-6">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Albums
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{currentAlbum.name}</h1>
              <p className="text-gray-600 flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-1 text-teal-700" />
                {currentAlbum.country}
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <button
                onClick={() => setView('grid')}
                className={`p-3 rounded-full ${
                  view === 'grid' ? 'bg-teal-700 text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
                aria-label="Grid View"
              >
                <Grid size={24} />
              </button>
              <button
                onClick={() => setView('map')}
                className={`p-3 rounded-full ${
                  view === 'map' ? 'bg-teal-700 text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
                aria-label="Map View"
              >
                <MapIcon size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <AlbumStats album={currentAlbum} />

        {/* Content */}
        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {currentAlbum.photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => openLightbox({ ...photo, index })}
                className="group relative rounded-lg overflow-hidden bg-gray-200 shadow-md hover:shadow-lg transition-shadow"
                aria-label={`Open photo ${photo.caption}`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="object-cover w-full h-full group-hover:opacity-90 transition-opacity duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-4">
                  <p className="text-lg font-medium text-white">{photo.caption}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <AlbumMap locations={currentAlbum.locations} />
        )}
      </div>

      {/* Lightbox */}
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
            const prevIndex =
              (selectedPhoto.index - 1 + currentAlbum.photos.length) % currentAlbum.photos.length;
            openLightbox({ ...currentAlbum.photos[prevIndex], index: prevIndex });
          }}
        />
      )}
    </div>
  );
}
