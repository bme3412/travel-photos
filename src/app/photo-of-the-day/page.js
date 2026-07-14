import PhotoOfTheDay from '../components/PhotoOfTheDay';
import { readPhotos, readAlbums, readLocations } from '../utils/fileHandler';
import { enrichPhotoForDisplay } from '../utils/photoEnrichment';

export const metadata = {
  title: 'Photo of the Day | Copy My Trip',
  description: 'A new photograph from the archive every day',
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
      return null;
    }

    // Get a random photo on each page load, with display fields resolved
    // server-side so the client never receives the albums/locations arrays
    const randomIndex = Math.floor(Math.random() * photosData.photos.length);
    const photo = photosData.photos[randomIndex];

    return enrichPhotoForDisplay(photo, albumsData?.albums || [], locationsData || []);
  } catch (error) {
    console.error('Error getting random photo:', error);
    return null;
  }
}

export default async function PhotoOfTheDayPage() {
  // Fetch a random photo on each page load
  const photo = await getRandomPhoto();

  return <PhotoOfTheDay initialPhoto={photo} />;
}