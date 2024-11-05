// src/app/api/albums/route.js

import { readAlbums } from '../../utils/fileHandler';

export async function GET(request) {
  try {
    // Read albums data
    const albumsData = await readAlbums();

    if (!albumsData) {
      return new Response(JSON.stringify({ error: 'No albums data found.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the albums array
    return new Response(JSON.stringify(albumsData.albums), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching albums:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
