'use client';

// "View original moment" — a slide-over that grounds a copied itinerary item
// in the source trip: the original day, the traveler's narrative note, the
// photos taken there, the timing, and where the moment sits on that day's
// captured route. It deliberately keeps the user on the result page; the
// replay link at the bottom is an invitation, not a redirect.

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Camera, Clock, MapPin, Ticket, X } from 'lucide-react';
import RoutePreview from '@/features/copy-trip/RoutePreview';
import { formatDateRange, fmtTime12 } from '@/features/copy-trip/format.mjs';

export default function ProvenanceDrawer({ tripId, experience, day, photoUrlById, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!experience || !day) return null;

  const photos = (experience.sourcePhotoIds ?? [])
    .map((pid) => (photoUrlById[pid] ? { id: pid, url: photoUrlById[pid] } : null))
    .filter(Boolean);

  const meta = [
    experience.approximateStartTime
      ? { icon: Clock, text: `Around ${fmtTime12(experience.approximateStartTime)}${
          experience.approximateDurationMinutes ? ` · ${experience.approximateDurationMinutes} min` : ''
        }` }
      : null,
    experience.placeName || experience.neighborhood
      ? {
          icon: MapPin,
          text: [experience.placeName, experience.neighborhood].filter(Boolean).join(' · '),
        }
      : null,
    experience.bookingRequired ? { icon: Ticket, text: 'Was a booked activity' } : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-label="Original moment">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-paper shadow-2xl
                   outline-none sm:rounded-l-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10
                        bg-paper/95 px-6 py-5 backdrop-blur-sm">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent">
              Original moment · Day {day.dayNumber}
              {day.date ? ` · ${formatDateRange(day.date)}` : ''}
            </p>
            <h2 className="mt-1.5 font-display text-2xl tracking-tight leading-tight">
              {experience.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                       text-ink/50 ring-1 ring-ink/15 transition-colors hover:text-ink hover:ring-ink/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          {experience.sourceNarrativeExcerpt && (
            <blockquote className="font-display text-lg italic leading-relaxed text-ink/80">
              &ldquo;{experience.sourceNarrativeExcerpt}&rdquo;
            </blockquote>
          )}

          {meta.length > 0 && (
            <ul className={`space-y-2 text-[14px] text-ink/70 ${experience.sourceNarrativeExcerpt ? 'mt-5' : ''}`}>
              {meta.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-accent/80" />
                  {text}
                </li>
              ))}
            </ul>
          )}

          {photos.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted">
                <Camera className="h-3.5 w-3.5" />
                {photos.length === 1 ? 'One frame from this moment' : `${photos.length} frames from this moment`}
              </p>
              <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/5">
                    <Image
                      src={photo.url}
                      alt={experience.name}
                      fill
                      sizes="(min-width: 640px) 210px, 45vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              From the original {day.title ? `“${day.title}”` : `day ${day.dayNumber}`}
            </p>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink/70">{day.summary}</p>
            <p className="mt-2.5 text-xs text-muted">
              {[
                day.distanceKm != null ? `${day.distanceKm} km captured` : null,
                day.weather ? `${day.weather.highF}°F` : null,
                day.neighborhoods?.join(' · '),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {(day.route?.length ?? 0) > 1 && (
            <div className="mt-6">
              <RoutePreview
                days={[day]}
                highlight={
                  experience.latitude != null
                    ? { lat: experience.latitude, lng: experience.longitude }
                    : null
                }
              />
            </div>
          )}

          <Link
            href={`/trips/${tripId}`}
            className="group mt-7 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]
                       text-ink/60 hover:text-accent transition-colors"
          >
            Replay the original trip
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
