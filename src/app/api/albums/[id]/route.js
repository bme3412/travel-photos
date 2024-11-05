// src/app/api/albums/[id]/route.js

import { readAlbums, readPhotos, readLocations } from '../../../utils/fileHandler';

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

    // Read data from all necessary JSON files
    const albumsData = await readAlbums();
    const photosData = await readPhotos();
    const locationsData = await readLocations();

    // Validate data fetching
    if (!albumsData) {
      return new Response(JSON.stringify({ error: 'No albums data found.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!photosData) {
      return new Response(JSON.stringify({ error: 'No photos data found.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!locationsData) {
      return new Response(JSON.stringify({ error: 'No locations data found.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching album:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
