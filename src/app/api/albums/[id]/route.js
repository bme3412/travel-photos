// src/app/api/albums/[id]/route.js

import { readAlbums, readPhotos, readLocations } from '../../../utils/fileHandler';

// Cache for storing data in memory
let dataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData() {
  const now = Date.now();
  
  // Check if cache is valid
  if (dataCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return dataCache;
  }
  
  // Fetch fresh data
  const [albumsData, photosData, locationsData] = await Promise.all([
    readAlbums(),
    readPhotos(),
    readLocations()
  ]);
  
  // Validate data
  if (!albumsData || !photosData || !locationsData) {
    throw new Error('Failed to load required data files');
  }
  
  // Update cache
  dataCache = { albumsData, photosData, locationsData };
  cacheTimestamp = now;
  
  return dataCache;
}

export async function GET(request) {
  try {
    // Extract album ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Album ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get cached data
    const { albumsData, photosData, locationsData } = await getCachedData();

    // Find the album by ID
    const album = albumsData.albums.find((album) => album.id === id);

    if (!album) {
      return new Response(JSON.stringify({ error: 'Album not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure photosData has the 'photos' array
    if (!Array.isArray(photosData.photos)) {
      console.error('photosData.photos is not an array');
      return new Response(JSON.stringify({ error: 'Invalid photos data format.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter photos belonging to this album
    const albumPhotos = photosData.photos.filter((photo) => photo.albumId === id);

    // Extract unique location IDs from photos
    const uniqueLocationIds = [...new Set(albumPhotos.map((photo) => photo.locationId))];

    // Fetch corresponding locations from locations.json
    const albumLocations = locationsData.locations.filter((location) =>
      uniqueLocationIds.includes(location.id)
    );

    // Attach photoCount to each location
    const detailedLocations = albumLocations.map((location) => {
      const photoCount = albumPhotos.filter((photo) => photo.locationId === location.id).length;
      return { ...location, photoCount };
    });

    // Construct the detailed album object
    const detailedAlbum = {
      ...album,
      photos: albumPhotos,
      locations: detailedLocations,
    };

    return new Response(JSON.stringify(detailedAlbum), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error fetching album:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
