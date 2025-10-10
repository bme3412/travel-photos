import PhotoOfTheDay from '../components/PhotoOfTheDay';
import { readPhotos, readAlbums, readLocations } from '../utils/fileHandler';

export const metadata = {
  title: '📸 Photo of the Day | 🛫 Passport & Ponder 🌎',
  description: '✨ Discover a new stunning travel photo every day from our collection',
};

// Disable static generation - we want a random photo on each visit
export const dynamic = 'force-dynamic';

// Server-side data fetching - get a random photo
async function getRandomPhoto() {
  try {
    const [photosData, albumsData, locationsData] = await Promise.all([
      readPhotos(),
      readAlbums(),
      readLocations()
    ]);
    
    if (!photosData || !Array.isArray(photosData.photos) || photosData.photos.length === 0) {
      return { photo: null, albums: [], locations: [] };
    }

    // Get a random photo on each page load
    const randomIndex = Math.floor(Math.random() * photosData.photos.length);
    const photo = photosData.photos[randomIndex];
    
    return {
      photo,
      albums: albumsData?.albums || [],
      locations: locationsData || []
    };
  } catch (error) {
    console.error('Error getting random photo:', error);
    return { photo: null, albums: [], locations: [] };
  }
}

export default async function PhotoOfTheDayPage() {
  // Fetch a random photo on each page load
  const { photo, albums, locations } = await getRandomPhoto();
  
  return <PhotoOfTheDay initialPhoto={photo} albums={albums} locations={locations} />;
}