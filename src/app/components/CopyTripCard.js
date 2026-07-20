import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCitySlug } from '@/features/destinations/data';

const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

// One card, one door: the whole card opens the destination page, where the
// visitor chooses Replay or Copy. The photograph prints clean — no overlay
// text means no darkening gradient — and the editorial lives in a caption
// block below, the same idiom as the album cards.
export default function CopyTripCard({ trip, index }) {
  const { flag, title } = splitFlag(trip.name);
  const depthLabel = trip.copyOptionCount
    ? `${trip.copyOptionCount} guide additions`
    : 'Original route only';

  const meta = [
    `№ ${String(index + 1).padStart(2, '0')}`,
    `${trip.experienceCount} real moments`,
    trip.neighborhoodCount > 0 &&
      `${trip.neighborhoodCount} ${trip.neighborhoodCount === 1 ? 'quarter' : 'quarters'}`,
    trip.visitedLabel,
  ].filter(Boolean);

  return (
    <Link href={`/destinations/${getCitySlug(trip.id)}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
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
        <span
          className="absolute top-3 right-3 bg-paper/90 px-2.5 py-1 text-[9px] uppercase
                     tracking-[0.18em] text-ink"
        >
          {depthLabel}
        </span>
      </div>

      <div className="mt-4 border-t border-ink/15 pt-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{meta.join(' · ')}</p>
        <h2
          className="mt-2 font-display text-2xl sm:text-3xl tracking-tight
                     group-hover:text-accent transition-colors duration-300"
        >
          {flag && <span className="mr-2 text-xl align-middle">{flag}</span>}
          {title}
        </h2>
        {trip.occasion && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/70">
            {trip.occasion}
          </p>
        )}
        <span
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase
                     tracking-[0.2em] text-accent"
        >
          Explore {title}
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
