'use client';

import React, { useEffect } from 'react';  // Removed useState since it's not used
import Image from 'next/image';
// Removed unused ImageLightbox import
import Link from 'next/link';
import { 
  // Removed unused imports: ArrowLeft, Grid, MapIcon
  Loader, 
  MapPin, 
  Camera,
  Search as SearchIcon
} from 'lucide-react';
import usePhotoStore from '../store/usePhotoStore';
import AlbumFilters from '../components/AlbumFilters';
import countriesData from '../../data/countries.json';

export default function AlbumsPage() {
  const {
    albums,
    activeYear,
    activeCountry,
    setActiveYear,
    setActiveCountry,
    setAlbums,
    setLoading,
    setError,
    loading,
  } = usePhotoStore();

  const [searchTerm, setSearchTerm] = React.useState('');

  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/albums');
        if (!response.ok) {
          throw new Error('Failed to fetch albums.');
        }
        const data = await response.json();
        setAlbums(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [setAlbums, setLoading, setError]);

  // Filter albums
  const filteredAlbums = React.useMemo(() => {
    let result = [...albums];
    if (searchTerm) {
      result = result.filter((album) =>
        album.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeYear !== 'all') {
      result = result.filter((album) => album.year === activeYear);
    }
    if (activeCountry !== 'all') {
      result = result.filter((album) => album.countryId === activeCountry);
    }
    return result;
  }, [albums, searchTerm, activeYear, activeCountry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-gray-600">Loading albums...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-16 bg-world-map">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4 space-x-6 flex-wrap gap-6">
            <MapPin className="h-16 w-16 text-teal-700" aria-label="Eiffel Tower" />
            <Camera className="h-16 w-16 text-teal-700" aria-label="Statue of Liberty" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800">Where to go next?</h1>
          <p className="mt-4 text-lg text-gray-600">
            {albums.length} albums across {
              new Set(albums.map(album => album.countryId)).size
            } countries
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          {/* Search Box */}
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search albums..."
              className="w-full md:w-96 pl-12 pr-6 py-3 border border-gray-300 rounded-full 
                       focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent
                       bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Album Filters */}
          <AlbumFilters
            onYearFilter={setActiveYear}
            onCountryFilter={setActiveCountry}
            activeYear={activeYear}
            activeCountry={activeCountry}
            countriesData={countriesData.countries}
          />
        </div>

        {/* Album Grid or Empty State */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 py-24">
            <Camera className="h-20 w-20 mb-6 text-gray-300" />
            <h3 className="text-2xl font-semibold mb-2">No albums found</h3>
            <p className="text-md">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// AlbumCard Component
const AlbumCard = ({ album }) => (
  <Link href={`/albums/${album.id}`} className="group">
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-64 bg-gray-200">
        {album.photos && album.photos[0] ? (
          <div className="relative w-full h-full">
            <Image
              src={album.photos[0].url}
              alt={album.photos[0].caption || `Cover photo for ${album.name}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
              quality={75}
              onError={(e) => {
                console.error(`Error loading image: ${album.photos[0].url}`);
                e.target.src = '/images/placeholder.jpg';
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400" 
               role="img" 
               aria-label={`No photos available for ${album.name}`}>
            <Camera className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <h3 className="text-xl font-semibold text-white">{album.name}</h3>
          <p className="text-sm text-gray-200 flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-teal-300" aria-hidden="true" />
            <span>{album.countryId === 'all' ? 'All Countries' : album.countryId}</span>
            <span className="mx-2">•</span>
            <span>{album.year}</span>
          </p>
        </div>
      </div>
    </div>
  </Link>
);