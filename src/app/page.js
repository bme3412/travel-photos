import PhotoAlbumExplorer from './components/PhotoAlbumExplorer';

export default function Home() {
  return (
    <main className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <PhotoAlbumExplorer />
    </main>
  );
}

const DebugPhotoUrls = ({ albums }) => {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-white rounded shadow-lg max-w-md max-h-64 overflow-auto" style={{ zIndex: 1000 }}>
        <h3 className="font-bold mb-2">Debug Photo URLs:</h3>
        {albums.map(album => (
          <div key={album.id} className="mb-2">
            <p className="font-semibold">{album.name}:</p>
            {album.photos?.map(photo => (
              <p key={photo.id} className="text-sm text-gray-600">{photo.url}</p>
            ))}
          </div>
        ))}
      </div>
    );
  };