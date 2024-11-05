'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map as MapIcon, Camera } from 'lucide-react';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function AlbumMap({ locations }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  // Function to fly to a location
  const flyToLocation = (coordinates, zoom = 13) => {
    if (map.current) {
      map.current.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: zoom,
        essential: true,
        duration: 2000
      });
    }
  };

  useEffect(() => {
    console.log('Initializing AlbumMap with locations:', locations);

    if (
      typeof window === 'undefined' ||
      !mapContainer.current ||
      !locations?.length ||
      map.current
    ) {
      return;
    }

    let isMounted = true; // To prevent state updates if component is unmounted

    // Filter out invalid locations
    const validLocations = locations.filter(
      (location) =>
        location.coordinates &&
        typeof location.coordinates.lng === 'number' &&
        typeof location.coordinates.lat === 'number'
    );

    if (validLocations.length === 0) {
      console.warn('No valid locations available for mapping.');
      return;
    }

    // Assign the worker class correctly by creating a new Worker instance
    try {
      mapboxgl.workerClass = class extends Worker {
        constructor() {
          super('/workers/mapbox-gl-csp-worker.js');
        }
      };
    } catch (error) {
      console.error('Failed to assign Mapbox workerClass:', error);
      return;
    }

    // Calculate bounds for all locations
    const bounds = new mapboxgl.LngLatBounds();
    validLocations.forEach((location) => {
      bounds.extend([location.coordinates.lng, location.coordinates.lat]);
    });

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: bounds,
      padding: 50,
      maxZoom: 15
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers when map loads
    map.current.on('load', () => {
      validLocations.forEach((location) => {
        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
          <div class="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center 
                      text-white font-semibold shadow-lg transform transition-transform 
                      hover:scale-110 cursor-pointer">
            <span>${location.photoCount}</span>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${location.name}</h3>
            <p class="text-sm text-gray-600">${location.photoCount} photos</p>
          </div>
        `);

        // Add marker to map
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.push(marker);
      });

      map.current.resize();
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (map.current) {
        markersRef.current.forEach((marker) => marker.remove());
        map.current.remove();
        map.current = null;
      }
    };
  }, [locations]);

  if (!locations || locations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">Photo Locations</h2>
        </div>
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No location data available</p>
          </div>
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
          <span>{locations.length} locations</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[500px]" ref={mapContainer} />

      {/* Location List */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg 
                         shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => flyToLocation(location.coordinates)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white">
                  <span className="text-sm font-medium">{location.photoCount}</span>
                </div>
                <span className="text-gray-700 font-medium">{location.name}</span>
              </div>
              <span className="text-sm text-gray-500">{location.photoCount} photos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
