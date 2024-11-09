'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Loader2 } from 'lucide-react';

const debug = (message, data = null) => {
  if (data) {
    console.log(`[MapDebug] ${message}`, data);
  } else {
    console.log(`[MapDebug] ${message}`);
  }
};

export default function AlbumMap({ album, onLocationSelect }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let mapboxgl = null;

    // Dynamically add Mapbox CSS
    const addMapboxCSS = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return link;
    };

    const initializeMap = async () => {
      try {
        debug('Starting map initialization');

        if (!mapContainer.current) {
          throw new Error('Container not available');
        }

        if (!album?.photos?.length) {
          throw new Error('No photos available');
        }

        // Add Mapbox CSS
        const cssLink = addMapboxCSS();

        // Wait for container to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!mounted) {
          cssLink.remove();
          return;
        }

        debug('Container dimensions:', {
          width: mapContainer.current.offsetWidth,
          height: mapContainer.current.offsetHeight
        });

        // Import and setup Mapbox
        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;

        if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
          throw new Error('Mapbox token missing');
        }

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        // Process locations from photos
        const locationMap = new Map();
        album.photos.forEach(photo => {
          if (!photo.coordinates || !photo.locationId) return;
          
          const key = photo.locationId;
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              name: photo.locationId,
              coordinates: photo.coordinates,
              photoCount: 1
            });
          } else {
            const location = locationMap.get(key);
            location.photoCount += 1;
          }
        });

        const locations = Array.from(locationMap.values());

        if (!locations.length) {
          throw new Error('No locations available');
        }

        debug('Valid locations:', locations);

        // Calculate bounds
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(location => {
          bounds.extend([location.coordinates.lng, location.coordinates.lat]);
        });

        // Create map
        mapInstance.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          bounds: bounds,
          fitBoundsOptions: { 
            padding: 50,
            maxZoom: 12 
          },
          attributionControl: false,
          preserveDrawingBuffer: true
        });

        // Add navigation control
        mapInstance.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );

        // Add markers on load
        mapInstance.current.on('load', () => {
          if (!mounted) return;

          locations.forEach(location => {
            const el = document.createElement('div');
            el.className = 'marker-container';
            el.innerHTML = `
              <div class="flex items-center justify-center w-8 h-8 rounded-full 
                          bg-teal-600 text-white border-2 border-white shadow-lg">
                <span class="text-sm font-medium">${location.photoCount}</span>
              </div>
            `;

            // Create and add marker
            new mapboxgl.Marker(el)
              .setLngLat([location.coordinates.lng, location.coordinates.lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div class="p-3">
                      <h3 class="font-semibold text-gray-900">${location.name}</h3>
                      <p class="text-sm text-gray-600 mt-1">${location.photoCount} photos</p>
                    </div>
                  `)
              )
              .addTo(mapInstance.current);

            if (onLocationSelect) {
              el.addEventListener('click', () => {
                onLocationSelect(location);
              });
            }
          });

          setIsLoading(false);
        });

      } catch (err) {
        debug('Error:', err);
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      // Remove the Mapbox CSS link if it exists
      const cssLink = document.querySelector('link[href*="mapbox-gl.css"]');
      if (cssLink) {
        cssLink.remove();
      }
    };
  }, [album, onLocationSelect]);

  if (!album?.photos?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Photo Locations</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapIcon className="h-4 w-4" />
            <span>0 locations</span>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No photos available to display on map
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Photo Locations</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapIcon className="h-4 w-4" />
          <span>{album?.photos?.length || 0} photos</span>
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80">
            <div className="text-red-500 text-center px-4">
              <p className="font-medium mb-1">Error loading map</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div 
          ref={mapContainer}
          className="map-wrapper h-96"
        />
      </div>
    </div>
  );
}