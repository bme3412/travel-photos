import { readPhotos, readLocations } from '../utils/fileHandler';
import fs from 'fs/promises';
import path from 'path';
import MapPageClient from './MapPageClient';
import { buildDestinationData } from '../utils/destinationData';

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
      return { destinations: [], visitedCountries: {} };
    }

    // Join photos to destinations here so the client never receives photos.json
    return buildDestinationData(destinationsData, photosData, locationsData || []);
  } catch (error) {
    console.error('Error fetching map data:', error);
    return { destinations: [], visitedCountries: {} };
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export const metadata = {
  title: 'Travel Map | Copy My Trip',
  description: 'Every country and stop from the journal, mapped',
};

export default async function MapPage() {
  // Fetch data at build time (SSG) and revalidate hourly (ISR)
  const { destinations, visitedCountries } = await getMapData();

  return <MapPageClient initialDestinations={destinations} visitedCountries={visitedCountries} />;
}
