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
  Bed,
  Compass,
  MapPin,
  Copy,
  Check,
  Map as MapIcon,
} from 'lucide-react';
import { track } from '@vercel/analytics/react';
import { greatCircleArc, haversineKm } from '../../utils/geo';
import { stopActions, itineraryText } from '../../utils/tripActions';
import ImageLightbox from '../../components/ImageLightbox';

const FLY_MS = 2800; // camera flight between stops
const DWELL_MS = 5200; // pause on a stop during autoplay
const HERO_CYCLE_MS = 1750; // hero photo rotation while autoplaying
const ARC_POINTS = 56;

// Route colors mirror the tailwind ink/accent tokens — Mapbox paint
// properties can't read the Tailwind config.
const INK = '#1B1713';
const ACCENT = '#B4441C';

// Colored basemap — streets renders water, roads and place labels in full
// color (unlike the muted light style), so the route reads as a real map.
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

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

// The route is a MultiLineString: one line per leg, with no line across
// visit boundaries — there is no flight path between trips taken years apart.
const multiLineData = (lines) =>
  lines.length
    ? { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } }
    : { type: 'FeatureCollection', features: [] };

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// Diagonal span of a [[minLng,minLat],[maxLng,maxLat]] box, in km.
// ~0 for a stop whose photos share a single geocoded coordinate.
const boundsSpanKm = (b) =>
  b ? haversineKm({ lat: b[0][1], lng: b[0][0] }, { lat: b[1][1], lng: b[1][0] }) : 0;

// A stop is worth framing with fitBounds once its photos spread beyond a
// few km; below that (or a single point) fitBounds would slam to max zoom,
// so we fall back to a moderate context zoom instead.
const FIT_MIN_SPAN_KM = 3;

// Copy-this-trip action buttons carry a small leading icon keyed by action.
const ACTION_ICON = { stay: Bed, do: Compass, map: MapPin };

export default function TripReplayClient({ trip }) {
  const MAPBOX_TOKEN =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // -1 is the overview: full dashed route, no stop selected yet.
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Copy-this-trip experiment: `planning` shows the full actionable itinerary
  // from the overview; `copied` flashes confirmation after a clipboard copy.
  const [planning, setPlanning] = useState(false);
  const [copied, setCopied] = useState(false);

  const mapRef = useRef(null);
  const rafRef = useRef(null);
  const filmstripRef = useRef(null);
  const reducedMotionRef = useRef(false);

  const { stops, visits = [] } = trip;
  const { flag, title } = splitFlag(trip.name);
  const lastIndex = stops.length - 1;
  const currentStop = index >= 0 ? stops[index] : null;
  const multiVisit = visits.length > 1;

  // One great-circle arc per leg — null across visit boundaries.
  const arcs = useMemo(
    () =>
      stops.slice(1).map((stop, i) =>
        stop.visitIndex === stops[i].visitIndex
          ? greatCircleArc(stops[i].center, stop.center, ARC_POINTS)
          : null
      ),
    [stops]
  );
  const routeLines = useMemo(() => arcs.filter(Boolean), [arcs]);

  // Stops grouped by visit, keeping each stop's global index for markers,
  // progress dots and navigation.
  const visitStops = useMemo(
    () =>
      visits.map((visit, vi) => ({
        visit,
        entries: stops.map((stop, i) => ({ stop, i })).filter(({ stop }) => stop.visitIndex === vi),
      })),
    [visits, stops]
  );

  // Repeat visits put two or three "Paris" stops on the same coordinates —
  // fan duplicates out by a few screen pixels so every marker stays clickable.
  const markerOffsets = useMemo(() => {
    const seen = new Map();
    return stops.map((stop) => {
      const k = seen.get(stop.name) || 0;
      seen.set(stop.name, k + 1);
      if (k === 0) return [0, 0];
      const angle = k * 2.4;
      const radius = 16 + 4 * k;
      return [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)];
    });
  }, [stops]);

  const initialViewState = useMemo(() => {
    const lat = stops.reduce((sum, s) => sum + s.center.lat, 0) / stops.length;
    const lng = stops.reduce((sum, s) => sum + s.center.lng, 0) / stops.length;
    return { latitude: lat, longitude: lng, zoom: 2 };
  }, [stops]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setTraveled = useCallback((lines) => {
    const source = mapRef.current?.getMap()?.getSource('route-traveled');
    if (source) source.setData(multiLineData(lines));
  }, []);

  // Reveal the route up to the given stop: legs before the last one appear
  // instantly, the final leg draws in over the camera flight. A null leg
  // (visit boundary) has nothing to draw.
  const animateRoute = useCallback(
    (stopIndex) => {
      cancelAnimationFrame(rafRef.current);
      if (stopIndex <= 0) {
        setTraveled([]);
        return;
      }
      const base = arcs.slice(0, stopIndex - 1).filter(Boolean);
      const arc = arcs[stopIndex - 1];
      if (!arc || reducedMotionRef.current) {
        setTraveled(arc ? [...base, arc] : base);
        return;
      }
      const startedAt = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - startedAt) / FLY_MS);
        const count = Math.max(2, Math.ceil(easeInOut(t) * arc.length));
        setTraveled([...base, arc.slice(0, count)]);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [arcs, setTraveled]
  );

  // Frame a single stop: fit its photo bounds when they have real extent,
  // otherwise ease to a moderate context zoom (a lone geocoded point can't
  // be framed, and its stop.zoom is deliberately tight for dense clusters).
  const frameStop = useCallback((stop, duration) => {
    const map = mapRef.current?.getMap();
    if (!map || !stop) return;
    const motionDuration = reducedMotionRef.current ? 0 : duration;
    if (stop.bounds && boundsSpanKm(stop.bounds) >= FIT_MIN_SPAN_KM) {
      map.fitBounds(stop.bounds, {
        padding: 60,
        maxZoom: 12,
        duration: motionDuration,
        essential: true,
      });
    } else {
      map.flyTo({
        center: [stop.center.lng, stop.center.lat],
        zoom: Math.min(stop.zoom, 9),
        duration: motionDuration,
        essential: true,
      });
    }
  }, []);

  const goToStop = useCallback(
    (i) => {
      setIndex(i);
      setHeroIndex(0);
      setLightboxIndex(null);
      frameStop(stops[i], FLY_MS);
      animateRoute(i);
    },
    [stops, animateRoute, frameStop]
  );

  const fitOverview = useCallback(
    (duration = 1400) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      if (stops.length === 1) {
        frameStop(stops[0], duration);
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
          padding: { top: 70, bottom: 70, left: 56, right: 56 },
          maxZoom: 9,
          duration: reducedMotionRef.current ? 0 : duration,
        }
      );
    },
    [stops, frameStop]
  );

  const goToOverview = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setIndex(-1);
    setLightboxIndex(null);
    setPlanning(false);
    fitOverview();
  }, [fitOverview]);

  // Log every outbound intent click so the copy-this-trip hypothesis is
  // measurable: which stop, which provider, and whether it came from a single
  // stop card or the full itinerary panel.
  const trackAction = useCallback(
    (provider, stopName, surface) => {
      track('trip_action', { trip: trip.id, provider, stop: stopName, surface });
    },
    [trip.id]
  );

  const copyItinerary = useCallback(async () => {
    const text = itineraryText(trip, process.env.NEXT_PUBLIC_SITE_URL);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track('trip_action', { trip: trip.id, provider: 'clipboard', surface: 'itinerary' });
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — no-op.
    }
  }, [trip]);

  // Stay / Do / Map links for one stop. `surface` distinguishes a click on a
  // single stop card from one in the full itinerary list.
  const ActionRow = useCallback(
    ({ stop, surface }) => (
      <div className="flex flex-wrap gap-2">
        {stopActions(stop).map((action) => {
          const Icon = ACTION_ICON[action.key];
          return (
            <a
              key={action.key}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackAction(action.provider, stop.name, surface)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper
                         px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-ink/70
                         hover:border-accent hover:text-ink transition-colors duration-200"
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {action.label}
            </a>
          );
        })}
      </div>
    ),
    [trackAction]
  );

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (routeLines.length && !map.getSource('route-upcoming')) {
      map.addSource('route-upcoming', { type: 'geojson', data: multiLineData(routeLines) });
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
      map.addSource('route-traveled', { type: 'geojson', data: multiLineData([]) });
      map.addLayer({
        id: 'route-traveled-line',
        type: 'line',
        source: 'route-traveled',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ACCENT, 'line-width': 2.5 },
      });
    }
    fitOverview(0);
  }, [routeLines, fitOverview]);

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

  // While autoplaying, rotate the hero photo through the stop's images.
  useEffect(() => {
    if (!playing || !currentStop || currentStop.photos.length < 2) return undefined;
    if (reducedMotionRef.current) return undefined;
    const timer = setInterval(
      () => setHeroIndex((prev) => (prev + 1) % currentStop.photos.length),
      HERO_CYCLE_MS
    );
    return () => clearInterval(timer);
  }, [playing, currentStop]);

  // Keep the active thumbnail in view as the hero rotates.
  useEffect(() => {
    const active = filmstripRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({
      behavior: reducedMotionRef.current ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [heroIndex, index]);

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

  const safeHero = currentStop ? Math.min(heroIndex, currentStop.photos.length - 1) : 0;
  const heroPhoto = currentStop?.photos[safeHero];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] min-h-[560px] bg-paper overflow-hidden">
      {/* ——— Map panel ——— */}
      <div className="relative h-[40vh] min-h-[240px] lg:h-full lg:flex-1 border-b lg:border-b-0 lg:border-r border-ink/10">
      <MapGL
        ref={mapRef}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
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
              key={`${i}-${stop.name}`}
              longitude={stop.center.lng}
              latitude={stop.center.lat}
              offset={markerOffsets[i]}
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

      </div>
      {/* ——— End map panel ——— */}

      {/* ——— Content panel ——— */}
      <aside className="relative flex-1 lg:h-full lg:flex-none lg:w-2/5 lg:max-w-2xl overflow-y-auto bg-paper">
        <div className="p-5 sm:p-7 lg:p-8">
          {!currentStop && planning ? (
            /* ——— Copy this trip: full actionable itinerary ——— */
            <div>
              <button
                onClick={() => setPlanning(false)}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]
                           text-ink/60 hover:text-ink transition-colors duration-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to replay
              </button>
              <h1 className="mt-4 font-display text-3xl tracking-tight leading-tight">
                Copy this trip
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/70 max-w-2xl">
                Plan your own version of {title} — book a place to stay and find
                things to do at every stop, in order.
              </p>
              <button
                onClick={copyItinerary}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-paper px-5 py-2.5
                           text-[11px] uppercase tracking-[0.2em] hover:bg-accent transition-colors duration-300"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy itinerary'}
              </button>
              <ol className="mt-6 space-y-5">
                {stops.map((stop, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full
                                     bg-ink/5 text-[11px] font-medium text-ink/60">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">
                        {stop.name}
                        {stop.country && stop.country !== stop.name && (
                          <span className="text-ink/40"> — {stop.country}</span>
                        )}
                      </p>
                      <div className="mt-2">
                        <ActionRow stop={stop} surface="itinerary" />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-[11px] leading-relaxed text-muted">
                Links open partner sites (Booking.com, GetYourGuide, Google Maps).
              </p>
            </div>
          ) : !currentStop ? (
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
              {multiVisit ? (
                <div className="mt-2.5 space-y-1">
                  {visitStops.map(({ visit, entries }, vi) =>
                    entries.length ? (
                      <p
                        key={vi}
                        className="text-[11px] uppercase tracking-[0.18em] text-ink/50"
                      >
                        <span className="text-accent/90">{visit.label || 'Undated'}</span>
                        <span className="mx-2 text-ink/30">·</span>
                        {entries.map(({ stop }) => stop.name).join(' → ')}
                      </p>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/50">
                  {stops.map((stop) => stop.name).join(' → ')}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  onClick={handlePlayPause}
                  className="inline-flex items-center gap-2.5 bg-accent text-paper rounded-full px-6 py-3
                             text-[11px] uppercase tracking-[0.2em] hover:bg-ink transition-colors duration-300"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Begin the journey
                </button>
                <button
                  onClick={() => {
                    setPlanning(true);
                    track('trip_action', { trip: trip.id, provider: 'open', surface: 'itinerary' });
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border border-ink/20 px-6 py-3
                             text-[11px] uppercase tracking-[0.2em] text-ink/75
                             hover:border-accent hover:text-ink transition-colors duration-300"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  Copy this trip
                </button>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
                  {multiVisit && <>{visits.length} visits · </>}
                  {stops.length} {stops.length === 1 ? 'stop' : 'stops'} · {trip.photoCount}{' '}
                  photographs
                  {trip.totalKm > 0 && <> · ~{trip.totalKm.toLocaleString()} km</>}
                </span>
              </div>
            </div>
          ) : (
            /* ——— Stop card ——— */
            <div>
              {/* Meta + navigation */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted pt-2">
                  Stop {index + 1} of {stops.length}
                  {currentStop.hasDates
                    ? ` · ${formatRange(currentStop.dateRange)}`
                    : multiVisit
                      ? ''
                      : ` · ${trip.year}`}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                    aria-label={
                      playing ? 'Pause replay' : index >= lastIndex ? 'Replay trip' : 'Play replay'
                    }
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

              {/* Title */}
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-[2rem] tracking-tight leading-[1.12] text-balance">
                {currentStop.name}
                {currentStop.country && currentStop.country !== currentStop.name && (
                  <span className="text-ink/40 text-xl sm:text-2xl">
                    {' '}
                    — {currentStop.country}
                  </span>
                )}
              </h2>

              {/* Hero photo — full panel width; click for the lightbox; rotates during autoplay */}
              <button
                onClick={() => setLightboxIndex(safeHero)}
                aria-label={heroPhoto.caption || 'Open photo'}
                className="group relative mt-4 block h-60 sm:h-72 lg:h-80 w-full overflow-hidden rounded-xl bg-ink/5"
              >
                <Image
                  key={heroPhoto.id}
                  src={heroPhoto.url}
                  alt={heroPhoto.caption || 'Trip photo'}
                  fill
                  sizes="(min-width: 1024px) 600px, (min-width: 640px) 60vw, 100vw"
                  quality={82}
                  priority
                  className="object-cover animate-fade-in transition-transform duration-500
                             group-hover:scale-[1.02]"
                />
                {currentStop.photos.length > 1 && (
                  <span
                    className="absolute top-2.5 right-2.5 rounded-full bg-ink/60 px-2 py-0.5
                               font-sans text-[10px] text-paper"
                  >
                    {safeHero + 1} / {currentStop.photos.length}
                  </span>
                )}
                {heroPhoto.caption && (
                  <span
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent
                               px-3 pb-2.5 pt-10 text-left text-[11px] leading-snug text-paper/95
                               line-clamp-2"
                  >
                    {heroPhoto.caption}
                  </span>
                )}
              </button>

              {/* Narrative */}
              {(currentStop.narrative || currentStop.description) && (
                <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-ink/75">
                  {currentStop.narrative || currentStop.description}
                </p>
              )}

              {/* Copy-this-trip: act on this stop */}
              <div className="mt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-muted">
                  Copy this stop
                </p>
                <ActionRow stop={currentStop} surface="stop" />
              </div>

              {/* Filmstrip — selects the hero; click the selected thumb to open
                  the lightbox. Re-keyed per stop so it opens scrolled to the start. */}
              <div
                key={index}
                ref={filmstripRef}
                className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              >
                {currentStop.photos.map((photo, photoIndex) => (
                  <button
                    key={photo.id}
                    data-active={photoIndex === safeHero}
                    onClick={() => {
                      if (photoIndex === safeHero) {
                        setLightboxIndex(photoIndex);
                        return;
                      }
                      setPlaying(false);
                      setHeroIndex(photoIndex);
                    }}
                    aria-label={photo.caption || `Photo ${photoIndex + 1}`}
                    className={`relative h-20 w-28 sm:h-24 sm:w-40 flex-shrink-0 rounded-lg overflow-hidden
                                bg-ink/5 transition-all duration-200 ${
                                  photoIndex === safeHero
                                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-paper'
                                    : 'opacity-75 hover:opacity-100'
                                }`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || 'Trip photo'}
                      fill
                      sizes="160px"
                      quality={60}
                      loading={photoIndex < 6 ? 'eager' : 'lazy'}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Progress dots, grouped by visit */}
              {stops.length > 1 && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {visitStops.map(({ visit, entries }, vi) =>
                    entries.length ? (
                      <div key={vi} className="flex items-center gap-1.5">
                        {multiVisit && (
                          <span className="mr-0.5 text-[9px] uppercase tracking-[0.15em] text-muted">
                            {visit.shortLabel || 'Undated'}
                          </span>
                        )}
                        {entries.map(({ stop, i }) => (
                          <button
                            key={i}
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
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

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
