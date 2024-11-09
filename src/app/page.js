// src/app/page.js

import PhotoAlbumExplorer from './components/PhotoAlbumExplorer'; // Corrected path

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'Photo Albums',
  description: 'Browse photo albums from different locations',
};

export default function AlbumsPage() {
  return <PhotoAlbumExplorer />;
}
