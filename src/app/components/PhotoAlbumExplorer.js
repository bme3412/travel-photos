'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera as CameraIcon, 
  MapPin, 
  Calendar,
  X,
  ArrowRight,
  Image as ImageIcon,
  Grid3X3,
  List
} from 'lucide-react';
import usePhotoStore from '../store/usePhotoStore';

// Enhanced Professional Album Card
const AlbumCard = ({ album, viewMode = 'grid' }) => {
  const coverPhoto = album.coverPhoto;
  const coverPhotoUrl = coverPhoto?.url || null;
  const photoCount = album.photoCount || 0;


  if (viewMode === 'list') {
    return (
      <Link href={`/albums/${album.id}`} className="group block" prefetch={true}>
        <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex">
            {/* Image */}
            <div className="relative w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              {coverPhotoUrl ? (
                <Image
                  src={coverPhotoUrl}
                  alt={coverPhoto.caption || `Cover photo for ${album.name}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <CameraIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-1">
                    {album.name}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{album.year}</span>
                  </div>
                  {album.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {album.description}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500 ml-4">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>{photoCount}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-300 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link href={`/albums/${album.id}`} className="group block" prefetch={true}>
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform">
        {/* Image Container with Overlay */}
        <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {coverPhotoUrl ? (
            <>
              <Image
                src={coverPhotoUrl}
                alt={coverPhoto.caption || `Cover photo for ${album.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={false}
                quality={85}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Photo Count Badge */}
              <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                <ImageIcon className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">{photoCount}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <CameraIcon className="h-16 w-16" />
            </div>
          )}
          
          {/* Title and Location Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300 leading-tight">
                {album.name}
              </h3>
              <div className="flex items-center text-gray-200 text-sm">
                <Calendar className="h-4 w-4 mr-1 text-blue-300" />
                <span>{album.year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {album.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {album.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <span>{photoCount} photos</span>
              </div>
              {coverPhoto?.locationName && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{coverPhoto.locationName}</span>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </article>
    </Link>
  );
};

// Enhanced Header with Controls
const AlbumHeader = ({ 
  onSortChange,
  sortBy,
  viewMode,
  onViewModeChange,
  stats
}) => {
  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'year-desc', label: 'Newest First' },
    { value: 'year-asc', label: 'Oldest First' },
    { value: 'photos-desc', label: 'Most Photos' },
  ];

  const hasFilters = sortBy !== 'year-desc';

  const handleClearFilters = React.useCallback(() => {
    onSortChange('year-desc');
  }, [onSortChange]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
      {/* Stats */}
      <div className="text-gray-600 text-sm font-medium">
        {stats.countries} countries; {stats.photos.toLocaleString()} photos
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 shadow-sm min-w-[140px]"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'grid' 
                ? 'bg-white text-teal-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Grid view"
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-white text-teal-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List view"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Reset Filter Button */}
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
            title="Reset to default sort"
            aria-label="Reset filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const PhotoAlbumExplorer = ({ initialAlbums = null }) => {
  // Store state
  const albums = usePhotoStore((state) => state.albums);
  const loading = usePhotoStore((state) => state.loading);
  const setAlbums = usePhotoStore((state) => state.setAlbums);
  const setLoading = usePhotoStore((state) => state.setLoading);
  const setError = usePhotoStore((state) => state.setError);

  // Local state
  const [sortBy, setSortBy] = useState('year-desc');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    // If initialAlbums provided (from SSR), use them directly
    if (initialAlbums) {
      setAlbums(initialAlbums);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from API (fallback for client-side navigation)
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/albums");
        if (!response.ok) {
          throw new Error("Failed to fetch albums");
        }
        const data = await response.json();

        // Albums arrive as summaries (coverPhoto + photoCount) from the API
        setAlbums(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching albums:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [initialAlbums, setAlbums, setLoading, setError]);

  // Sort albums
  const processedAlbums = React.useMemo(() => {
    let result = [...albums];
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'photos-desc':
          return (b.photoCount || 0) - (a.photoCount || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return result;
  }, [albums, sortBy]);

  // Calculate stats for display
  const stats = React.useMemo(() => {
    const totalPhotos = processedAlbums.reduce((acc, album) => acc + (album.photoCount || 0), 0);
    return {
      countries: 54, // Total countries/territories from travel century list
      photos: totalPhotos
    };
  }, [processedAlbums]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-gray-600 font-medium">Loading your travel collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Header with Controls */}
        <AlbumHeader
          onSortChange={setSortBy}
          sortBy={sortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          stats={stats}
        />

        {/* Albums Grid/List */}
        {processedAlbums.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              : "space-y-4"
          }>
            {processedAlbums.map((album) => {
              if (!album?.id) return null;
              return (
                <AlbumCard
                  key={album.id}
                  album={album}
                  viewMode={viewMode}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 py-24">
            <CameraIcon className="h-20 w-20 mb-6 text-gray-300" />
            <h3 className="text-2xl font-semibold mb-2">No albums found</h3>
            <p className="text-lg mb-6">
              Try adjusting your filters
            </p>
            <button
              onClick={() => {
                setSortBy('year-desc');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoAlbumExplorer;