'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { Maximize2, Minimize2, ChevronLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDestinationData } from '../utils/useDestinationData';
import { EnhancedDestinationMarkers } from '../components/EnhancedDestinationMarkers';
import PhotoSidePanel from '../components/PhotoSidePanel';
import destinationsData from '../../data/destinations.json';
import photosData from '../../data/photos.json';

const REGIONS = {
  'North America': { latitude: 45, longitude: -100, zoom: 2.5 },
  'South America': { latitude: -20, longitude: -60, zoom: 2.8 },
  'Europe': { latitude: 50, longitude: 10, zoom: 3.2 },
  'Africa': { latitude: 0, longitude: 20, zoom: 2.8 },
  'Asia': { latitude: 35, longitude: 90, zoom: 2.5 },
  'Oceania': { latitude: -25, longitude: 135, zoom: 3 }
};

const MapPage = () => {
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [mapRef, setMapRef] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.2,
    projection: 'mercator'
  });
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [hoveredDestination, setHoveredDestination] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedSidePanelLocation, setSelectedSidePanelLocation] = useState(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  
  // Use memoized destination processing with photos
  const { destinations, visitedCountries } = useDestinationData(destinationsData, photosData);

  const flyToRegion = useCallback((region) => {
    if (!mapRef) return;
    const view = REGIONS[region];
    mapRef.flyTo({
      center: [view.longitude, view.latitude],
      zoom: view.zoom,
      duration: 2000,
      essential: true
    });
    setShowRegionMenu(false);
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

  const handleOpenSidePanel = useCallback((location) => {
    setSelectedSidePanelLocation(location);
    setIsSidePanelOpen(true);
  }, []);

  const handleCloseSidePanel = useCallback(() => {
    setIsSidePanelOpen(false);
    setSelectedSidePanelLocation(null);
  }, []);

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
      {/* Minimal floating controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {/* Compact region selector */}
        <div className="relative">
          <button
            onClick={() => setShowRegionMenu(!showRegionMenu)}
            className="bg-black/20 backdrop-blur-md hover:bg-black/30 text-white px-2 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-medium shadow-sm"
          >
            <Globe className="h-3 w-3" />
            Regions
          </button>
          
          {showRegionMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 overflow-hidden min-w-[120px]">
              {Object.keys(REGIONS).map((region) => (
                <button
                  key={region}
                  onClick={() => flyToRegion(region)}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150"
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compact pop-out toggle */}
        <button
          onClick={togglePopOut}
          className="bg-black/20 backdrop-blur-md hover:bg-black/30 text-white p-1.5 rounded-lg transition-all duration-200 shadow-sm"
          title={isPoppedOut ? "Close Pop-out" : "Pop-out Map"}
        >
          {isPoppedOut ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Minimal back button */}
      {!isPoppedOut && (
        <Link 
          href="/" 
          className="absolute top-3 left-3 z-10 bg-black/20 backdrop-blur-md hover:bg-black/30 text-white p-1.5 rounded-lg transition-all duration-200 shadow-sm"
          title="Back to Home"
        >
          <ChevronLeft className="h-3 w-3" />
        </Link>
      )}

      {MAPBOX_TOKEN ? (
      <Map
        ref={setMapRef}
        initialViewState={viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={evt => setViewport(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        projection="mercator"
        minZoom={1}
        maxBounds={[[-180, -85], [180, 85]]}
        dragRotate={false}
        touchPitch={false}
        onClick={() => setShowRegionMenu(false)}
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

        <EnhancedDestinationMarkers
          destinations={destinations}
          mapLoaded={mapLoaded}
          hoveredDestination={hoveredDestination}
          setHoveredDestination={setHoveredDestination}
          onOpenSidePanel={handleOpenSidePanel}
          mapRef={mapRef}
          viewport={viewport}
        />
      </Map>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Missing Mapbox access token. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.
          </div>
        </div>
      )}
    </>
  );

  if (isPoppedOut) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/20 backdrop-blur-sm">
        <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out transform">
          {mapContent}
        </div>
        <PhotoSidePanel
          location={selectedSidePanelLocation}
          isOpen={isSidePanelOpen}
          onClose={handleCloseSidePanel}
          onPhotoClick={(photo) => console.log('Side panel photo clicked:', photo)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">
      {mapContent}
      <PhotoSidePanel
        location={selectedSidePanelLocation}
        isOpen={isSidePanelOpen}
        onClose={handleCloseSidePanel}
        onPhotoClick={(photo) => console.log('Side panel photo clicked:', photo)}
      />
    </div>
  );
};

export default MapPage;