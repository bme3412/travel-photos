'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { Maximize2, Minimize2, ChevronLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import 'mapbox-gl/dist/mapbox-gl.css';
import { EnhancedDestinationMarkers } from '../components/EnhancedDestinationMarkers';
import PhotoSidePanel from '../components/PhotoSidePanel';

const REGIONS = {
  'North America': { latitude: 45, longitude: -100, zoom: 2.5 },
  'South America': { latitude: -20, longitude: -60, zoom: 2.8 },
  'Europe': { latitude: 50, longitude: 10, zoom: 3.2 },
  'Africa': { latitude: 0, longitude: 20, zoom: 2.8 },
  'Asia': { latitude: 35, longitude: 90, zoom: 2.5 },
  'Oceania': { latitude: -25, longitude: 135, zoom: 3 }
};

const MapPageClient = ({ initialDestinations = [], visitedCountries = {} }) => {
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

  // Destinations arrive pre-joined with their photos from the server
  const destinations = initialDestinations;

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

  // Restore body scroll if unmounted while popped out
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleOpenSidePanel = useCallback((location) => {
    setSelectedSidePanelLocation(location);
    setIsSidePanelOpen(true);
  }, []);

  const handleCloseSidePanel = useCallback(() => {
    setIsSidePanelOpen(false);
    setSelectedSidePanelLocation(null);
  }, []);

  // Paper/ink/terracotta palette — visited countries take a washed terracotta,
  // the rest a warm paper tone, to match the editorial design tokens.
  const countryLayer = useMemo(() => ({
    id: 'country-layer',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['get', ['get', 'iso_3166_1_alpha_3'], ['literal', visitedCountries]], false],
        '#C4693F',
        '#EDE7DB'
      ],
      'fill-opacity': 0.55
    }
  }), [visitedCountries]);

  const countryOutlineLayer = useMemo(() => ({
    id: 'country-outline-layer',
    type: 'line',
    paint: {
      'line-color': '#8A8075',
      'line-width': 0.5
    }
  }), []);

  const mapContent = (
    <>
      {/* Minimal floating controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
        {/* Compact region selector */}
        <div className="relative">
          <button
            onClick={() => setShowRegionMenu(!showRegionMenu)}
            className="bg-paper/95 backdrop-blur-sm border border-ink/10 text-ink/80 hover:text-ink px-3 py-1.5
                       transition-colors duration-200 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]"
          >
            <Globe className="h-3 w-3" />
            Regions
          </button>

          {showRegionMenu && (
            <div className="absolute top-full right-0 mt-1 bg-paper border border-ink/10 overflow-hidden min-w-[140px]">
              {Object.keys(REGIONS).map((region) => (
                <button
                  key={region}
                  onClick={() => flyToRegion(region)}
                  className="block w-full text-left px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-ink/70
                             hover:text-accent hover:bg-ink/5 transition-colors duration-150"
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
          className="bg-paper/95 backdrop-blur-sm border border-ink/10 text-ink/80 hover:text-ink p-1.5
                     transition-colors duration-200"
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
          className="absolute top-3 left-3 z-10 bg-paper/95 backdrop-blur-sm border border-ink/10 text-ink/80
                     hover:text-ink p-1.5 transition-colors duration-200"
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
        onMoveEnd={evt => setViewport(evt.viewState)}
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
          <div className="text-center space-y-2 border border-ink/10 bg-paper px-8 py-6">
            <p className="font-display text-xl text-ink/80">The map is missing its key</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (isPoppedOut) {
    return (
      <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm">
        <div className="absolute inset-4 bg-paper border border-ink/10 overflow-hidden transition-all duration-300 ease-in-out">
          {mapContent}
        </div>
        <PhotoSidePanel
          location={selectedSidePanelLocation}
          isOpen={isSidePanelOpen}
          onClose={handleCloseSidePanel}
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
      />
    </div>
  );
};

export default MapPageClient;

