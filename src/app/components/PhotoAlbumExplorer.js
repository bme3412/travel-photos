'use client';
import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import usePhotoStore from '../store/usePhotoStore';
import AlbumFilters from './AlbumFilters';
import { 
  Search as SearchIcon, 
  Camera as CameraIcon, 
  MapPin,
  Landmark,
  Building2,
  Mountain,
  Building,
  Pyramid,
  Theater
} from 'lucide-react';

export default function PhotoAlbumExplorer() {
  const {
    albums,
    activeYear,
    activeCountry,
    setActiveYear,
    setActiveCountry,
    setAlbums,
    setLoading,
    setError,
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
      result = result.filter((album) => album.country === activeCountry);
    }
    return result;
  }, [albums, searchTerm, activeYear, activeCountry]);

  return (
    <div className="min-h-screen bg-gray-100 py-16 bg-world-map">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4 space-x-6 flex-wrap gap-6">
            {/* Landmark Icons */}
            <Landmark className="h-16 w-16 text-teal-700" aria-label="Eiffel Tower" />
            <Building2 className="h-16 w-16 text-teal-700" aria-label="Statue of Liberty" />
            <Mountain className="h-16 w-16 text-teal-700" aria-label="Great Wall of China" />
            <Building className="h-16 w-16 text-teal-700" aria-label="Colosseum" />
            <Pyramid className="h-16 w-16 text-teal-700" aria-label="Pyramids of Giza" />
            <Theater className="h-16 w-16 text-teal-700" aria-label="Sydney Opera House" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800">Travel Albums</h1>
          <p className="mt-4 text-lg text-gray-600">
            Relive your journeys around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          {/* Search Box */}
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search albums..."
              className="w-full md:w-96 pl-12 pr-6 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-700"
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
            albums={albums}
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
            <CameraIcon className="h-20 w-20 mb-6 text-gray-300" />
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
                alt={album.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <CameraIcon className="h-12 w-12" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-4">
            <h3 className="text-xl font-semibold text-white">{album.name}</h3>
            <p className="text-sm text-gray-200 flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-teal-300" />
              {album.country} - {album.year}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
  