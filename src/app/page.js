import PhotoAlbumExplorer from './components/PhotoAlbumExplorer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="sr-only">Photo Album Explorer</h1>
        <PhotoAlbumExplorer />
      </div>
    </main>
  )
}