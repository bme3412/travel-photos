// One neighborhood, aggregated across every trip: the owner's essay and
// personal history from the registry, photos assigned by GPS, and the
// blueprint experiences that happened here — each group linking back to its
// trip replay. Sparse entries render honestly: fewer photos, shorter lists,
// same page.

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import { readPhotos } from '../../utils/fileHandler';
import { transformToCloudFront } from '../../utils/imageUtils';
import { getNeighborhood, getNeighborhoodIds } from '@/features/neighborhoods/data';
import { titleCase } from '@/features/copy-trip/format.mjs';

export const revalidate = 3600;

export function generateStaticParams() {
  return getNeighborhoodIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const hood = getNeighborhood(id);
  if (!hood) return { title: 'Neighborhood Not Found | Copy This Trip' };
  return {
    title: `${hood.name} | Copy This Trip`,
    description: hood.summary,
  };
}

// Prefer the blueprint's spelling ("Kraków, Poland" -> "Kraków"); the
// capitalized slug is only a fallback for entries with no resolved trips.
const cityName = (hood) =>
  hood.trips?.[0]?.destination.split(',')[0] ??
  hood.city.charAt(0).toUpperCase() + hood.city.slice(1);

export default async function NeighborhoodPage({ params }) {
  const { id } = await params;
  const photosData = await readPhotos();
  const hood = getNeighborhood(id, photosData?.photos ?? []);
  if (!hood) notFound();

  const facts = [
    hood.firstVisitedYear && { label: 'First visited', value: String(hood.firstVisitedYear) },
    hood.visitYears.length > 0 && { label: 'Photographed', value: hood.visitYears.join(' · ') },
    {
      label: 'Captured here',
      value: `${hood.photos.length} ${hood.photos.length === 1 ? 'photograph' : 'photographs'} · ${
        hood.experienceRefs.length
      } ${hood.experienceRefs.length === 1 ? 'experience' : 'experiences'}`,
    },
  ].filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 pb-24">
      <Link
        href="/neighborhoods"
        className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                   hover:text-ink transition-colors duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
        All neighborhoods
      </Link>

      <header className="mt-12 sm:mt-14">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-4">
          <Link href={`/destinations/${hood.city}`} className="hover:text-ink transition-colors">
            {cityName(hood)}
          </Link>{' '}
          · {hood.districts.join(' · ')}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
          {hood.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-[1.7] text-ink/75">{hood.summary}</p>
      </header>

      <dl className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{f.label}</dt>
            <dd className="mt-1 text-[15px] text-ink/90">{f.value}</dd>
          </div>
        ))}
      </dl>

      {hood.essay && (
        <section className="mt-14 max-w-2xl">
          <p className="text-[17px] leading-[1.8] text-ink/85 whitespace-pre-line">{hood.essay}</p>
        </section>
      )}

      {hood.personalHistory && (
        <aside className="mt-10 max-w-2xl border-l-2 border-accent/60 pl-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Personal history</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{hood.personalHistory}</p>
        </aside>
      )}

      {hood.photos.length > 0 && (
        <section className="mt-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted border-b border-ink/10 pb-3">
            Photographed here
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {hood.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/10 ring-1 ring-ink/10"
              >
                <Image
                  src={transformToCloudFront(photo.url)}
                  alt={photo.caption || hood.name}
                  fill
                  sizes="(min-width:640px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {hood.trips.length > 0 && (
        <section className="mt-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted border-b border-ink/10 pb-3">
            From the trips
          </p>
          {hood.trips.map((trip) => (
            <div key={trip.tripId} className="mt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 className="font-display text-2xl tracking-tight">
                  {trip.destination}, {trip.year}
                  {trip.occasion && (
                    <span className="ml-3 text-[11px] uppercase tracking-[0.2em] text-muted font-sans">
                      {trip.occasion}
                    </span>
                  )}
                </h2>
                <Link
                  href={`/trips/${trip.tripId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2
                             text-[10px] uppercase tracking-[0.2em] text-paper
                             hover:bg-ink transition-colors duration-300"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Replay this trip
                </Link>
              </div>
              <ul className="mt-5 space-y-5">
                {trip.experiences.map(({ experience, day }) => (
                  <li key={experience.id} className="rounded-2xl bg-white/60 ring-1 ring-ink/10 p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-[16px] text-ink">{experience.name}</h3>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-accent">
                        {titleCase(experience.category)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.15em] text-muted">
                      Day {day.dayNumber} — {day.title}
                    </p>
                    {experience.sourceNarrativeExcerpt && (
                      <p className="mt-3 text-[14px] leading-relaxed text-ink/65 italic">
                        “{experience.sourceNarrativeExcerpt}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
