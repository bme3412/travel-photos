'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ImageLightbox from '../../components/ImageLightbox';

// The visual half of a journal chapter: a large lead photograph, a small
// curated grid, and a link out to the full album — with the existing
// lightbox wired over the stop's entire photo set.
export default function PostGallery({ photos, albumId, place, gridCount = 6 }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!photos?.length) return null;

  const [lead, ...rest] = photos;
  const grid = rest.slice(0, gridCount);
  const remaining = photos.length - (1 + grid.length);

  return (
    <div className="mt-8 sm:mt-10">
      {/* Lead photograph — breaks wider than the text column */}
      <figure
        onClick={() => setLightboxIndex(0)}
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-ink/5 cursor-zoom-in"
      >
        <Image
          src={lead.url}
          alt={lead.caption || place}
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
        {lead.caption && lead.caption !== place && (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-3 pt-10 text-[11px] text-paper/90">
            {lead.caption}
          </figcaption>
        )}
      </figure>

      {grid.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {grid.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIndex(i + 1)}
              aria-label={photo.caption || `Photograph ${i + 2} from ${place}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-ink/5"
            >
              <Image
                src={photo.url}
                alt={photo.caption || place}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="mt-5 text-center">
          <Link
            href={`/albums/${albumId}`}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink/60
                       hover:text-accent transition-colors duration-200"
          >
            See all {photos.length} photographs from {place}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
          onPrevious={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
        />
      )}
    </div>
  );
}
