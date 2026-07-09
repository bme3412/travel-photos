'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MapGL, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, BookOpen, ChevronDown, Play } from 'lucide-react';
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

// A fixed "you are here" map — non-interactive, framing the city.
function InsetMap({ center }) {
  if (!MAPBOX_TOKEN || !center) return null;
  return (
    <MapGL
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
      <Marker longitude={center.lng} latitude={center.lat} anchor="center">
        <span className="block h-3 w-3 rounded-full bg-accent ring-4 ring-accent/30 shadow" />
      </Marker>
    </MapGL>
  );
}

// The narrative card: kicker + title + prose + a grouped thumbnail cluster.
function SceneCard({ scene, sceneIndex, onOpen }) {
  return (
    <article
      className="max-w-md w-full sm:ml-4 lg:ml-14 rounded-2xl bg-paper/95 text-ink
                 backdrop-blur-sm shadow-xl ring-1 ring-ink/5 p-6 sm:p-7"
    >
      {scene.kicker && (
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2">{scene.kicker}</p>
      )}
      <h2 className="font-display text-2xl sm:text-3xl tracking-tight leading-tight">
        {scene.title}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{scene.text}</p>

      {scene.photos.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {scene.photos.slice(0, 6).map((photo, pi) => (
            <button
              key={photo.id}
              onClick={() => onOpen(sceneIndex, pi)}
              aria-label={photo.caption || `Photograph ${pi + 1}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-ink/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Image
                src={photo.url}
                alt={photo.caption || scene.title}
                fill
                sizes="120px"
                quality={60}
                loading={sceneIndex === 0 ? 'eager' : 'lazy'}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </article>
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

  const TopChrome = (
    <div className="max-w-5xl mx-auto flex items-center justify-between px-5 sm:px-6 pt-5">
      <Link href={`/albums/${trip.id}`} className={PILL}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Album
      </Link>
      <Link href={`/journal/${trip.id}`} className={PILL}>
        <BookOpen className="h-3.5 w-3.5" />
        Read the dispatch
      </Link>
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
            <div className="mt-6">
              <SceneCard scene={scene} sceneIndex={i} onOpen={openLightbox} />
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

        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/55 pointer-events-none" />

        {/* Top chrome */}
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">{TopChrome}</div>

        {/* Trip title, lower-left */}
        <div className="absolute bottom-6 left-5 sm:left-8 z-10 pointer-events-none max-w-xs">
          <p className="text-[11px] uppercase tracking-[0.3em] text-paper/70">
            Replay {flag && <span className="mx-1">{flag}</span>} · {trip.year}
          </p>
          <p className="mt-1 font-display text-2xl sm:text-3xl text-paper/95 tracking-tight">{title}</p>
        </div>

        {/* Scroll hint on the first scene */}
        <div
          className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center
                      text-paper/70 transition-opacity duration-500 pointer-events-none ${
                        activeScene === 0 ? 'opacity-100' : 'opacity-0'
                      }`}
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </div>

        {/* Inset locator map */}
        {MAPBOX_TOKEN && trip.center && (
          <div
            className="absolute bottom-4 right-4 z-20 hidden sm:block h-32 w-44 lg:h-40 lg:w-56
                       rounded-xl overflow-hidden border border-paper/20 shadow-lg bg-ink/40"
          >
            <InsetMap center={trip.center} />
          </div>
        )}
      </div>

      {/* Steps — pulled up over the pinned stage */}
      <div className="relative z-10 -mt-[100svh]">
        {scenes.map((scene, i) => (
          <section
            key={scene.id}
            data-scene-index={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className="min-h-[100svh] flex items-center px-5 sm:px-6"
          >
            <SceneCard scene={scene} sceneIndex={i} onOpen={openLightbox} />
          </section>
        ))}
      </div>

      {ClosingCta}
      {Lightbox}
    </div>
  );
}
