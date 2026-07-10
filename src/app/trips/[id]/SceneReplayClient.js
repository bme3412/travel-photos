'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MapGL, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Clock, Route } from 'lucide-react';
import ImageLightbox from '../../components/ImageLightbox';

const ACCENT = '#B4441C';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

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

// Non-interactive inset map. On day scenes it draws that day's actual GPS path
// (start → end) and fits to it; otherwise it frames the city.
function InsetMap({ center, route }) {
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Refit whenever the active day's route changes (or the map finishes loading).
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

// A trip-report facts block: dates, nights, who, where, per-day weather.
function FactsBlock({ facts }) {
  const Row = ({ label, children, wide }) => (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-ink/85 leading-snug">{children}</dd>
    </div>
  );
  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
      {facts.dates && <Row label="Dates">{facts.dates}</Row>}
      {facts.nights != null && <Row label="Nights">{facts.nights}</Row>}
      {facts.party && <Row label="Who">{facts.party}</Row>}
      {facts.occasion && <Row label="Occasion">{facts.occasion}</Row>}
      {facts.stay && (
        <Row label="Stayed" wide>
          {facts.stay}
          {facts.stayNote && (
            <span className="mt-0.5 block text-[13px] text-ink/55">{facts.stayNote}</span>
          )}
        </Row>
      )}
      {facts.gettingAround && <Row label="Getting around" wide>{facts.gettingAround}</Row>}
      {facts.weather?.length > 0 && (
        <Row label="Weather" wide>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {facts.weather.map((w) => (
              <span key={w.day}>
                <span className="text-ink/60">{w.day}</span> {w.hi}
                <span className="text-ink/40">/{w.lo}</span>
              </span>
            ))}
          </span>
        </Row>
      )}
    </dl>
  );
}

// A trip-report reflections block: numbered takeaways + highlight + verdict.
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
          {reflections.rating ? ` · ${'★'.repeat(reflections.rating)}${'☆'.repeat(Math.max(0, 5 - reflections.rating))}` : ''}
        </p>
      )}
      {reflections.seed && (
        <p className="mt-5 text-[11px] italic text-muted">
          Seed reflections drawn from your notes — rewrite in your own words.
        </p>
      )}
    </div>
  );
}

// The narrative card: kicker + title + prose, plus any trip-report blocks
// (facts / day activities / reflections). Text only and sized to fit the
// viewport — photos live in the PhotoStrip below, never scrolled inside.
function SceneCard({ scene }) {
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
            <span className="inline-flex items-center gap-1.5" title="Distance traced between photo points (includes any transit)">
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

      {scene.facts && <FactsBlock facts={scene.facts} />}

      {scene.activities?.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
          {scene.activities.map((a, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] text-ink/80 leading-snug">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}

      {scene.moment && (
        <p className="mt-3 flex gap-2 text-[13px] italic leading-snug text-ink/60">
          <span aria-hidden className="not-italic text-accent">↳</span>
          {scene.moment}
        </p>
      )}

      {scene.reflections && <ReflectionsBlock reflections={scene.reflections} />}
    </article>
  );
}

// The scene's photographs as a row of large tiles beneath the card — fixed
// count (no scrolling), with a final tile opening the full set in the lightbox.
function PhotoStrip({ scene, sceneIndex, onOpen }) {
  const photos = scene.photos || [];
  if (!photos.length) return null;
  const shown = photos.slice(0, 5);
  const rest = photos.length - shown.length;
  return (
    <div className="pointer-events-auto flex items-center gap-2">
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
          onClick={() => onOpen(sceneIndex, 0)}
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
    </div>
  );
}

export default function SceneReplayClient({ trip }) {
  const scenes = trip.scenes || [];
  const { flag, title } = splitFlag(trip.name);

  const [activeScene, setActiveScene] = useState(0);
  const [pinned, setPinned] = useState(true); // SSR default; flipped off for reduced motion
  const [lightbox, setLightbox] = useState(null); // { scene, index } | null
  const sectionRefs = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setPinned(false);
      return;
    }
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
  }, []);

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

  const dayScenes = scenes.filter((s) => s.kind === 'day');
  const chapterLabel = (() => {
    const s = scenes[activeScene];
    if (!s) return '';
    if (s.kind === 'day') {
      const idx = dayScenes.findIndex((d) => d.id === s.id);
      return `Day ${idx + 1} of ${dayScenes.length}`;
    }
    if (s.kind === 'reflections') return 'Reflections';
    if (s.kind === 'overview') return 'Overview';
    return `${activeScene + 1} / ${scenes.length}`;
  })();

  const goToScene = useCallback((i) => {
    const el = sectionRefs.current[i];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Per-trip views. Global sections (Map, Photo of the Day) live in the header.
  const TABS = [
    { label: 'Replay', href: `/trips/${trip.id}`, active: true },
    { label: 'Story', href: `/journal/${trip.id}` },
    { label: 'Photos', href: `/albums/${trip.id}` },
  ];
  const TopChrome = (
    <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-5 sm:px-6 pt-5">
      <div className="flex items-center gap-3">
        <Link href="/trips" className={PILL} aria-label="Back to all trip replays">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Trips</span>
        </Link>
        <span className="hidden md:inline text-[11px] uppercase tracking-[0.25em] text-paper/85 drop-shadow">
          {flag && <span className="mr-1.5">{flag}</span>}
          {title} · {trip.year}
        </span>
      </div>
      <nav className="pointer-events-auto inline-flex items-center rounded-full bg-paper/90 p-1 text-[11px] uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm">
        {TABS.map((t) =>
          t.active ? (
            <span key={t.label} className="rounded-full bg-ink px-3.5 py-1.5 text-paper">
              {t.label}
            </span>
          ) : (
            <Link
              key={t.label}
              href={t.href}
              className="rounded-full px-3.5 py-1.5 text-ink/60 transition-colors hover:text-ink"
            >
              {t.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );

  const ClosingCta = (
    <div className="relative z-10 border-t border-paper/15 bg-ink px-6 py-16 sm:py-20 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-paper/50 mb-4">End of the replay</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href={`/journal/${trip.id}`}
          className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3
                     text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-paper hover:text-ink
                     transition-colors duration-300"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Read the full dispatch
        </Link>
        <Link
          href={`/albums/${trip.id}`}
          className="text-[11px] uppercase tracking-[0.2em] text-paper/70 hover:text-paper transition-colors"
        >
          Browse all {trip.photoCount} photographs
        </Link>
      </div>
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

  // ——— Reduced-motion / no-pin fallback: a plain stacked article ———
  if (!pinned) {
    return (
      <div className="bg-ink text-paper">
        <div className="pb-2">{TopChrome}</div>
        <div className="px-5 sm:px-6 pt-6 pb-10 max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.3em] text-paper/60">
            Replay {flag && <span className="mx-1">{flag}</span>} · {trip.year}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-tight">{title}</h1>
        </div>
        {scenes.map((scene, i) => (
          <section key={scene.id} className="max-w-3xl mx-auto px-5 sm:px-6 pb-14">
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
              <SceneCard scene={scene} />
              <PhotoStrip scene={scene} sceneIndex={i} onOpen={openLightbox} />
            </div>
          </section>
        ))}
        {ClosingCta}
        {Lightbox}
      </div>
    );
  }

  // ——— Default: full-bleed pinned background + scrolling cards ———
  return (
    <div className="relative bg-ink text-paper">
      {/* Pinned stage — one viewport, stays fixed while steps scroll over it */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
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

        {/* Localized scrims — darken behind the card (left) and top chrome only,
            so the photograph keeps its color and contrast on the right. */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-ink/70 via-ink/15 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none bg-gradient-to-b from-ink/45 to-transparent" />

        {/* Top chrome */}
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">{TopChrome}</div>

        {/* Chapter indicator + prev/next — one explicit control (native scroll) */}
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink/55 px-1.5 py-1 backdrop-blur-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => goToScene(activeScene - 1)}
            disabled={activeScene === 0}
            aria-label="Previous chapter"
            className="grid h-7 w-7 place-items-center rounded-full text-paper/90 transition-colors hover:bg-paper/15 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[92px] px-1 text-center text-[11px] uppercase tracking-[0.2em] text-paper/90">
            {chapterLabel}
          </span>
          <button
            type="button"
            onClick={() => goToScene(activeScene + 1)}
            disabled={activeScene === scenes.length - 1}
            aria-label="Next chapter"
            className="grid h-7 w-7 place-items-center rounded-full text-paper/90 transition-colors hover:bg-paper/15 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Inset locator map */}
        {MAPBOX_TOKEN && trip.center && (
          <div
            className="absolute bottom-4 right-4 z-20 hidden sm:block h-32 w-44 lg:h-40 lg:w-56
                       rounded-xl overflow-hidden border border-paper/20 shadow-lg bg-ink/40"
          >
            <InsetMap center={trip.center} route={scenes[activeScene]?.route} />
          </div>
        )}
      </div>

      {/* Steps — pulled up over the pinned stage. The wrapper + sections are
          click-transparent so the chrome/controls/map beneath stay interactive;
          only the cards (pointer-events-auto) capture clicks. */}
      <div className="relative z-10 -mt-[100svh] pointer-events-none">
        {scenes.map((scene, i) => (
          <section
            key={scene.id}
            data-scene-index={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className="min-h-[100svh] flex flex-col items-start justify-center gap-3 px-5 sm:px-6 pb-16 pointer-events-none"
          >
            <div className="w-full max-w-md sm:max-w-lg sm:ml-4 lg:ml-14">
              <SceneCard scene={scene} />
            </div>
            <div className="sm:ml-4 lg:ml-14">
              <PhotoStrip scene={scene} sceneIndex={i} onOpen={openLightbox} />
            </div>
          </section>
        ))}
      </div>

      {ClosingCta}
      {Lightbox}
    </div>
  );
}
