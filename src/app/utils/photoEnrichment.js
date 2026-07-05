// src/app/utils/photoEnrichment.js
//
// Resolves the display fields Photo of the Day needs (location name, album
// title, country, flag) on the server so the full albums/locations arrays
// never ship to the client. Shared by /photo-of-the-day and /api/random-photo.

export function enrichPhotoForDisplay(photo, albums = [], locations = []) {
  if (!photo) return null;

  let locationName = photo.locationId;
  if (photo.locationId?.startsWith('loc') && locations.length > 0) {
    const location = locations.find(loc => loc.id === photo.locationId);
    locationName = location?.name || photo.locationId;
  }

  const album = albums.find(alb => alb.id === photo.albumId);

  return {
    ...photo,
    locationName,
    albumTitle: album?.title || photo.albumId,
    country: album?.country || '',
    flag: album?.flag || '',
  };
}
