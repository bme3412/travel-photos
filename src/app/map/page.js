import { readPhotos, readLocations } from '../utils/fileHandler';
import fs from 'fs/promises';
import path from 'path';
import MapPageClient from './MapPageClient';

// Read destinations separately since it's not in fileHandler
async function readDestinations() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'destinations.json');
    const rawData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading destinations.json:', error);
    return null;
  }
}

// Server-side data fetching for map
async function getMapData() {
  try {
    const [destinationsData, photosData, locationsData] = await Promise.all([
      readDestinations(),
      readPhotos(),
      readLocations()
    ]);

    if (!destinationsData || !photosData) {
      return { destinations: [], photos: [], locations: [] };
    }

    return {
      destinations: destinationsData,
      photos: photosData,
      locations: locationsData || []
    };
  } catch (error) {
    console.error('Error fetching map data:', error);
    return { destinations: [], photos: [], locations: [] };
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export const metadata = {
  title: 'Travel Map | 🛫 Passport & Ponder 🌎',
  description: '🗺️ Explore the places I\'ve visited around the world',
};

export default async function MapPage() {
  // Fetch data at build time (SSG) and revalidate hourly (ISR)
  const { destinations, photos, locations } = await getMapData();

  return <MapPageClient initialDestinations={destinations} initialPhotos={photos} locations={locations} />;
}
