'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import usePhotoStore from '../store/usePhotoStore';
import AlbumFilters from './AlbumFilters';
import AlbumImage from './AlbumImage';
import { 
  Search as SearchIcon, 
  Camera as CameraIcon,
  Landmark,
  Building2,
  Mountain,
  Building,
  Pyramid,
  Theater,
  MapPin
} from 'lucide-react';
import countriesData from '../../data/countries.json';
import photosData from '../../data/photos.json';

// Updated AlbumCard Component with Photo Integration
const AlbumCard = ({ album }) => {
  // Define specific cover photos for certain albums
  const getSpecificPhoto = (albumId, photos) => {
    const normalizedAlbumId = albumId.toLowerCase();
    
    // Find Brazil photo specifically checking both path formats
    const findBrazilPhoto = () => {
      return photos.find(p => 
        p.url.includes('helicopter-beach-sugarloaf.jpg') || 
        p.url.includes('/Brazil/helicopter-beach-sugarloaf.jpg')
      );
    };

    const coverPhotoMap = {
      'monaco': photos.find(p => p.url.includes('monaco-panorama.jpg')),
      'france': photos.find(p => p.url.includes('eiffel-tower-straight-on.jpg')),
      'hongkong': photos.find(p => p.url.includes('hongkong-skyline2.jpeg')),
      'brazil': findBrazilPhoto()
    };
    
    // Debug logging
    console.log(`Looking for album: ${normalizedAlbumId}`);
    console.log('Found mapped photo:', coverPhotoMap[normalizedAlbumId]);
    
    // First try to get the specific mapped photo
    const mappedPhoto = coverPhotoMap[normalizedAlbumId];
    if (mappedPhoto) {
      return mappedPhoto;
    }
    
    // Fallback to finding any photo from the album
    return photos.find(photo => photo.albumId.toLowerCase() === normalizedAlbumId);
  };

  // Find the specific photo for this album
  const albumPhoto = getSpecificPhoto(album.id, photosData.photos);

  // Get cover photo URL with path normalization
  const getCoverPhotoUrl = (photo) => {
    if (!photo) return null;
    
    let url = photo.url;
    
    // Handle Brazil specific case and ensure correct path format
    if (url.includes('helicopter-beach-sugarloaf.jpg') && !url.startsWith('/images/albums/')) {
      url = `/images/albums${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    // Convert HEIC to jpg if necessary
    url = url.replace(/\.HEIC$/i, '.jpg');
    
    console.log('Processed URL:', url);
    return url;
  };

  const coverPhotoUrl = getCoverPhotoUrl(albumPhoto);

  return (
    <Link href={`/albums/${album.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-64 bg-gray-200">
          {coverPhotoUrl ? (
            <div className="relative w-full h-full">
              <AlbumImage
                src={coverPhotoUrl}
                alt={albumPhoto.caption || `Cover photo for ${album.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={false}
                quality={75}
              />
              {albumPhoto.locationId && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
                  <h3 className="text-xl font-semibold text-white">{album.name}</h3>
                  <p className="text-sm text-gray-200 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-teal-300" aria-hidden="true" />
                    <span className="mr-2">{albumPhoto.locationId}</span>
                    <span className="text-teal-300">•</span>
                    <span className="ml-2">{album.year}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400" 
                 role="img" 
                 aria-label={`No photos available for ${album.name}`}>
              <CameraIcon className="h-12 w-12" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// Main PhotoAlbumExplorer Component
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

  return (
    <div className="min-h-screen bg-gray-100 py-16 bg-world-map">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4 space-x-6 flex-wrap gap-6">
            <Landmark className="h-16 w-16 text-teal-700" aria-label="Landmark" />
            <Building2 className="h-16 w-16 text-teal-700" aria-label="Building" />
            <Mountain className="h-16 w-16 text-teal-700" aria-label="Mountain" />
            <Building className="h-16 w-16 text-teal-700" aria-label="Architecture" />
            <Pyramid className="h-16 w-16 text-teal-700" aria-label="Monument" />
            <Theater className="h-16 w-16 text-teal-700" aria-label="Culture" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800">Where to go next?</h1>
          <p className="mt-4 text-lg text-gray-600">
            Explore destinations through our photo collection
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
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

          <AlbumFilters
            onYearFilter={setActiveYear}
            onCountryFilter={setActiveCountry}
            activeYear={activeYear}
            activeCountry={activeCountry}
            countriesData={countriesData}
          />
        </div>

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