// src/app/api/albums/route.js

import { readAlbums, readPhotos } from '../../utils/fileHandler';

// Cache for storing albums data
let albumsCache = null;
let albumsCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedAlbumsData() {
  const now = Date.now();
  
  // Check if cache is valid
  if (albumsCache && albumsCacheTimestamp && (now - albumsCacheTimestamp) < CACHE_DURATION) {
    return albumsCache;
  }
  
  // Fetch fresh data
  const [albumsData, photosData] = await Promise.all([
    readAlbums(),
    readPhotos()
  ]);
  
  if (!albumsData || !photosData) {
    throw new Error('Failed to load required data files');
  }
  
  // Process albums data
  const albumsWithStats = albumsData.albums.map((album) => {
    const albumPhotos = photosData.photos.filter((photo) => photo.albumId === album.id);
    return {
      ...album,
      photoCount: albumPhotos.length,
    };
  });
  
  // Update cache
  albumsCache = albumsWithStats;
  albumsCacheTimestamp = now;
  
  return albumsCache;
}

export async function GET() {
  try {
    const albums = await getCachedAlbumsData();
    
    return new Response(JSON.stringify(albums), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}