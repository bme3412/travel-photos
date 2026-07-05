import { NextResponse } from 'next/server';
import photosData from '@/data/photos.json';
import albumsData from '@/data/albums.json';
import locationsData from '@/data/locations.json';
import { enrichPhotoForDisplay } from '../../utils/photoEnrichment';

// Get consistent daily photo index based on date
function getDailyPhotoIndex(photos) {
  const today = new Date();
  // Create a seed from the date (YYYYMMDD format)
  const seed = today.getFullYear() * 10000 + 
               (today.getMonth() + 1) * 100 + 
               today.getDate();
  // Use seed to get consistent index for the day
  return seed % photos.length;
}

export async function GET(request) {
  try {
    const photos = photosData.photos;
    
    if (!Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: 'No photos available' }, { status: 404 });
    }

    // Check if user wants truly random photo (via query param)
    const { searchParams } = new URL(request.url);
    const isRandom = searchParams.get('random') === 'true';
    
    let photoIndex;
    let cacheControl;
    
    if (isRandom) {
      // Truly random photo each time
      photoIndex = Math.floor(Math.random() * photos.length);
      cacheControl = 'no-cache, no-store, must-revalidate';
    } else {
      // Daily photo (same for everyone on this day)
      photoIndex = getDailyPhotoIndex(photos);
      cacheControl = 'public, max-age=3600, stale-while-revalidate=86400';
    }
    
    const selectedPhoto = photos[photoIndex];

    // Same enriched shape the /photo-of-the-day page passes as initialPhoto —
    // the client's formatCaption reads these fields directly
    const photoData = {
      ...enrichPhotoForDisplay(selectedPhoto, albumsData.albums, locationsData),
      location: selectedPhoto.locationId,
      description: selectedPhoto.caption
    };

    return NextResponse.json(photoData, {
      headers: {
        'Cache-Control': cacheControl
      }
    });
  } catch (error) {
    console.error('Error getting photo:', error);
    return NextResponse.json({ error: 'Failed to get photo' }, { status: 500 });
  }
}