'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MapGL, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Map as MapIcon,
  Route,
} from 'lucide-react';
import ImageLightbox from '../../components/ImageLightbox';
import TripViewSwitcher from '../../components/TripViewSwitcher';
import { tripHasBlueprint } from '@/features/copy-trip/availability';
import { getCitySlug } from '@/features/cities/data';
import { getTripNeighborhoods } from '@/features/neighborhoods/data';
import { AddToTripButton, AddToTripToast } from '@/features/copy-trip/AddToTrip';

const ACCENT = '#B4441C';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
// Site sticky header sits above the replay stage — keep chrome clear of it.
const STAGE_TOP = 'top-14 md:top-16';
const STAGE_HEIGHT = 'h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)]';
const STAGE_PULL = '-mt-[calc(100svh-3.5rem)] md:-mt-[calc(100svh-4rem)]';

// "🇫🇷 Menton" -> { flag: "🇫🇷", title: "Menton" }
const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const PILL =
  'pointer-events-auto inline-flex items-center gap-2 rounded-full bg-paper/90 px-4 py-2 ' +
  'text-[11px] uppercase tracking-[0.2em] text-ink backdrop-blur-sm ' +
  'border border-transparent hover:border-accent transition-colors duration-200';

const formatShortDay = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
};

// Non-interactive inset map. On day scenes it draws that day's actual GPS path
// (start → end) and fits to it; otherwise it frames the city.
function InsetMap({ center, route }) {
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const pts = route || [];
    if (!map || !loaded || pts.length === 0) return;
    const duration = reducedRef.current ? 0 : 900;
    if (pts.length === 1) {
      map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 13, duration });
      return;
    }
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const p of pts) {
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
    }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 22, maxZoom: 14, duration });
  }, [route, loaded]);

  if (!MAPBOX_TOKEN || !center) return null;

  const hasRoute = route && route.length > 1;
  const lineData = hasRoute
    ? { type: 'Feature', geometry: { type: 'LineString', coordinates: route.map((p) => [p.lng, p.lat]) } }
    : null;
  const start = route && route.length ? route[0] : null;
  const end = hasRoute ? route[route.length - 1] : null;

  return (
    <MapGL
      ref={mapRef}
      onLoad={() => setLoaded(true)}
      initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      attributionControl={false}
      interactive={false}
      dragRotate={false}
      dragPan={false}
      scrollZoom={false}
      doubleClickZoom={false}
      touchZoomRotate={false}
      maxPitch={0}
    >
      {lineData && (
        <Source id="day-route" type="geojson" data={lineData}>
          <Layer
            id="day-route-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': ACCENT, 'line-width': 2.5, 'line-opacity': 0.9 }}
          />
        </Source>
      )}
      {start && (
        <Marker longitude={start.lng} latitude={start.lat} anchor="center">
          <span className="block h-2 w-2 rounded-full bg-paper ring-2 ring-accent shadow" />
        </Marker>
      )}
      {end && (
        <Marker longitude={end.lng} latitude={end.lat} anchor="center">
          <span className="block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-paper shadow" />
        </Marker>
      )}
      {!route?.length && (
        <Marker longitude={center.lng} latitude={center.lat} anchor="center">
          <span className="block h-3 w-3 rounded-full bg-accent ring-4 ring-accent/30 shadow" />
        </Marker>
      )}
    </MapGL>
  );
}

function TripDetails({ facts }) {
  if (!facts) return null;
  const hasExtra = facts.stay || facts.gettingAround || facts.weather?.length;
  if (!hasExtra) return null;

  return (
    <details className="mt-5 group border-t border-ink/10 pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-ink">
        Trip details
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <dl className="mt-3 grid grid-cols-1 gap-3 text-[14px] text-ink/80">
        {facts.stay && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">Stayed</dt>
            <dd className="mt-0.5 leading-snug">
              {facts.stay}
              {facts.stayNote && (
                <span className="mt-0.5 block text-[13px] text-ink/55">{facts.stayNote}</span>
              )}
            </dd>
          </div>
        )}
        {facts.gettingAround && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">Getting around</dt>
            <dd className="mt-0.5 leading-snug">{facts.gettingAround}</dd>
          </div>
        )}
        {facts.weather?.length > 0 && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">Weather</dt>
            <dd className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 leading-snug">
              {facts.weather.map((w) => (
                <span key={w.day}>
                  <span className="text-ink/55">{w.day}</span> {w.hi}
                  <span className="text-ink/40">/{w.lo}</span>
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </details>
  );
}

function ReflectionsBlock({ reflections }) {
  return (
    <div className="mt-4">
      <ol className="space-y-3">
        {reflections.learned.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display text-2xl text-accent leading-none tabular-nums">{i + 1}</span>
            <span className="text-[15px] text-ink/80 leading-relaxed">{t}</span>
          </li>
        ))}
      </ol>
      {reflections.highlight && (
        <p className="mt-6 text-[15px] text-ink/80 leading-relaxed">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Highlight</span>
          {reflections.highlight}
        </p>
      )}
      {reflections.doDifferently && (
        <p className="mt-4 text-[15px] text-ink/80 leading-relaxed">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Next time</span>
          {reflections.doDifferently}
        </p>
      )}
      {reflections.verdict && (
        <p className="mt-4 text-[15px] text-ink/80 leading-relaxed">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Verdict</span>
          {reflections.verdict}
          {reflections.rating
            ? ` · ${'★'.repeat(reflections.rating)}${'☆'.repeat(Math.max(0, 5 - reflections.rating))}`
            : ''}
        </p>
      )}
      {reflections.seed && (
        <p className="mt-5 text-[11px] italic text-muted">
          Seed reflections drawn from your notes — rewrite in your own words.
        </p>
      )}
      {reflections.factsExtras}
    </div>
  );
}

// Conversion-first title card: explain the personalized outcome, then let the
// original replay serve as secondary proof.
function TitleCard({ scene, tripTitle, tripId, onStartDay, canCopy }) {
  const summary = scene.copySummary;
  const sourceLabel = summary?.durationDays <= 3 ? `${tripTitle} weekend` : `${tripTitle} trip`;
  const proof = [
    summary?.durationDays ? `${summary.durationDays} days` : null,
    summary?.experienceCount ? `${summary.experienceCount} real experiences` : null,
    summary?.photoCount ? `${summary.photoCount} source photographs` : null,
  ].filter(Boolean);

  return (
    <article
      className="pointer-events-auto relative max-w-md w-full sm:max-w-lg
                 rounded-2xl bg-paper/95 text-ink backdrop-blur-sm shadow-xl ring-1 ring-ink/5
                 p-6 sm:p-8"
    >
      <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">
        Copied from a real {tripTitle} trip
      </p>
      <h1 className="font-display text-3xl sm:text-4xl tracking-tight leading-[1.05]">
        Start with this {sourceLabel}. Make it yours.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
        Keep the moments you love, change the dates, pace, and budget, and get a
        day-by-day itinerary grounded in this journey.
      </p>

      {proof.length > 0 && (
        <ul className="mt-6 grid grid-cols-3 divide-x divide-ink/10 border-y border-ink/10 py-4">
          {proof.map((item) => (
            <li
              key={item}
              className="px-2 text-center text-[10px] uppercase tracking-[0.13em] leading-snug text-ink/60 first:pl-0 last:pr-0"
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7">
        {canCopy ? (
          <Link
            href={`/trips/${tripId}/copy/select`}
            className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-3.5
                       text-[11px] uppercase tracking-[0.2em] text-paper shadow-sm
                       transition-colors duration-300 hover:bg-ink"
          >
            Build my {tripTitle} trip
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onStartDay}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px]
                       uppercase tracking-[0.2em] text-paper transition-colors hover:bg-accent"
          >
            Watch the original trip
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        {canCopy && (
          <>
            <p className="mt-2.5 text-center text-[11px] text-ink/45">
              Choose what to keep · no account required
            </p>
            <button
              type="button"
              onClick={onStartDay}
              className="group mx-auto mt-5 flex items-center gap-2 border-b border-ink/20 pb-1
                         text-[10px] uppercase tracking-[0.18em] text-ink/55
                         transition-colors hover:border-accent hover:text-accent"
            >
              Watch the original trip
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function SceneCard({ scene, tripId }) {
  const dayPhotoHref =
    scene.kind === 'day' && scene.date
      ? `/albums/${tripId}?day=${scene.date}`
      : scene.kind === 'day'
        ? `/albums/${tripId}`
        : null;

  return (
    <article
      className="pointer-events-auto relative max-w-md w-full sm:max-w-lg
                 rounded-2xl bg-paper/95 text-ink backdrop-blur-sm shadow-xl ring-1 ring-ink/5
                 p-6 sm:p-7"
    >
      {scene.kicker && (
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2">{scene.kicker}</p>
      )}
      <h2 className="font-display text-2xl sm:text-3xl tracking-tight leading-tight">
        {scene.title}
      </h2>

      {(scene.timeWindow || scene.distanceKm != null) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-muted">
          {scene.timeWindow && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {scene.timeWindow}
            </span>
          )}
          {scene.distanceKm != null && (
            <span
              className="inline-flex items-center gap-1.5"
              title="Distance traced between photo points (includes any transit)"
            >
              <Route className="h-3 w-3" />~{scene.distanceKm} km
            </span>
          )}
        </p>
      )}

      {scene.placesTrail?.length > 1 && (
        <p className="mt-2 text-[12px] leading-snug text-ink/55">
          {scene.placesTrail.join('  ·  ')}
        </p>
      )}

      {scene.text && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{scene.text}</p>
      )}

      {scene.activities?.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
          {scene.activities.map((a, i) => {
            const action = scene.copyActions?.[i];
            return (
              <li key={i} className="flex gap-2.5 text-[14px] text-ink/80 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0 flex-1">{a}</span>
                {action && (
                  <AddToTripButton
                    tripId={tripId}
                    experienceId={action.experienceId}
                    experienceName={action.name}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {scene.moment && (
        <p className="mt-3 flex gap-2 text-[13px] italic leading-snug text-ink/60">
          <span aria-hidden className="not-italic text-accent">↳</span>
          {scene.moment}
        </p>
      )}

      {scene.reflections && (
        <>
          <ReflectionsBlock reflections={scene.reflections} />
          {scene.tripDetailsFacts && <TripDetails facts={scene.tripDetailsFacts} />}
        </>
      )}

      {dayPhotoHref && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4 text-[10px] uppercase tracking-[0.18em] text-ink/55">
          <Link
            href={dayPhotoHref}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
          >
            <Camera className="h-3 w-3" />
            Photos from this day
          </Link>
        </div>
      )}
    </article>
  );
}

function PhotoStrip({ scene, sceneIndex, tripId, onOpen }) {
  const photos = scene.photos || [];
  if (!photos.length) return null;
  const shown = photos.slice(0, 5);
  const rest = photos.length - shown.length;
  const albumHref = scene.date
    ? `/albums/${tripId}?day=${scene.date}`
    : `/albums/${tripId}`;
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2">
      {shown.map((photo, pi) => (
        <button
          key={photo.id}
          onClick={() => onOpen(sceneIndex, pi)}
          aria-label={photo.caption || `Photograph ${pi + 1}`}
          className={`group relative h-20 w-28 sm:h-24 sm:w-32 lg:h-28 lg:w-40 shrink-0
                     overflow-hidden rounded-lg ring-1 ring-paper/25 shadow-lg bg-ink/40
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                     ${pi >= 3 ? 'hidden sm:block' : ''}`}
        >
          <Image
            src={photo.url}
            alt={photo.caption || scene.title}
            fill
            sizes="160px"
            quality={65}
            loading={sceneIndex === 0 ? 'eager' : 'lazy'}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>
      ))}
      {rest > 0 && (
        <button
          onClick={() => onOpen(sceneIndex, shown.length)}
          aria-label={`View all ${photos.length} photographs from this day`}
          className="grid h-20 sm:h-24 lg:h-28 w-20 shrink-0 place-items-center rounded-lg
                     bg-ink/55 ring-1 ring-paper/25 backdrop-blur-sm text-paper/90
                     text-[11px] uppercase tracking-[0.15em] leading-tight
                     transition-colors hover:bg-accent focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-accent"
        >
          All {photos.length}
        </button>
      )}
      <Link
        href={albumHref}
        className="ml-1 text-[10px] uppercase tracking-[0.18em] text-paper/70 underline-offset-4
                   hover:text-paper hover:underline"
      >
        Open in album
      </Link>
    </div>
  );
}

function scrubberLabel(scene, dayScenes) {
  if (scene.kind === 'overview') return { primary: 'Start', secondary: null };
  if (scene.kind === 'reflections') return { primary: 'Notes', secondary: null };
  if (scene.kind === 'day') {
    const idx = dayScenes.findIndex((d) => d.id === scene.id);
    const short = formatShortDay(scene.date);
    return {
      primary: short || `Day ${idx + 1}`,
      secondary: short ? `Day ${idx + 1}` : null,
    };
  }
  return { primary: scene.id, secondary: null };
}

export default function SceneReplayClient({ trip }) {
  const scenes = trip.scenes || [];
  const { flag, title } = splitFlag(trip.name);
  const canCopy = tripHasBlueprint(trip.id);

  const [activeScene, setActiveScene] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const sectionRefs = useRef([]);
  const hashReady = useRef(false);

  const dayScenes = scenes.filter((s) => s.kind === 'day');
  const firstDayIndex = scenes.findIndex((s) => s.kind === 'day');
  const active = scenes[activeScene];
  const isDayScene = active?.kind === 'day';
  const viewContext = {
    sceneId: active?.id || null,
    dayDate: active?.kind === 'day' ? active.date || null : null,
  };

  // Attach overview facts extras onto reflections so stay/weather survive the title-card pass.
  const overviewFacts = scenes.find((s) => s.kind === 'overview')?.facts || null;

  const goToScene = useCallback(
    (i, { smooth = true } = {}) => {
      if (i < 0 || i >= scenes.length) return;
      const el = sectionRefs.current[i];
      if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      setActiveScene(i);
    },
    [scenes.length]
  );

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPinned(!reduce);
  }, []);

  useEffect(() => {
    if (hashReady.current || !scenes.length) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      hashReady.current = true;
      return;
    }
    const index = scenes.findIndex((s) => s.id === hash);
    if (index >= 0) {
      requestAnimationFrame(() => {
        goToScene(index, { smooth: false });
        hashReady.current = true;
      });
    } else {
      hashReady.current = true;
    }
  }, [scenes, goToScene]);

  useEffect(() => {
    if (!hashReady.current) return;
    const scene = scenes[activeScene];
    if (!scene?.id) return;
    const next = `#${scene.id}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', `${window.location.pathname}${next}`);
    }
  }, [activeScene, scenes]);

  useEffect(() => {
    if (!pinned) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveScene(Number(e.target.dataset.sceneIndex));
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    sectionRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [pinned, scenes.length]);

  useEffect(() => {
    const onKey = (event) => {
      if (lightbox) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToScene(activeScene + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToScene(activeScene - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeScene, goToScene, lightbox]);

  const openLightbox = useCallback((scene, index) => setLightbox({ scene, index }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const lightboxPhotos = lightbox ? scenes[lightbox.scene].photos : [];
  const step = useCallback(
    (dir) =>
      setLightbox((s) =>
        s ? { ...s, index: (s.index + dir + lightboxPhotos.length) % lightboxPhotos.length } : s
      ),
    [lightboxPhotos.length]
  );

  const TopChrome = (
    <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-5 sm:px-6 pt-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/trips" className={PILL} aria-label="Back to all original trips">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Trips</span>
        </Link>
        <span className="truncate text-[11px] uppercase tracking-[0.22em] text-paper/85 drop-shadow">
          {flag && <span className="mr-1.5">{flag}</span>}
          {title} · {trip.year}
        </span>
      </div>
      <TripViewSwitcher
        tripId={trip.id}
        active="replay"
        context={viewContext}
        mode="film"
        showCopy={active?.kind !== 'overview'}
      />
    </div>
  );

  const ChapterScrubber = (
    <div className="absolute bottom-4 left-1/2 z-20 w-[min(100%-1.5rem,36rem)] -translate-x-1/2 pointer-events-auto">
      <div className="rounded-2xl bg-ink/60 px-2 py-2 backdrop-blur-md ring-1 ring-paper/15">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToScene(activeScene - 1)}
            disabled={activeScene === 0}
            aria-label="Previous chapter"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-paper/90 transition-colors hover:bg-paper/15 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto">
            {scenes.map((scene, i) => {
              const label = scrubberLabel(scene, dayScenes);
              const activeChip = i === activeScene;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => goToScene(i)}
                  aria-label={`Go to ${label.secondary || label.primary}`}
                  aria-current={activeChip ? 'true' : undefined}
                  className={`relative min-w-0 flex-1 rounded-xl px-2 py-1.5 text-center transition-colors ${
                    activeChip
                      ? 'bg-paper text-ink'
                      : 'text-paper/75 hover:bg-paper/10 hover:text-paper'
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-[0.12em] leading-tight whitespace-nowrap">
                    {label.primary}
                  </span>
                  {label.secondary && (
                    <span
                      className={`mt-0.5 block text-[9px] uppercase tracking-[0.1em] leading-none ${
                        activeChip ? 'text-ink/45' : 'text-paper/45'
                      }`}
                    >
                      {label.secondary}
                    </span>
                  )}
                  {activeChip && (
                    <span
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => goToScene(activeScene + 1)}
            disabled={activeScene === scenes.length - 1}
            aria-label="Next chapter"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-paper/90 transition-colors hover:bg-paper/15 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {canCopy && active?.kind !== 'overview' && (
          <div className="mt-2 border-t border-paper/10 px-2 pt-2 text-center">
            <Link
              href={`/trips/${trip.id}/copy`}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-paper/75
                         transition-colors hover:text-accent"
            >
              Make your own version of this trip
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const ClosingCta = (
    <div className="relative z-10 border-t border-paper/15 bg-ink px-6 py-16 sm:py-20 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-paper/50 mb-4">End of the replay</p>
      {canCopy ? (
        <>
          <p className="font-display text-2xl sm:text-3xl tracking-tight text-paper max-w-md mx-auto">
            Make your own version of this trip
          </p>
          <Link
            href={`/trips/${trip.id}/copy`}
            className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5
                       text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-paper hover:text-ink
                       transition-colors duration-300"
          >
            Copy this trip
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-paper/60">
            <Link href={`/journal/${trip.id}`} className="hover:text-paper transition-colors">
              Story
            </Link>
            <span aria-hidden className="text-paper/25">·</span>
            <Link href={`/albums/${trip.id}`} className="hover:text-paper transition-colors">
              Photos
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/journal/${trip.id}`}
            className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                       text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-paper hover:text-ink
                       transition-colors duration-300"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read the story
          </Link>
          <Link
            href={`/albums/${trip.id}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-paper/25 px-6 py-3
                       text-[11px] uppercase tracking-[0.2em] text-paper/85 hover:border-paper hover:text-paper
                       transition-colors duration-300"
          >
            <Camera className="h-3.5 w-3.5" />
            Browse photographs
          </Link>
        </div>
      )}
      {(getTripNeighborhoods(trip.id).length > 0 || getCitySlug(trip.id)) && (
        <div className="mt-6 space-y-3">
          {getTripNeighborhoods(trip.id).length > 0 && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-paper/50">
              Neighborhoods —{' '}
              {getTripNeighborhoods(trip.id).map((hood, i, all) => (
                <span key={hood.id}>
                  <Link
                    href={`/neighborhoods/${hood.id}`}
                    className="text-paper/75 underline decoration-accent/60 underline-offset-4 hover:text-accent transition-colors"
                  >
                    {hood.name}
                  </Link>
                  {i < all.length - 1 && ' · '}
                </span>
              ))}
            </p>
          )}
          {getCitySlug(trip.id) && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-paper/50">
              <Link
                href={`/cities/${getCitySlug(trip.id)}`}
                className="text-paper/75 underline decoration-accent/60 underline-offset-4 hover:text-accent transition-colors"
              >
                Every visit to {title} →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );

  const Lightbox = lightbox && (
    <ImageLightbox
      images={lightboxPhotos}
      currentIndex={lightbox.index}
      onClose={closeLightbox}
      onNext={() => step(1)}
      onPrevious={() => step(-1)}
    />
  );

  const renderSceneBody = (scene, i) => {
    if (scene.kind === 'overview') {
      return (
        <TitleCard
          scene={scene}
          tripTitle={title}
          tripId={trip.id}
          canCopy={canCopy}
          onStartDay={() => goToScene(firstDayIndex >= 0 ? firstDayIndex : 1)}
        />
      );
    }
    return (
      <SceneCard
        scene={
          scene.kind === 'reflections' && overviewFacts
            ? { ...scene, tripDetailsFacts: overviewFacts }
            : scene
        }
        tripId={trip.id}
      />
    );
  };

  // ——— Reduced-motion / no-pin fallback ———
  if (!pinned) {
    return (
      <div className="bg-ink text-paper">
        <div className="sticky top-14 md:top-16 z-20 bg-ink/90 backdrop-blur-sm pb-2">
          {TopChrome}
        </div>
        <div className="px-5 sm:px-6 pt-6 pb-10 max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.3em] text-paper/60">
            Replay {flag && <span className="mx-1">{flag}</span>} · {trip.year}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-tight">{title}</h1>
        </div>
        {scenes.map((scene, i) => (
          <section
            key={scene.id}
            id={scene.id}
            data-scene-index={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className="max-w-3xl mx-auto px-5 sm:px-6 pb-14 scroll-mt-28"
          >
            {scene.backgroundUrl && (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-ink/40">
                <Image
                  src={scene.backgroundUrl}
                  alt={scene.title}
                  fill
                  sizes="(min-width:768px) 768px, 100vw"
                  priority={i === 0}
                  className="object-cover"
                />
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3">
              {renderSceneBody(scene, i)}
              <PhotoStrip scene={scene} sceneIndex={i} tripId={trip.id} onOpen={openLightbox} />
            </div>
          </section>
        ))}
        {ClosingCta}
        {Lightbox}
        <AddToTripToast tripId={trip.id} />
      </div>
    );
  }

  // ——— Default: full-bleed pinned background + scrolling cards ———
  return (
    <div className="relative bg-ink text-paper">
      <div className={`sticky ${STAGE_TOP} ${STAGE_HEIGHT} w-full overflow-hidden`}>
        {scenes.map((scene, i) => {
          const near = Math.abs(i - activeScene) <= 1;
          return (
            <div
              key={scene.id}
              aria-hidden={i !== activeScene}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === activeScene ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ willChange: 'opacity' }}
            >
              {near && scene.backgroundUrl && (
                <Image
                  src={scene.backgroundUrl}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  quality={80}
                  className="object-cover"
                />
              )}
            </div>
          );
        })}

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-ink/70 via-ink/15 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none bg-gradient-to-b from-ink/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-ink/50 to-transparent" />

        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">{TopChrome}</div>

        {active?.kind !== 'overview' && ChapterScrubber}

        {/* Day-only inset map — kept off overview/title card */}
        {MAPBOX_TOKEN && trip.center && isDayScene && (
          <div
            className="absolute bottom-[7.5rem] right-4 z-20 hidden sm:block h-28 w-40 lg:h-36 lg:w-52
                       rounded-xl overflow-hidden border border-paper/20 shadow-lg bg-ink/40"
          >
            <InsetMap center={trip.center} route={active?.route} />
          </div>
        )}

        {MAPBOX_TOKEN && trip.center && isDayScene && active?.route?.length > 0 && (
          <div className="absolute bottom-[7.5rem] right-4 z-20 sm:hidden pointer-events-auto">
            <button
              type="button"
              onClick={() => setMobileMapOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink/60 px-3 py-2 text-[10px]
                         uppercase tracking-[0.16em] text-paper backdrop-blur-sm border border-paper/20"
              aria-expanded={mobileMapOpen}
            >
              <MapIcon className="h-3 w-3" />
              {mobileMapOpen ? 'Hide route' : 'Route'}
            </button>
            {mobileMapOpen && (
              <div className="mt-2 h-36 w-44 overflow-hidden rounded-xl border border-paper/20 shadow-lg bg-ink/40">
                <InsetMap center={trip.center} route={active?.route} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`relative z-10 ${STAGE_PULL} pointer-events-none`}>
        {scenes.map((scene, i) => (
          <section
            key={scene.id}
            id={scene.id}
            data-scene-index={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className={`${STAGE_HEIGHT} min-h-[calc(100svh-3.5rem)] md:min-h-[calc(100svh-4rem)] flex flex-col items-start justify-center gap-3 px-5 sm:px-6 pb-36 pointer-events-none`}
          >
            <div className="w-full max-w-md sm:max-w-lg sm:ml-4 lg:ml-14">
              {renderSceneBody(scene, i)}
            </div>
            <div className="sm:ml-4 lg:ml-14">
              <PhotoStrip scene={scene} sceneIndex={i} tripId={trip.id} onOpen={openLightbox} />
            </div>
          </section>
        ))}
      </div>

      {ClosingCta}
      {Lightbox}
      <AddToTripToast tripId={trip.id} />
    </div>
  );
}
