'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl';
import { MapPin, CircleDot, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import 'mapbox-gl/dist/mapbox-gl.css';
import { countryToISO } from '../utils/countryMapping';
import destinationsData from '../../data/destinations.json';

const REGIONS = {
  'North America': { latitude: 45, longitude: -100, zoom: 2.5 },
  'South America': { latitude: -20, longitude: -60, zoom: 2.8 },
  'Europe': { latitude: 50, longitude: 10, zoom: 3.2 },
  'Africa': { latitude: 0, longitude: 20, zoom: 2.8 },
  'Asia': { latitude: 35, longitude: 90, zoom: 2.5 },
  'Oceania': { latitude: -25, longitude: 135, zoom: 3 }
};

const CustomMarker = ({ onClick, onMouseEnter, onMouseLeave, isHovered }) => (
  <div 
    className="relative cursor-pointer group"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div className="absolute -inset-1 bg-indigo-500/30 rounded-full animate-pulse" />
    <div className={`relative p-1 rounded-full shadow-lg transform transition-all duration-200 ${
      isHovered ? 'scale-125' : 'hover:scale-110'
    }`}
         style={{
           background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
         }}>
      <CircleDot className="h-2 w-2 text-white" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-1 w-1 bg-white rounded-full shadow-inner" />
    </div>
  </div>
);

const MapPage = () => {
  const [mapRef, setMapRef] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.2,
    projection: 'mercator'
  });
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [visitedCountries, setVisitedCountries] = useState({});
  const [hoveredDestination, setHoveredDestination] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setDestinations(destinationsData.destinations);
    const countryCodes = {};
    destinationsData.destinations.forEach(dest => {
      if (countryToISO[dest.country]) {
        countryCodes[countryToISO[dest.country]] = true;
      } else {
        console.warn(`No ISO code found for country: ${dest.country}`);
      }
    });
    setVisitedCountries(countryCodes);
  }, []);

  const flyToRegion = useCallback((region) => {
    if (!mapRef) return;
    const view = REGIONS[region];
    mapRef.flyTo({
      center: [view.longitude, view.latitude],
      zoom: view.zoom,
      duration: 2000,
      essential: true
    });
  }, [mapRef]);

  useEffect(() => {
    // Resize map after pop-out animation completes
    const timer = setTimeout(() => {
      if (mapRef) {
        mapRef.resize();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isPoppedOut, mapRef]);

  const togglePopOut = () => {
    setIsPoppedOut(!isPoppedOut);
    // Prevent scroll when popped out
    document.body.style.overflow = !isPoppedOut ? 'hidden' : 'auto';
  };

  const countryLayer = {
    id: 'country-layer',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['get', ['get', 'iso_3166_1_alpha_3'], ['literal', visitedCountries]], false],
        '#34d399',
        '#e5e7eb'
      ],
      'fill-opacity': 0.6
    }
  };

  const countryOutlineLayer = {
    id: 'country-outline-layer',
    type: 'line',
    paint: {
      'line-color': '#94a3b8',
      'line-width': 0.5
    }
  };

  const mapContent = (
    <>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {Object.keys(REGIONS).map((region) => (
          <button
            key={region}
            onClick={() => flyToRegion(region)}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-indigo-600 
                     hover:text-indigo-800 hover:bg-white shadow-md transition-all duration-200 
                     whitespace-nowrap text-sm font-medium"
          >
            {region}
          </button>
        ))}
        <button
          onClick={togglePopOut}
          className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-indigo-600 
                   hover:text-indigo-800 hover:bg-white shadow-md transition-all duration-200 
                   whitespace-nowrap text-sm font-medium flex items-center gap-2"
        >
          {isPoppedOut ? (
            <>
              <Minimize2 className="h-4 w-4" />
              <span>Close Pop-out</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              <span>Pop-out Map</span>
            </>
          )}
        </button>
      </div>

      {!isPoppedOut && (
        <Link 
          href="/" 
          className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full 
                     text-indigo-600 hover:text-indigo-800 shadow-md transition-colors duration-200 
                     flex items-center gap-2"
        >
          ← Back
        </Link>
      )}

      <Map
        ref={setMapRef}
        initialViewState={viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        onMove={evt => setViewport(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        projection="mercator"
        minZoom={1}
        maxBounds={[[-180, -85], [180, 85]]}
        dragRotate={false}
        touchPitch={false}
      >
        <Source
          id="countries"
          type="vector"
          url="mapbox://mapbox.country-boundaries-v1"
        >
          <Layer
            {...countryLayer}
            source-layer="country_boundaries"
          />
          <Layer
            {...countryOutlineLayer}
            source-layer="country_boundaries"
          />
        </Source>

        {mapLoaded && destinations.map((dest) => (
          <React.Fragment key={dest.id}>
            <Marker
              latitude={dest.latitude}
              longitude={dest.longitude}
              anchor="center"
            >
              <CustomMarker
                isHovered={hoveredDestination?.id === dest.id}
                onMouseEnter={() => setHoveredDestination(dest)}
                onMouseLeave={() => setHoveredDestination(null)}
              />
            </Marker>
            {hoveredDestination?.id === dest.id && (
              <Popup
                latitude={dest.latitude}
                longitude={dest.longitude}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                className="z-50"
                offset={12}
              >
                <div className="p-2 bg-white rounded-lg shadow-lg border border-indigo-100 min-w-[150px]">
                  <h2 className="text-sm font-semibold text-gray-900">{dest.name}</h2>
                  <p className="text-xs text-gray-600">{dest.country}</p>
                  {dest.description && (
                    <p className="mt-1 text-xs text-gray-700 line-clamp-2">{dest.description}</p>
                  )}
                </div>
              </Popup>
            )}
          </React.Fragment>
        ))}
      </Map>
    </>
  );

  if (isPoppedOut) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/20 backdrop-blur-sm">
        <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out transform">
          {mapContent}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">
      {mapContent}
    </div>
  );
};

export default MapPage;