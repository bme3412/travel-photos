// src/app/utils/albumSummaries.js
//
// Builds the trimmed album shape shared by the homepage (src/app/page.js) and
// /api/albums. Only the cover photo is sent to the client — never the full
// photo list — keeping photos.json out of the page payload.

import { transformToCloudFront } from './imageUtils';

// Curated cover photos per album; each entry is a list of URL substrings to
// try in order. Albums not listed fall back to their first photo.
const COVER_PHOTO_PATTERNS = {
  monaco: ['monaco-panorama.jpg'],
  france: ['eiffel-tower-straight-on.jpg'],
  italy: ['venice-gondolas.jpg'],
  hongkong: ['hongkong-skyline2.jpeg'],
  vietnam: ['temple.jpg'],
  singapore: ['singapore-pool-night.jpg'],
  malaysia: ['malaysia-petronas-couch.jpg'],
  switzerland: ['zurich-river-bridge.jpg'],
  uruguay: ['montevideo-palmtree.jpg'],
  portugal: ['lisbon-arch-close.jpg'],
  spain: ['madrid-castle.jpg'],
  argentina: ['buenosaires-panorama.jpg'],
  chile: ['easterisland-moai-hat.jpg'],
  belgium: ['bruges-canal-tree-tower.jpg'],
  bosnia: ['mostar-pano.jpg'],
  croatia: ['dubrovnik-steps.jpg'],
  montenegro: ['perast-contrast.jpg'],
  mauritius: ['mauritius-beach-house.jpg'],
  botswana: ['chobe-three-giraffes-pose.jpg'],
  southafrica: ['capetown-beach-sunset.jpg'],
  belize: ['belize-sun-hut-palm.jpg'],
  guatemala: ['guatemala-tikal-5_rotated.jpg'],
  australia: ['sydney-opera-house2.jpg'],
  china: ['shanghai-skyline.jpg'],
  japan: ['tokyo-tower.jpg'],
  thailand: ['phuket-boat.jpg'],
  vatican: ['vatican-view.jpg'],
  austria: ['austria-palace.jpg'],
  hungary: ['budapest-bath.jpg'],
  netherlands: ['amsterdam-canals.jpg'],
  finland: ['helsinki-cathedral-clean.jpg'],
  brazil: ['helicopter-beach-sugarloaf.jpg', '/Brazil/helicopter-beach-sugarloaf.jpg'],
  stbarts: ['stbarts', 'barthélemy'],
};

function findCoverPhoto(albumId, albumPhotos) {
  const patterns = COVER_PHOTO_PATTERNS[albumId.toLowerCase()];
  if (patterns) {
    const match = albumPhotos.find((photo) =>
      patterns.some((pattern) => photo.url.includes(pattern))
    );
    if (match) return match;
  }
  return albumPhotos[0] || null;
}

const READ_WPM = 220;

export function buildAlbumSummaries(albumsData, photosData, locationsData, narrativesData = null) {
  const locations = Array.isArray(locationsData) ? locationsData : [];

  const getLocationName = (locationId) => {
    if (!locationId) return null;
    const location = locations.find((loc) => loc.id === locationId);
    return location?.name || locationId;
  };

  return albumsData.albums.map((album) => {
    const albumPhotos = photosData.photos.filter(
      (photo) => photo.albumId.toLowerCase() === album.id.toLowerCase()
    );
    const cover = findCoverPhoto(album.id, albumPhotos);

    // The trip narrative doubles as the dispatch: its intro is the feed
    // excerpt, its stop beats give a chapter count and a reading estimate.
    const narrative = narrativesData?.[album.id] || null;
    const chapterCount = narrative?.stops ? Object.keys(narrative.stops).length : 0;
    const words = narrative
      ? [narrative.intro, ...Object.values(narrative.stops || {})]
          .filter(Boolean)
          .join(' ')
          .split(/\s+/).length
      : 0;

    return {
      ...album,
      photoCount: albumPhotos.length,
      coverPhoto: cover
        ? {
            url: transformToCloudFront(cover.url),
            caption: cover.caption || null,
            locationName: getLocationName(cover.locationId),
          }
        : null,
      excerpt: narrative?.intro || null,
      chapterCount,
      readMin: words ? Math.max(1, Math.round(words / READ_WPM)) : null,
    };
  });
}
