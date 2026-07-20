import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { readPhotos } from '../../../utils/fileHandler';
import { transformToCloudFront } from '../../../utils/imageUtils';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';
import RoutePreview from '@/features/copy-trip/RoutePreview';
import { formatDateRange, titleCase } from '@/features/copy-trip/format.mjs';

// Screen 1 of the copy flow: the source-trip overview. Everything here is
// static blueprint data, so it stays a server component; the session itself
// starts on the selection screen.

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) return { title: 'Trip Not Found | Copy This Trip' };
  return {
    title: `Make it yours: ${blueprint.destination} | Copy This Trip`,
    description: `Start with the real ${blueprint.destination} trip, then adapt it to your dates, pace, and interests.`,
  };
}

export default async function CopyTripOverviewPage({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) notFound();

  const photosData = await readPhotos();
  const albumPhotos = (photosData?.photos || []).filter((p) => p.albumId === id);
  const photoById = new Map(albumPhotos.map((p) => [p.id, p]));

  // One representative photo per day: the middle frame of the day's captures.
  const dayImages = blueprint.days
    .map((day) => {
      const ids = (day.route || []).map((pt) => pt.photoId).filter(Boolean);
      const photo = photoById.get(ids[Math.floor(ids.length / 2)]);
      return photo
        ? { dayNumber: day.dayNumber, title: day.title, url: transformToCloudFront(photo.url) }
        : null;
    })
    .filter(Boolean);

  const facts = [
    { label: 'Dates', value: formatDateRange(blueprint.startDate, blueprint.endDate) },
    { label: 'Length', value: `${blueprint.durationDays} days` },
    { label: 'Party', value: blueprint.travelerType ? titleCase(blueprint.travelerType) : null },
    { label: 'Photos', value: `${albumPhotos.length} photographs` },
    {
      label: 'Distance',
      value: blueprint.totalDistanceKm != null ? `≈ ${blueprint.totalDistanceKm} km captured` : null,
    },
    { label: 'Base', value: blueprint.baseNeighborhood },
    { label: 'Occasion', value: blueprint.occasion },
  ].filter((f) => f.value);

  const chips = [
    `${titleCase(blueprint.pace)}-paced`,
    ...blueprint.themes.map(titleCase),
  ];

  const experienceCount = blueprint.days.reduce((n, d) => n + d.experiences.length, 0);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-20 sm:pb-28">
        <div className="flex items-center justify-between">
          <Link
            href={`/trips/${id}`}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                       hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to the replay
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {blueprint.destination}
          </span>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-12 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-16">
          {/* Left: the pitch and the source-trip summary */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-4">
              Copy this trip
            </p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tight leading-[1.02]">
              Make it yours
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-[1.7] text-ink/75">
              Start with the real {blueprint.destination.split(',')[0]} trip — its actual places,
              route, and pace — then adapt it to your dates, party, and interests.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 max-w-lg">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{f.label}</dt>
                  <dd className="mt-1 text-[15px] text-ink/90">{f.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-3">
                The trip&rsquo;s character
              </p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-ink/5 px-3.5 py-1.5 text-[13px] text-ink/80 ring-1 ring-ink/10"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-5">
              <Link
                href={`/trips/${id}/copy/select`}
                className="inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5
                           text-[11px] uppercase tracking-[0.2em] text-paper shadow-sm
                           transition-colors duration-300 hover:bg-ink"
              >
                Choose what to keep
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-[13px] text-muted">
                {blueprint.durationDays} days · {experienceCount} experiences to pick from
              </span>
            </div>
          </div>

          {/* Right: source context — the captured route and a frame per day */}
          <div className="space-y-6">
            <RoutePreview days={blueprint.days} />
            <div className="grid grid-cols-3 gap-3">
              {dayImages.map((img) => (
                <figure key={img.dayNumber}>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink/5">
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      sizes="(min-width: 1024px) 140px, 30vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                    Day {img.dayNumber}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
