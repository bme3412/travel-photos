import { useMemo } from 'react';

export const useLocationData = (photos) => {
  return useMemo(() => {
    if (!photos?.length) return [];

    const locationMap = new Map();
    
    photos.forEach(photo => {
      if (!photo.coordinates || !photo.locationId) return;
      
      const key = photo.locationId;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          id: photo.locationId,
          name: photo.locationId,
          coordinates: photo.coordinates,
          photoCount: 1,
          photos: [photo]
        });
      } else {
        const location = locationMap.get(key);
        location.photoCount += 1;
        location.photos.push(photo);
      }
    });

    return Array.from(locationMap.values());
  }, [photos]);
};

export const useMapBounds = (locations) => {
  return useMemo(() => {
    if (!locations?.length) return null;
    
    const bounds = {
      north: Math.max(...locations.map(loc => loc.coordinates.lat)),
      south: Math.min(...locations.map(loc => loc.coordinates.lat)),
      east: Math.max(...locations.map(loc => loc.coordinates.lng)),
      west: Math.min(...locations.map(loc => loc.coordinates.lng))
    };
    
    return bounds;
  }, [locations]);
}; 