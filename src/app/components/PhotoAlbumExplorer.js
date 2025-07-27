'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera as CameraIcon, 
  MapPin, 
  Calendar,
  X,
  Search,
  ArrowRight,
  Image as ImageIcon,
  Grid3X3,
  List
} from 'lucide-react';
import usePhotoStore from '../store/usePhotoStore';
import photosData from '../../data/photos.json';

const transformToCloudFront = (url) => {
  if (!url) return '';
  const path = url
    .replace('https://global-travel.s3.us-east-1.amazonaws.com/', '')
    .replace('https://d1mnon53ja4k10.cloudfront.net/', '')
    .replace(/\.HEIC$/i, '.jpg');
  return `https://d1mnon53ja4k10.cloudfront.net/${path}`;
};

// Enhanced Professional Album Card
const AlbumCard = ({ album, photo, viewMode = 'grid' }) => {
  const coverPhotoUrl = photo?.url ? transformToCloudFront(photo.url) : null;
  const photoCount = album.photos?.length || 0;
  


  if (viewMode === 'list') {
    return (
      <Link href={`/albums/${album.id}`} className="group block">
        <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex">
            {/* Image */}
            <div className="relative w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              {coverPhotoUrl ? (
                <Image
                  src={coverPhotoUrl}
                  alt={photo.caption || `Cover photo for ${album.name}`}
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
    <Link href={`/albums/${album.id}`} className="group block">
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform">
        {/* Image Container with Overlay */}
        <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {coverPhotoUrl ? (
            <>
              <Image
                src={coverPhotoUrl}
                alt={photo.caption || `Cover photo for ${album.name}`}
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
              {photo?.locationId && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{photo.locationId}</span>
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

// Streamlined Filter Component - Focus on Photos
const StreamlinedControls = ({ 
  onSortChange,
  sortBy,
  onSearchChange,
  searchTerm,
  viewMode,
  onViewModeChange
}) => {
  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'year-desc', label: 'Newest First' },
    { value: 'year-asc', label: 'Oldest First' },
    { value: 'photos-desc', label: 'Most Photos' },
  ];

  const hasFilters = searchTerm || sortBy !== 'name';

  const handleClearFilters = React.useCallback(() => {
    onSearchChange('');
    onSortChange('name');
  }, [onSearchChange, onSortChange]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[130px]"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PhotoAlbumExplorer = () => {
  // Store state
  const albums = usePhotoStore((state) => state.albums);
  const loading = usePhotoStore((state) => state.loading);
  const setAlbums = usePhotoStore((state) => state.setAlbums);
  const setLoading = usePhotoStore((state) => state.setLoading);
  const setError = usePhotoStore((state) => state.setError);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/albums");
        if (!response.ok) {
          throw new Error("Failed to fetch albums");
        }
        const data = await response.json();

        const mergedAlbums = data.map((album) => ({
          ...album,
          photos: photosData.photos.filter(
            (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
          ),
        }));

        setAlbums(mergedAlbums);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching albums:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [setAlbums, setLoading, setError]);

  const getSpecificPhoto = (albumId, photos) => {
    if (!albumId || !Array.isArray(photos)) return null;

    const coverPhotoMap = {
      monaco: photos.find((p) => p.url.includes("monaco-panorama.jpg")),
      france: photos.find((p) => p.url.includes("eiffel-tower-straight-on.jpg")),
      italy: photos.find((p) => p.url.includes("venice-gondolas.jpg")),
      hongkong: photos.find((p) => p.url.includes("hongkong-skyline2.jpeg")),
      vietnam: photos.find((p) => p.url.includes("temple.jpg")),
      singapore: photos.find((p) => p.url.includes("singapore-pool-night.jpg")),
      malaysia: photos.find((p) => p.url.includes("malaysia-petronas-couch.jpg")),
      switzerland: photos.find((p) => p.url.includes("zurich-river-bridge.jpg")),
      uruguay: photos.find((p) => p.url.includes("montevideo-palmtree.jpg")),
      portugal: photos.find((p) => p.url.includes("lisbon-arch-close.jpg")),
      spain: photos.find((p) => p.url.includes("madrid-castle.jpg")),
      argentina: photos.find((p) => p.url.includes("buenosaires-panorama.jpg")),
      chile: photos.find((p) => p.url.includes("easterisland-moai-hat.jpg")),
      belgium: photos.find((p) => p.url.includes("bruges-canal-tree-tower.jpg")),
      bosnia: photos.find((p) => p.url.includes("mostar-pano.jpg")),
      croatia: photos.find((p) => p.url.includes("dubrovnik-steps.jpg")),
      montenegro: photos.find((p) => p.url.includes("perast-contrast.jpg")),
      mauritius: photos.find((p) => p.url.includes("mauritius-beach-house.jpg")),
      botswana: photos.find((p) => p.url.includes("chobe-three-giraffes-pose.jpg")),
      southafrica: photos.find((p) => p.url.includes("capetown-beach-sunset.jpg")),
      belize: photos.find((p) => p.url.includes("belize-sun-hut-palm.jpg")),
      guatemala: photos.find((p) => p.url.includes("guatemala-tikal-5_rotated.jpg")),
      australia: photos.find((p) => p.url.includes("sydney-opera-house2.jpg")),
      china: photos.find((p) => p.url.includes("shanghai-skyline.jpg")),
      japan: photos.find((p) => p.url.includes("tokyo-tower.jpg")),
      thailand: photos.find((p) => p.url.includes("phuket-boat.jpg")),
      vatican: photos.find((p) => p.url.includes("vatican-view.jpg")),
      austria: photos.find((p) => p.url.includes("austria-palace.jpg")),
      hungary: photos.find((p) => p.url.includes("budapest-bath.jpg")),
      netherlands: photos.find((p) => p.url.includes("amsterdam-canals.jpg")),
      finland: photos.find((p) => p.url.includes("helsinki-cathedral-clean.jpg")),
      brazil: photos.find(
        (p) => p.url.includes("helicopter-beach-sugarloaf.jpg") ||
              p.url.includes("/Brazil/helicopter-beach-sugarloaf.jpg")
      ),
      stbarts: photos.find((p) => p.url.includes("stbarts") || p.url.includes("barthélemy"))
    };

    return coverPhotoMap[albumId.toLowerCase()] ||
           photos.find((photo) => photo.albumId.toLowerCase() === albumId.toLowerCase());
  };

  // Filter and sort albums
  const processedAlbums = React.useMemo(() => {
    let result = [...albums];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter((album) =>
        album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'photos-desc':
          return (b.photos?.length || 0) - (a.photos?.length || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return result;
  }, [albums, searchTerm, sortBy]);

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


        {/* Streamlined Controls */}
        <StreamlinedControls
          onSortChange={setSortBy}
          sortBy={sortBy}
          onSearchChange={setSearchTerm}
          searchTerm={searchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            {processedAlbums.length === albums.length 
              ? `Showing all ${albums.length} albums`
              : `Showing ${processedAlbums.length} of ${albums.length} albums`
            }
          </p>
        </div>

        {/* Albums Grid/List */}
        {processedAlbums.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              : "space-y-4"
          }>
            {processedAlbums.map((album) => {
              if (!album?.id) return null;
              const albumPhoto = getSpecificPhoto(album.id, album.photos || []);
              return (
                <AlbumCard
                  key={album.id}
                  album={album}
                  photo={albumPhoto}
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
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSortBy('name');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoAlbumExplorer;