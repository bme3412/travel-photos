// src/app/page.js

import PhotoAlbumExplorer from './components/PhotoAlbumExplorer';
import { readAlbums, readPhotos, readLocations } from './utils/fileHandler';
import { buildAlbumSummaries } from './utils/albumSummaries';

export const metadata = {
  title: 'Photo Albums',
  description: 'Browse photo albums from different locations',
};

// Enable ISR - revalidate every hour (3600 seconds)
export const revalidate = 3600;

// Server-side data fetching
async function getAlbumsData() {
  try {
    const [albumsData, photosData, locationsData] = await Promise.all([
      readAlbums(),
      readPhotos(),
      readLocations()
    ]);
    
    if (!albumsData || !photosData) {
      throw new Error('Failed to load required data files');
    }
    
    // Trim to summaries on the server — cover photo + count only, never the full photo list
    return { albums: buildAlbumSummaries(albumsData, photosData, locationsData || []) };
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
