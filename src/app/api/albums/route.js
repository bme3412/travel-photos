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
  
  // Process albums data - merge photos with albums
  const albumsWithPhotos = albumsData.albums.map((album) => {
    const albumPhotos = photosData.photos.filter(
      (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
    );
    return {
      ...album,
      photos: albumPhotos,
      photoCount: albumPhotos.length,
    };
  });
  
  // Update cache
  albumsCache = albumsWithPhotos;
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
        // Cache for 1 hour, serve stale while revalidating for 1 day
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
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