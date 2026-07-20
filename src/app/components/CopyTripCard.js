import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCitySlug } from '@/features/destinations/data';

const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

// One card, one door: the whole card opens the destination page, where the
// visitor chooses Replay or Copy. No competing in-card actions.
export default function CopyTripCard({ trip, index }) {
  const { flag, title } = splitFlag(trip.name);
  const depthLabel = trip.copyOptionCount
    ? `${trip.copyOptionCount} guide additions`
    : 'Original route only';

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
            <span
              className="inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-[10px] uppercase
                         tracking-[0.2em] text-paper transition-colors group-hover:bg-paper group-hover:text-ink"
            >
              Explore {title}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
