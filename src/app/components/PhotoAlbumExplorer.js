"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search as SearchIcon,
  Camera as CameraIcon,
  Landmark,
  Building2,
  Mountain,
  Building,
  Pyramid,
  Theater,
  MapPin,
} from "lucide-react";
import AlbumImage from "./AlbumImage"; // Make sure this import exists
import AlbumFilters from "./AlbumFilters";
import { default as usePhotoStore } from "../store/usePhotoStore";
import countriesData from "../../data/countries.json";
import photosData from "../../data/photos.json";

// Add URL transformation
const transformToCloudFront = (url) => {
  if (!url) return "";
  const path = url
    .replace("https://global-travel.s3.us-east-1.amazonaws.com/", "")
    .replace("https://d1mnon53ja4k10.cloudfront.net/", "")
    .replace(/\.HEIC$/i, ".jpg");
  return `https://d1mnon53ja4k10.cloudfront.net/${path}`;
};

const PhotoAlbumExplorer = () => {
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

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/albums");
        if (!response.ok) {
          throw new Error("Failed to fetch albums.");
        }
        const data = await response.json();

        console.log("Fetched Albums:", data);

        const mergedAlbums = data.map((album) => ({
          ...album,
          photos: photosData.photos.filter(
            (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
          ),
        }));

        console.log("Merged Albums:", mergedAlbums);
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

    const normalizedAlbumId = albumId.toLowerCase();

    const coverPhotoMap = {
      monaco: photos.find((p) => p.url.includes("monaco-panorama.jpg")),
      france: photos.find((p) =>
        p.url.includes("eiffel-tower-straight-on.jpg")
      ),
      hongkong: photos.find((p) => p.url.includes("hongkong-skyline2.jpeg")),
      vietnam: photos.find((p) => p.url.includes("temple.jpg")),
      singapore: photos.find((p) => p.url.includes("singapore-pool-night.jpg")),
      malaysia: photos.find((p) =>
        p.url.includes("malaysia-petronas-couch.jpg")
      ),
      switzerland: photos.find((p) =>
        p.url.includes("zurich-river-bridge.jpg")
      ),
      uruguay: photos.find((p) => p.url.includes("montevideo-palmtree.jpg")),
      chile: photos.find((p) => p.url.includes("easterisland-moai-hat.jpg")),
      brazil: photos.find(
        (p) =>
          p.url.includes("helicopter-beach-sugarloaf.jpg") ||
          p.url.includes("/Brazil/helicopter-beach-sugarloaf.jpg")
      ),
    };

    console.log(`Looking for album: ${normalizedAlbumId}`);
    console.log("Found mapped photo:", coverPhotoMap[normalizedAlbumId]);

    return (
      coverPhotoMap[normalizedAlbumId] ||
      photos.find((photo) => photo.albumId.toLowerCase() === normalizedAlbumId)
    );
  };

  const getCoverPhotoUrl = (photo) => {
    if (!photo || !photo.url) return null;

    const url = transformToCloudFront(photo.url);
    console.log("Processed URL:", url);
    return url;
  };

  const filteredAlbums = React.useMemo(() => {
    let result = [...albums];
    if (searchTerm) {
      result = result.filter((album) =>
        album.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeYear !== "all") {
      result = result.filter((album) => album.year === activeYear);
    }
    if (activeCountry !== "all") {
      result = result.filter((album) => album.countryId === activeCountry);
    }
    return result;
  }, [albums, searchTerm, activeYear, activeCountry]);

  return (
    <div className="min-h-screen bg-gray-100 py-16 bg-world-map">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4 space-x-6 flex-wrap gap-6">
            <Landmark
              className="h-16 w-16 text-teal-700"
              aria-label="Landmark"
            />
            <Building2
              className="h-16 w-16 text-teal-700"
              aria-label="Building"
            />
            <Mountain
              className="h-16 w-16 text-teal-700"
              aria-label="Mountain"
            />
            <Building
              className="h-16 w-16 text-teal-700"
              aria-label="Architecture"
            />
            <Pyramid
              className="h-16 w-16 text-teal-700"
              aria-label="Monument"
            />
            <Theater className="h-16 w-16 text-teal-700" aria-label="Culture" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800">
            Where to go next?
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Explore destinations through our photo collection
          </p>
        </div>

        {/* Search and Filters */}
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

        {/* Albums Grid */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAlbums.map((album) => {
              if (!album || !album.id) {
                console.warn("Invalid album data:", album);
                return null;
              }

              const albumPhoto = getSpecificPhoto(album.id, album.photos || []);
              const coverPhotoUrl = getCoverPhotoUrl(albumPhoto);

              return (
                <Link
                  href={`/albums/${album.id}`}
                  key={album.id}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-64 bg-gray-200">
                      {coverPhotoUrl ? (
                        <div className="relative w-full h-full">
                          <div className="relative w-full h-64">
                            <Image
                              src={coverPhotoUrl}
                              alt={
                                albumPhoto.caption ||
                                `Cover photo for ${album.name}`
                              }
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                              priority={false}
                              quality={75}
                            />
                            {albumPhoto.locationId && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
                                <h3 className="text-xl font-semibold text-white">
                                  {album.name}
                                </h3>
                                <p className="text-sm text-gray-200 flex items-center">
                                  <MapPin
                                    className="h-4 w-4 mr-1 text-teal-300"
                                    aria-hidden="true"
                                  />
                                  <span className="mr-2">
                                    {albumPhoto.locationId}
                                  </span>
                                  <span className="text-teal-300">•</span>
                                  <span className="ml-2">{album.year}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center h-full text-gray-400"
                          role="img"
                          aria-label={`No photos available for ${album.name}`}
                        >
                          <CameraIcon className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 py-24">
            <CameraIcon className="h-20 w-20 mb-6 text-gray-300" />
            <h3 className="text-2xl font-semibold mb-2">No albums found</h3>
            <p className="text-md">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoAlbumExplorer;
