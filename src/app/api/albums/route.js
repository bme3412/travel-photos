// src/app/api/albums/route.js

import { readAlbums, readPhotos, readLocations } from '../../utils/fileHandler';
import { buildAlbumSummaries } from '../../utils/albumSummaries';

export async function GET() {
  try {
    const [albumsData, photosData, locationsData] = await Promise.all([
      readAlbums(),
      readPhotos(),
      readLocations()
    ]);

    if (!albumsData || !photosData) {
      throw new Error('Failed to load required data files');
    }

    // Same trimmed shape the homepage passes as initialAlbums — this route is
    // the client-side fallback in PhotoAlbumExplorer and must stay in sync.
    const albums = buildAlbumSummaries(albumsData, photosData, locationsData || []);

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
