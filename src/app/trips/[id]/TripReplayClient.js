'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import MapGL, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { greatCircleArc } from '../../utils/geo';
import ImageLightbox from '../../components/ImageLightbox';

const FLY_MS = 2800; // camera flight between stops
const DWELL_MS = 5200; // pause on a stop during autoplay
const ARC_POINTS = 56;

// Route colors mirror the tailwind ink/accent tokens — Mapbox paint
// properties can't read the Tailwind config.
const INK = '#1B1713';
const ACCENT = '#B4441C';

// Album names carry a leading flag emoji ("🇪🇬 Egyptian Explorations") —
// same split as the homepage so the serif title stays clean.
const splitFlag = (name = '') => {
  const match = name.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s*(.*)$/u);
  return match ? { flag: match[1], title: match[2] } : { flag: null, title: name };
};

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatRange = ([from, to]) =>
  from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;

const lineData = (coords) =>
  coords.length >= 2
    ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }
    : { type: 'FeatureCollection', features: [] };

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export default function TripReplayClient({ trip }) {
  const MAPBOX_TOKEN =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // -1 is the overview: full dashed route, no stop selected yet.
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const mapRef = useRef(null);
  const rafRef = useRef(null);
  const reducedMotionRef = useRef(false);

  const { stops } = trip;
  const { flag, title } = splitFlag(trip.name);
  const lastIndex = stops.length - 1;
  const currentStop = index >= 0 ? stops[index] : null;

  // One great-circle arc per leg, precomputed once.
  const arcs = useMemo(
    () => stops.slice(1).map((stop, i) => greatCircleArc(stops[i].center, stop.center, ARC_POINTS)),
    [stops]
  );
  const fullRoute = useMemo(() => arcs.flat(), [arcs]);

  const initialViewState = useMemo(() => {
    const lat = stops.reduce((sum, s) => sum + s.center.lat, 0) / stops.length;
    const lng = stops.reduce((sum, s) => sum + s.center.lng, 0) / stops.length;
    return { latitude: lat, longitude: lng, zoom: 2 };
  }, [stops]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setTraveled = useCallback((coords) => {
    const source = mapRef.current?.getMap()?.getSource('route-traveled');
    if (source) source.setData(lineData(coords));
  }, []);

  // Reveal the route up to the given stop: legs before the last one appear
  // instantly, the final leg draws in over the camera flight.
  const animateRoute = useCallback(
    (stopIndex) => {
      cancelAnimationFrame(rafRef.current);
      if (stopIndex <= 0) {
        setTraveled([]);
        return;
      }
      const base = arcs.slice(0, stopIndex - 1).flat();
      const arc = arcs[stopIndex - 1];
      if (!arc || reducedMotionRef.current) {
        setTraveled(base.concat(arc || []));
        return;
      }
      const startedAt = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - startedAt) / FLY_MS);
        const count = Math.max(2, Math.ceil(easeInOut(t) * arc.length));
        setTraveled(base.concat(arc.slice(0, count)));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [arcs, setTraveled]
  );

  const goToStop = useCallback(
    (i) => {
      setIndex(i);
      setLightboxIndex(null);
      const stop = stops[i];
      const map = mapRef.current?.getMap();
      if (map && stop) {
        map.flyTo({
          center: [stop.center.lng, stop.center.lat],
          zoom: stop.zoom,
          duration: reducedMotionRef.current ? 0 : FLY_MS,
          essential: true,
        });
      }
      animateRoute(i);
    },
    [stops, animateRoute]
  );

  const fitOverview = useCallback(
    (duration = 1400) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      if (stops.length === 1) {
        const only = stops[0];
        map.flyTo({
          center: [only.center.lng, only.center.lat],
          zoom: Math.min(only.zoom, 8),
          duration,
        });
        return;
      }
      const lats = stops.map((s) => s.center.lat);
      const lngs = stops.map((s) => s.center.lng);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        {
          padding: { top: 90, bottom: 260, left: 60, right: 60 },
          maxZoom: 9,
          duration: reducedMotionRef.current ? 0 : duration,
        }
      );
    },
    [stops]
  );

  const goToOverview = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setIndex(-1);
    setLightboxIndex(null);
    fitOverview();
  }, [fitOverview]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (fullRoute.length >= 2 && !map.getSource('route-upcoming')) {
      map.addSource('route-upcoming', { type: 'geojson', data: lineData(fullRoute) });
      map.addLayer({
        id: 'route-upcoming-line',
        type: 'line',
        source: 'route-upcoming',
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': INK,
          'line-opacity': 0.25,
          'line-width': 1.5,
          'line-dasharray': [0.4, 2.4],
        },
      });
      map.addSource('route-traveled', { type: 'geojson', data: lineData([]) });
      map.addLayer({
        id: 'route-traveled-line',
        type: 'line',
        source: 'route-traveled',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ACCENT, 'line-width': 2.5 },
      });
    }
    fitOverview(0);
  }, [fullRoute, fitOverview]);

  const handlePlayPause = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (index >= lastIndex && lastIndex >= 0) {
      // Journey finished — restart from the first stop.
      goToStop(0);
    }
    setPlaying(true);
  }, [playing, index, lastIndex, goToStop]);

  // Autoplay: dwell on the current stop, then advance. The camera flight is
  // part of the delay so photos get their full dwell time once we arrive.
  useEffect(() => {
    if (!playing) return undefined;
    if (index >= lastIndex) {
      setPlaying(false);
      return undefined;
    }
    const delay = index === -1 ? 600 : FLY_MS + DWELL_MS;
    const timer = setTimeout(() => goToStop(index + 1), delay);
    return () => clearTimeout(timer);
  }, [playing, index, lastIndex, goToStop]);

  useEffect(() => {
    const onKey = (event) => {
      if (lightboxIndex !== null) return; // the lightbox owns the keyboard
      if (event.key === 'ArrowRight' && index < lastIndex) {
        setPlaying(false);
        goToStop(index + 1);
      } else if (event.key === 'ArrowLeft' && index > 0) {
        setPlaying(false);
        goToStop(index - 1);
      } else if (event.key === ' ') {
        event.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, lastIndex, lightboxIndex, goToStop, handlePlayPause]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-4">Trip replay</p>
        <h1 className="font-display text-3xl mb-4">{title}</h1>
        <p className="text-ink/70 text-sm">
          The map needs a Mapbox access token. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env
          file.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[540px] bg-paper overflow-hidden">
      <MapGL
        ref={mapRef}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={handleMapLoad}
        attributionControl={false}
        dragRotate={false}
        touchPitch={false}
        maxPitch={0}
      >
        {stops.map((stop, i) => {
          const state = i === index ? 'current' : i < index ? 'visited' : 'upcoming';
          return (
            <Marker
              key={stop.name}
              longitude={stop.center.lng}
              latitude={stop.center.lat}
              anchor="center"
              style={{ zIndex: state === 'current' ? 3 : state === 'visited' ? 2 : 1 }}
            >
              <button
                onClick={() => {
                  setPlaying(false);
                  goToStop(i);
                }}
                aria-label={`Go to stop ${i + 1}: ${stop.name}`}
                className={`flex items-center justify-center rounded-full font-sans font-medium shadow-md
                            transition-all duration-300 ${
                              state === 'current'
                                ? 'h-9 w-9 bg-accent text-paper text-xs ring-4 ring-accent/25'
                                : state === 'visited'
                                  ? 'h-7 w-7 bg-ink text-paper text-[11px]'
                                  : 'h-7 w-7 bg-paper text-ink text-[11px] border border-ink/30 hover:border-accent'
                            }`}
              >
                {i + 1}
              </button>
            </Marker>
          );
        })}
      </MapGL>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
          <Link
            href={`/albums/${trip.id}`}
            className="pointer-events-auto inline-flex items-center gap-2 bg-paper/90 backdrop-blur-sm
                       border border-ink/10 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.2em]
                       text-ink/70 hover:text-ink hover:border-accent transition-colors duration-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Album
          </Link>
          {index >= 0 && (
            <button
              onClick={goToOverview}
              className="pointer-events-auto inline-flex items-center gap-2 bg-paper/90 backdrop-blur-sm
                         border border-ink/10 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.2em]
                         text-ink/70 hover:text-ink hover:border-accent transition-colors duration-300"
            >
              <Globe className="h-3.5 w-3.5" />
              Full route
            </button>
          )}
        </div>
      </div>

      {/* Bottom panel */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-3 sm:px-6 pb-4 sm:pb-6 pointer-events-none">
        <div
          className="max-w-4xl mx-auto bg-paper/95 backdrop-blur-sm border border-ink/10 rounded-2xl
                     shadow-xl p-4 sm:p-6 pointer-events-auto"
        >
          {!currentStop ? (
            /* ——— Overview / intro ——— */
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-2">
                Trip replay {flag && <span className="ml-1">{flag}</span>} — {trip.year}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl tracking-tight leading-tight">
                {title}
              </h1>
              {trip.intro && (
                <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-ink/75 max-w-2xl">
                  {trip.intro}
                </p>
              )}
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/50">
                {stops.map((stop) => stop.name).join(' → ')}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  onClick={handlePlayPause}
                  className="inline-flex items-center gap-2.5 bg-accent text-paper rounded-full px-6 py-3
                             text-[11px] uppercase tracking-[0.2em] hover:bg-ink transition-colors duration-300"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Begin the journey
                </button>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
                  {stops.length} {stops.length === 1 ? 'stop' : 'stops'} · {trip.photoCount}{' '}
                  photographs
                  {trip.totalKm > 0 && <> · ~{trip.totalKm.toLocaleString()} km</>}
                </span>
              </div>
            </div>
          ) : (
            /* ——— Stop card ——— */
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-1.5">
                    Stop {index + 1} of {stops.length}
                    {trip.hasReliableDates
                      ? ` · ${formatRange(currentStop.dateRange)}`
                      : ` · ${trip.year}`}
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl tracking-tight leading-tight truncate">
                    {currentStop.name}
                    {currentStop.country && currentStop.country !== currentStop.name && (
                      <span className="text-ink/40 text-xl sm:text-2xl"> — {currentStop.country}</span>
                    )}
                  </h2>
                  {(currentStop.narrative || currentStop.description) && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70 line-clamp-3">
                      {currentStop.narrative || currentStop.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                  <button
                    onClick={() => {
                      setPlaying(false);
                      goToStop(index - 1);
                    }}
                    disabled={index === 0}
                    aria-label="Previous stop"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-ink/15
                               text-ink/70 hover:border-accent hover:text-ink transition-colors duration-200
                               disabled:opacity-30 disabled:hover:border-ink/15"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    aria-label={playing ? 'Pause replay' : index >= lastIndex ? 'Replay trip' : 'Play replay'}
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-accent text-paper
                               hover:bg-ink transition-colors duration-200"
                  >
                    {playing ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : index >= lastIndex ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPlaying(false);
                      goToStop(index + 1);
                    }}
                    disabled={index >= lastIndex}
                    aria-label="Next stop"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-ink/15
                               text-ink/70 hover:border-accent hover:text-ink transition-colors duration-200
                               disabled:opacity-30 disabled:hover:border-ink/15"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filmstrip — re-keyed per stop so it opens scrolled to the start */}
              <div key={index} className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {currentStop.photos.map((photo, photoIndex) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIndex(photoIndex)}
                    aria-label={photo.caption || `Photo ${photoIndex + 1}`}
                    className="group relative h-20 w-32 sm:h-24 sm:w-36 flex-shrink-0 rounded-lg
                               overflow-hidden bg-ink/5"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || 'Trip photo'}
                      fill
                      sizes="144px"
                      quality={60}
                      loading={photoIndex < 4 ? 'eager' : 'lazy'}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>

              {/* Progress dots */}
              {stops.length > 1 && (
                <div className="mt-4 flex items-center gap-1.5">
                  {stops.map((stop, i) => (
                    <button
                      key={stop.name}
                      onClick={() => {
                        setPlaying(false);
                        goToStop(i);
                      }}
                      aria-label={`Stop ${i + 1}: ${stop.name}`}
                      title={stop.name}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index
                          ? 'w-6 bg-accent'
                          : i < index
                            ? 'w-1.5 bg-ink/50'
                            : 'w-1.5 bg-ink/15 hover:bg-ink/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {currentStop && lightboxIndex !== null && (
        <ImageLightbox
          images={currentStop.photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % currentStop.photos.length)}
          onPrevious={() =>
            setLightboxIndex(
              (lightboxIndex - 1 + currentStop.photos.length) % currentStop.photos.length
            )
          }
        />
      )}
    </div>
  );
}
