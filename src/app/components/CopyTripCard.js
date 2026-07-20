'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { copyFlowHref } from '@/features/copy-trip/routes';
import { getCitySlug } from '@/features/destinations/data';

const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

// The whole card opens the destination page — "show me Paris" — where the
// visitor chooses Replay or Copy. The one explicit action here is the copy
// button, a shortcut straight into the flow.
export default function CopyTripCard({ trip, index }) {
  const router = useRouter();
  const { flag, title } = splitFlag(trip.name);
  const depthLabel = trip.copyOptionCount
    ? `${trip.copyOptionCount} guide additions`
    : 'Original route only';

  // The card is a Link, so this must be a button (nested anchors are invalid)
  // that intercepts the click — same idiom as AlbumGridCard.
  const openCopy = (event) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(copyFlowHref(trip.id, 'select'));
  };

  return (
    <Link
      href={`/destinations/${getCitySlug(trip.id)}`}
      className="group relative block min-h-[380px] overflow-hidden bg-ink text-paper"
    >
      {trip.coverPhoto?.url && (
        <Image
          src={trip.coverPhoto.url}
          alt={trip.coverPhoto.caption || `${title} trip`}
          fill
          priority={index < 2}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Where the card itself leads — legible before clicking, always shown on touch */}
      <span
        aria-hidden="true"
        className="absolute bottom-5 right-5 z-10 inline-flex items-center gap-1.5 rounded-full
                   bg-paper/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-ink
                   opacity-0 translate-y-1 transition-all duration-300
                   group-hover:opacity-100 group-hover:translate-y-0
                   max-sm:opacity-100 max-sm:translate-y-0"
      >
        Explore {title}
        <ArrowRight className="h-3 w-3" />
      </span>

      <div className="relative flex min-h-[380px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.24em] text-paper/70">
            № {String(index + 1).padStart(2, '0')}
          </span>
          <span className="bg-paper/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-ink">
            {depthLabel}
          </span>
        </div>

        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-paper/65">
            {trip.experienceCount} real moments
            {trip.neighborhoodCount > 0 &&
              ` · ${trip.neighborhoodCount} ${trip.neighborhoodCount === 1 ? 'quarter' : 'quarters'}`}
            {trip.visitedLabel && ` · ${trip.visitedLabel}`}
          </p>
          <h2 className="font-display text-3xl leading-none tracking-tight">
            {flag && <span className="mr-2 text-2xl">{flag}</span>}
            {title}
          </h2>
          {trip.occasion && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-paper/75">
              {trip.occasion}
            </p>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={openCopy}
              className="inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-[10px] uppercase
                         tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Copy this trip
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
