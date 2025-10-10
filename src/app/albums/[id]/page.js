import { readAlbums, readPhotos } from '../../utils/fileHandler';
import AlbumPageClient from './AlbumPageClient';

// Transform S3 URLs to CloudFront URLs
const transformToCloudFront = (url) => {
  if (!url) return '';
  const path = url
    .replace('https://global-travel.s3.us-east-1.amazonaws.com/', '')
    .replace('https://d1mnon53ja4k10.cloudfront.net/', '')
    .replace(/\.HEIC$/i, '.jpg');
  return `https://d1mnon53ja4k10.cloudfront.net/${path}`;
};

// Generate dynamic metadata for each album
export async function generateMetadata({ params }) {
  // Await params in Next.js 15
  const { id } = await params;
  
  try {
    const [albumsData, photosData] = await Promise.all([
      readAlbums(),
      readPhotos()
    ]);

    if (!albumsData || !photosData) {
      return {
        title: 'Album | 🛫 Passport & Ponder 🌎',
        description: 'Travel photo album',
      };
    }

    const album = albumsData.albums.find(
      (a) => a.id.toLowerCase() === id.toLowerCase()
    );

    if (!album) {
      return {
        title: 'Album Not Found | 🛫 Passport & Ponder 🌎',
        description: 'This album could not be found',
      };
    }

    const albumPhotos = photosData.photos.filter(
      (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
    );

    const coverPhoto = albumPhotos[0];
    const coverPhotoUrl = coverPhoto ? transformToCloudFront(coverPhoto.url) : null;

    return {
      title: `${album.name} | 🛫 Passport & Ponder 🌎`,
      description: `View ${albumPhotos.length} photos from ${album.name} (${album.year})`,
      openGraph: {
        title: `${album.name}`,
        description: `${albumPhotos.length} photos from ${album.year}`,
        images: coverPhotoUrl ? [
          {
            url: coverPhotoUrl,
            width: 1200,
            height: 630,
            alt: album.name,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${album.name}`,
        description: `${albumPhotos.length} photos from ${album.year}`,
        images: coverPhotoUrl ? [coverPhotoUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Album | 🛫 Passport & Ponder 🌎',
      description: 'Travel photo album',
    };
  }
}

// Generate static params for all albums
export async function generateStaticParams() {
  try {
    const albumsData = await readAlbums();
    
    if (!albumsData || !albumsData.albums) {
      return [];
    }

    return albumsData.albums.map((album) => ({
      id: album.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Server-side data fetching for album
async function getAlbumData(id) {
  try {
    const [albumsData, photosData] = await Promise.all([
      readAlbums(),
      readPhotos()
    ]);

    if (!albumsData || !photosData) {
      return null;
    }

    // Find the album
    const album = albumsData.albums.find(
      (a) => a.id.toLowerCase() === id.toLowerCase()
    );

    if (!album) {
      return null;
    }

    // Get photos for this album
    const albumPhotos = photosData.photos
      .filter((photo) => photo.albumId.toLowerCase() === album.id.toLowerCase())
      .map(photo => ({
        ...photo,
        originalUrl: photo.url,
        url: transformToCloudFront(photo.url)
      }));

    return {
      ...album,
      photos: albumPhotos,
      photoCount: albumPhotos.length
    };
  } catch (error) {
    console.error('Error fetching album data:', error);
    return null;
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export default async function AlbumPage({ params }) {
  // Await params in Next.js 15
  const { id } = await params;
  
  // Fetch album data at build time (SSG) and revalidate hourly (ISR)
  const album = await getAlbumData(id);

  return <AlbumPageClient initialAlbum={album} />;
}
