// src/app/page.js

import PhotoAlbumExplorer from './components/PhotoAlbumExplorer';
import { readAlbums, readPhotos, readLocations, readNarratives } from './utils/fileHandler';
import { buildAlbumSummaries } from './utils/albumSummaries';
import { getJournalIndex } from './utils/journalContent';

export const metadata = {
  title: 'Passport & Ponder — Copy a real trip',
  description:
    'A photographic travel journal across 57 countries. Replay real routes day by day on the map, then copy a trip and turn it into your own personalized itinerary.',
};

// Enable ISR - revalidate every hour (3600 seconds)
export const revalidate = 3600;

// Server-side data fetching
async function getAlbumsData() {
  try {
    const [albumsData, photosData, locationsData, narrativesData] = await Promise.all([
      readAlbums(),
      readPhotos(),
      readLocations(),
      readNarratives(),
    ]);

    if (!albumsData || !photosData) {
      throw new Error('Failed to load required data files');
    }

    // Trim to summaries on the server — cover photo + count only, never the full photo list
    return {
      albums: buildAlbumSummaries(
        albumsData,
        photosData,
        locationsData || [],
        narrativesData,
        getJournalIndex()
      ),
    };
  } catch (error) {
    console.error('Error fetching albums data:', error);
    return { albums: [] };
  }
}

export default async function AlbumsPage() {
  // Fetch data at build time (SSG) and revalidate every hour (ISR)
  const { albums } = await getAlbumsData();

  return <PhotoAlbumExplorer initialAlbums={albums} />;
}
