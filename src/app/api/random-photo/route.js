import { NextResponse } from 'next/server';
import photosData from '@/data/photos.json';  // Import the entire JSON file

export async function GET() {
  try {
    const photos = photosData.photos;  // Access the photos array
    
    if (!Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: 'No photos available' }, { status: 404 });
    }

    const randomIndex = Math.floor(Math.random() * photos.length);
    const randomPhoto = photos[randomIndex];
    
    // Format the photo data based on the actual structure
    const photoData = {
      ...randomPhoto,
      location: randomPhoto.locationId,
      description: randomPhoto.caption,
      // Use the provided URL directly
      url: randomPhoto.url
    };

    return NextResponse.json(photoData);
  } catch (error) {
    console.error('Error getting random photo:', error);
    return NextResponse.json({ error: 'Failed to get random photo' }, { status: 500 });
  }
}