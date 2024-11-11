'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera as CameraIcon, MapPin } from 'lucide-react';
import AlbumFilters from './AlbumFilters';
import usePhotoStore from '../store/usePhotoStore';  // Fixed import
import countriesData from '../../data/countries.json';
import photosData from '../../data/photos.json';

const transformToCloudFront = (url) => {
  if (!url) return '';
  const path = url
    .replace('https://global-travel.s3.us-east-1.amazonaws.com/', '')
    .replace('https://d1mnon53ja4k10.cloudfront.net/', '')
    .replace(/\.HEIC$/i, '.jpg');
  return `https://d1mnon53ja4k10.cloudfront.net/${path}`;
};

const AlbumCard = ({ album, photo }) => {
  const coverPhotoUrl = photo?.url ? transformToCloudFront(photo.url) : null;

  return (
    <Link href={`/albums/${album.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="relative h-64 bg-gray-200">
          {coverPhotoUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={coverPhotoUrl}
                alt={photo.caption || `Cover photo for ${album.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={false}
                quality={75}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
                <h3 className="text-xl font-semibold text-white group-hover:text-teal-200 transition-colors duration-300">
                  {album.name}
                </h3>
                <p className="text-sm text-gray-200 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-teal-300" aria-hidden="true" />
                  <span className="mr-2">{photo.locationId}</span>
                  <span className="text-teal-300">•</span>
                  <span className="ml-2">{album.year}</span>
                </p>
              </div>
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

const PhotoAlbumExplorer = () => {
  // Fixed Zustand store usage
  const albums = usePhotoStore((state) => state.albums);
  const activeYear = usePhotoStore((state) => state.activeYear);
  const activeCountry = usePhotoStore((state) => state.activeCountry);
  const loading = usePhotoStore((state) => state.loading);
  const setAlbums = usePhotoStore((state) => state.setAlbums);
  const setActiveYear = usePhotoStore((state) => state.setActiveYear);
  const setActiveCountry = usePhotoStore((state) => state.setActiveCountry);
  const setLoading = usePhotoStore((state) => state.setLoading);
  const setError = usePhotoStore((state) => state.setError);

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
    };

    return coverPhotoMap[albumId.toLowerCase()] ||
           photos.find((photo) => photo.albumId.toLowerCase() === albumId.toLowerCase());
  };

  const filteredAlbums = React.useMemo(() => {
    let result = [...albums];
    if (activeYear !== "all") {
      result = result.filter((album) => album.year === activeYear);
    }
    if (activeCountry !== "all") {
      result = result.filter((album) => album.countryId === activeCountry);
    }
    return result;
  }, [albums, activeYear, activeCountry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Section */}
        <div className="mb-8">
          <AlbumFilters
            onYearFilter={setActiveYear}
            onCountryFilter={setActiveCountry}
            activeYear={activeYear}
            activeCountry={activeCountry}
            countriesData={countriesData}
            albums={albums}
          />
        </div>

        {/* Albums Grid */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAlbums.map((album) => {
              if (!album?.id) return null;
              const albumPhoto = getSpecificPhoto(album.id, album.photos || []);
              return (
                <AlbumCard
                  key={album.id}
                  album={album}
                  photo={albumPhoto}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 py-24">
            <CameraIcon className="h-20 w-20 mb-6 text-gray-300" />
            <h3 className="text-2xl font-semibold mb-2">No albums found</h3>
            <p className="text-md">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoAlbumExplorer;