// src/app/page.js

import PhotoAlbumExplorer from './components/PhotoAlbumExplorer';
import { readAlbums, readPhotos, readLocations } from './utils/fileHandler';

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
    
    // Merge photos with albums on the server
    const albumsWithPhotos = albumsData.albums.map((album) => {
      const albumPhotos = photosData.photos.filter(
        (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
      );
      return {
        ...album,
        photos: albumPhotos,
        photoCount: albumPhotos.length,
      };
    });
    
    return { albums: albumsWithPhotos, locations: locationsData || [] };
  } catch (error) {
    console.error('Error fetching albums data:', error);
    return { albums: [], locations: [] };
  }
}

export default async function AlbumsPage() {
  // Fetch data at build time (SSG) and revalidate every hour (ISR)
  const { albums, locations } = await getAlbumsData();
  
  return <PhotoAlbumExplorer initialAlbums={albums} locations={locations} />;
}
