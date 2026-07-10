import { notFound } from 'next/navigation';
import {
  readAlbums,
  readPhotos,
  readLocations,
  readDestinations,
  readNarratives,
} from '../../utils/fileHandler';
import { buildTrip } from '../../utils/tripBuilder';
import { buildMediaResolver } from '../../utils/mediaResolver';
import { transformToCloudFront } from '../../utils/imageUtils';
import { haversineKm } from '../../utils/geo';
import TripReplayClient from './TripReplayClient';
import SceneReplayClient from './SceneReplayClient';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

async function getTripData(id) {
  try {
    const [albumsData, photosData, locationsData, destinationsData, narrativesData] =
      await Promise.all([
        readAlbums(),
        readPhotos(),
        readLocations(),
        readDestinations(),
        readNarratives(),
      ]);

    if (!albumsData || !photosData) return null;

    const album = albumsData.albums.find(
      (a) => a.id.toLowerCase() === id.toLowerCase()
    );
    if (!album) return null;

    const trip = buildTrip(album, photosData, locationsData, destinationsData);
    if (!trip) return null;

    // Overlay the generated/edited narrative (scripts/generate-narratives.mjs).
    // Stops fall back to the destination description when no narrative exists.
    const narrative = narrativesData?.[album.id];
    if (narrative) {
      trip.intro = narrative.intro || null;
      trip.stops.forEach((stop) => {
        stop.narrative = narrative.stops?.[stop.name] || null;
      });
    }

    // Scene-based scroll replay. Two authoring modes, both resolved server-side
    // into trip.scenes (an ordered list of scenes with a background + optional
    // photo cluster). Trips with neither fall through to TripReplayClient.
    if (narrative?.report || narrative?.scenes?.length) {
      const rawPhotos = photosData.photos.filter(
        (p) => p.albumId.toLowerCase() === album.id.toLowerCase()
      );
      const resolve = buildMediaResolver(rawPhotos, []);
      const asPhoto = (raw) => ({
        id: raw.id,
        url: transformToCloudFront(raw.url),
        caption: raw.caption || '',
      });

      if (narrative.report) {
        // Trip-report mode: a facts/overview scene, one scene per day (photos
        // bucketed by capture date), then a reflections scene.
        const R = narrative.report;
        const heroBg =
          (R.heroBackground && resolve(R.heroBackground)) ||
          (rawPhotos[0] && transformToCloudFront(rawPhotos[0].url)) ||
          null;

        const overview = {
          id: 'overview',
          kicker: `Trip report · ${R.facts?.dates || trip.year}`,
          title: 'At a glance',
          text: R.dek || trip.intro || '',
          facts: R.facts || null,
          backgroundUrl: heroBg,
          photos: [],
        };

        // Bucket by recovered local capture date (falls back to the flattened
        // dateCreated), and order each day by real capture time.
        const localDate = (p) => (p.takenAt ? p.takenAt.slice(0, 10) : p.dateCreated);
        const fmtTime = (iso) => {
          const m = /T(\d{2}):(\d{2})/.exec(iso || '');
          if (!m) return null;
          let h = +m[1];
          const ap = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h}:${m[2]} ${ap}`;
        };
        const dayScenes = (R.days || []).map((d) => {
          const dayRaw = rawPhotos
            .filter((p) => localDate(p) === d.date)
            .sort((a, b) => (a.takenAt || '').localeCompare(b.takenAt || ''));
          const dayPhotos = dayRaw.map(asPhoto);

          // Ambient context recovered from EXIF: the day's active window and the
          // distance traced between photo points (a floor, not true steps).
          const times = dayRaw.map((p) => p.takenAt).filter(Boolean);
          const timeWindow =
            times.length > 1 ? `${fmtTime(times[0])} – ${fmtTime(times[times.length - 1])}` : null;
          const gpsPts = dayRaw.map((p) => p.gps).filter(Boolean);
          let km = 0;
          for (let i = 1; i < gpsPts.length; i += 1) km += haversineKm(gpsPts[i - 1], gpsPts[i]);
          const distanceKm = gpsPts.length > 1 ? Math.round(km * 10) / 10 : null;

          const backgroundUrl =
            (d.background && resolve(d.background)) ||
            dayPhotos[Math.floor(dayPhotos.length / 2)]?.url ||
            heroBg;
          return {
            id: d.id,
            kicker: d.kicker,
            title: d.title,
            text: d.text,
            activities: d.activities || [],
            photos: dayPhotos,
            backgroundUrl,
            timeWindow,
            distanceKm,
            route: gpsPts, // ordered {lat,lng} for the day's path on the inset map
          };
        });

        const refl = R.reflections;
        const reflScene = refl
          ? {
              id: 'reflections',
              kicker: 'Reflections · Paris',
              title: '5 things I learned',
              reflections: refl,
              backgroundUrl: (refl.background && resolve(refl.background)) || heroBg,
              photos: [],
            }
          : null;

        trip.scenes = [overview, ...dayScenes, ...(reflScene ? [reflScene] : [])].filter(
          (s) => s.backgroundUrl
        );
        trip.report = { facts: R.facts || null, reflections: refl || null };
      } else {
        // Scenes mode: photos authored by filename substring.
        trip.scenes = narrative.scenes
          .map((scene) => {
            const photos = (scene.photos || [])
              .map((ref) => {
                const url = resolve(ref);
                if (!url) return null;
                const raw = rawPhotos.find((p) => p.url.includes(ref));
                return { id: raw?.id ?? ref, url, caption: raw?.caption || '' };
              })
              .filter(Boolean);
            const backgroundUrl =
              (scene.background && resolve(scene.background)) || photos[0]?.url || null;
            return { ...scene, photos, backgroundUrl };
          })
          .filter((scene) => scene.backgroundUrl);
      }

      if (trip.scenes?.length) {
        trip.center = trip.stops[0]?.center || null;
      }
    }

    return trip;
  } catch (error) {
    console.error('Error building trip data:', error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const albumsData = await readAlbums();
    if (!albumsData?.albums) return [];
    return albumsData.albums.map((album) => ({ id: album.id }));
  } catch (error) {
    console.error('Error generating trip static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const trip = await getTripData(id);

  if (!trip) {
    return {
      title: 'Trip Not Found | Passport & Ponder',
      description: 'This trip could not be found',
    };
  }

  const route = trip.stops.map((stop) => stop.name).join(' → ');
  const coverUrl = trip.stops[0]?.photos[0]?.url;

  return {
    title: `Replay: ${trip.name} | Passport & Ponder`,
    description: `Retrace the ${trip.year} journey — ${route}`,
    openGraph: {
      title: `Replay: ${trip.name}`,
      description: route,
      images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: trip.name }] : [],
    },
  };
}

export default async function TripPage({ params }) {
  const { id } = await params;
  const trip = await getTripData(id);

  if (!trip) {
    notFound();
  }

  if (trip.scenes?.length) {
    return <SceneReplayClient trip={trip} />;
  }
  return <TripReplayClient trip={trip} />;
}
