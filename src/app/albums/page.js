// src/app/albums/[id]/page.js
'use client';
import { useState } from 'react';
import Image from 'next/image';
import ImageLightbox from '../components/ImageLightbox'

export default function AlbumPage({ params }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [album, setAlbum] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      const response = await fetch(`/api/albums/${params.id}`);
      const data = await response.json();
      setAlbum(data);
    };
    fetchAlbum();
  }, [params.id]);

  if (!album) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">{album.name}</h1>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {album.photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="relative h-64 cursor-pointer"
            onClick={() => setSelectedImageIndex(index)}
          >
            <Image
              src={photo.url}
              alt={photo.caption}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <ImageLightbox
          images={album.photos}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onNext={() => 
            setSelectedImageIndex((prev) => 
              prev === album.photos.length - 1 ? 0 : prev + 1
            )
          }
          onPrevious={() => 
            setSelectedImageIndex((prev) => 
              prev === 0 ? album.photos.length - 1 : prev - 1
            )
          }
        />
      )}
    </div>
  );
}