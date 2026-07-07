'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import MapGL from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Filter, X, Target, Maximize2, Minimize2, Navigation } from 'lucide-react';
import { useLocationData, useMapBounds } from '../utils/useLocationData';
import { getClusterThreshold } from '../utils/smartZoom';
import { EnhancedMarkerCluster } from './EnhancedMarkerCluster';
import usePhotoStore from '../store/usePhotoStore';

const INITIAL_VIEW_STATE = {
  latitude: 20,
  longitude: 0,
  zoom: 2
};

const MAP_STYLES = [
  { id: 'streets', label: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'satellite', label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'outdoors', label: 'Outdoors', style: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'light', label: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
];

export default function AlbumMap({ album, onLocationSelect }) {
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  // The map is uncontrolled; React only tracks the rounded zoom badge and the
  // bucketed cluster radius, so panning/zooming doesn't re-render per frame.
  const [displayZoom, setDisplayZoom] = useState(Math.round(INITIAL_VIEW_STATE.zoom));
  const [clusterRadius, setClusterRadius] = useState(() => getClusterThreshold(INITIAL_VIEW_STATE.zoom));
  const [filteredLocation, setFilteredLocation] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].style);
  const [showLocationList, setShowLocationList] = useState(false);
  
  // Refs for cluster component and map
  const clusterRef = useRef(null);
  const mapRef = useRef(null);
  
  // Photo store for lightbox integration
  const openLightbox = usePhotoStore((state) => state.openLightbox);
  
  // Use memoized location processing
  const allLocations = useLocationData(album?.photos);
  const locations = useMemo(() => 
    filteredLocation 
      ? allLocations.filter(loc => loc.id === filteredLocation.id)
      : allLocations,
    [allLocations, filteredLocation]
  );
  const bounds = useMapBounds(locations);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setMapError('Missing Mapbox access token. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.');
      setIsLoading(false);
    }
  }, [MAPBOX_TOKEN]);

  // Initialize map with proper bounds when locations are available
  const handleMapLoad = useCallback(() => {
    try {
      setIsLoading(false);
      setMapError(null);
      
      // Fit to bounds if we have locations
      if (bounds && locations.length > 0 && mapRef.current) {
        const map = mapRef.current.getMap();
        if (map && map.fitBounds) {
          // Use Mapbox's fitBounds for better automatic zooming
          map.fitBounds(
            [[bounds.west, bounds.south], [bounds.east, bounds.north]],
            {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 15,
              duration: 0 // No animation on initial load
            }
          );
        }
      }
    } catch (error) {
      console.error('Error in handleMapLoad:', error);
      setMapError(error.message);
      setIsLoading(false);
    }
  }, [bounds, locations.length]);

  const handleLocationSelect = useCallback((location) => {
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  const handlePhotoClick = useCallback((photo) => {
    // Find the index of this photo in the album
    const photoIndex = album?.photos?.findIndex(p => p.id === photo.id);
    if (photoIndex !== -1) {
      openLightbox({ ...photo, index: photoIndex });
    }
  }, [album?.photos, openLightbox]);

  const handleFilterByLocation = useCallback((location) => {
    setFilteredLocation(location);
  }, []);

  const handleViewAllPhotos = useCallback((location) => {
    // Open lightbox with first photo from this location
    if (location.photos?.length > 0) {
      handlePhotoClick(location.photos[0]);
    }
  }, [handlePhotoClick]);

  const clearLocationFilter = useCallback(() => {
    setFilteredLocation(null);
  }, []);

  const handleAutoFit = useCallback(() => {
    if (bounds && locations.length > 0 && mapRef.current) {
      const map = mapRef.current.getMap();
      if (map && map.fitBounds) {
        map.fitBounds(
          [[bounds.west, bounds.south], [bounds.east, bounds.north]],
          {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
            duration: 1000
          }
        );
      }
    }
  }, [bounds, locations.length]);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
    // Prevent body scroll when fullscreen
    if (!isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isFullScreen]);

  const flyToLocation = useCallback((location) => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        map.flyTo({
          center: [location.lng, location.lat],
          zoom: 13,
          duration: 1500,
          essential: true
        });
      }
      // Also filter to this location
      setFilteredLocation(location);
    }
  }, []);

  const toggleLocationList = useCallback(() => {
    setShowLocationList(prev => !prev);
  }, []);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Only commit state when the rounded zoom or cluster bucket actually
  // changes — conditional setState keeps pan/zoom frames render-free.
  const handleMapMove = useCallback((evt) => {
    if (!evt?.viewState) return;
    const { zoom } = evt.viewState;
    const rounded = Math.round(zoom);
    setDisplayZoom(prev => (prev === rounded ? prev : rounded));
    const threshold = getClusterThreshold(zoom);
    setClusterRadius(prev => (prev === threshold ? prev : threshold));
  }, []);

  // Handle map container clicks to close popups
  const handleMapClick = useCallback(() => {
    try {
      // Check if the cluster component has a method to close popups
      if (clusterRef.current && clusterRef.current.closePopup) {
        clusterRef.current.closePopup();
      }
    } catch (error) {
      console.error('Error in handleMapClick:', error);
    }
  }, []);

  // Handle map errors
  const handleMapError = useCallback((error) => {
    console.error('Map error:', error);
    setMapError(error.message || 'An error occurred with the map');
  }, []);

  if (!album?.photos?.length) {
    return (
      <div className="border border-ink/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-ink/10 flex justify-between items-center">
          <h2 className="font-display text-2xl tracking-tight">Photo locations</h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">0 locations</span>
        </div>
        <div className="h-96 flex items-center justify-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Nothing to place on the map</p>
        </div>
      </div>
    );
  }

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className="border border-ink/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-ink/10">
          <h2 className="font-display text-2xl tracking-tight">Photo locations</h2>
        </div>
        <div className="h-96 flex flex-col items-center justify-center text-center px-6">
          <p className="font-display text-xl text-ink/70 mb-2">The map failed to load</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted mb-6">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[11px] uppercase tracking-[0.2em] text-ink/70 border-b border-ink/20 pb-1
                       hover:border-accent hover:text-ink transition-colors duration-300"
          >
            Reload the page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden transition-all duration-300 ${
      isFullScreen ? 'fixed inset-0 z-50 bg-paper' : 'border border-ink/10'
    }`}>
      <div className="px-4 sm:px-6 py-5 border-b border-ink/10 bg-paper">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl tracking-tight">Photo locations</h2>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-1.5">
              {locations.length} locations · {album?.photos?.length || 0} photographs
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={toggleLocationList}
              className={`p-2 border transition-colors duration-200 ${
                showLocationList
                  ? 'text-accent border-accent/40'
                  : 'text-ink/50 border-ink/10 hover:text-ink'
              }`}
              title="Toggle location list"
            >
              <Navigation className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 text-ink/50 border border-ink/10 hover:text-ink transition-colors duration-200"
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-x-5 gap-y-2 items-center flex-wrap">
          {/* Map Style Selector */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="bg-transparent text-[11px] uppercase tracking-[0.18em] text-ink/70 border-0 border-b border-ink/20
                       pb-1 pr-6 focus:outline-none focus:border-accent cursor-pointer hover:text-ink transition-colors"
          >
            {MAP_STYLES.map(style => (
              <option key={style.id} value={style.style}>{style.label}</option>
            ))}
          </select>

          <button
            onClick={handleAutoFit}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted
                       pb-1 border-b border-transparent hover:text-ink transition-colors duration-200"
            title="Fit all locations"
          >
            <Target className="h-3 w-3" />
            <span className="hidden sm:inline">Fit all</span>
          </button>

          <span className="text-[11px] uppercase tracking-[0.18em] text-muted tabular-nums">
            Zoom {displayZoom}
          </span>

          {filteredLocation && (
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent">
              <Filter className="h-3 w-3" />
              <span>{filteredLocation.name}</span>
              <button
                onClick={clearLocationFilter}
                className="text-ink/40 hover:text-ink transition-colors"
                aria-label="Clear location filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Location List Sidebar */}
        {showLocationList && locations.length > 0 && (
          <div className="w-64 sm:w-80 flex-shrink-0 border-r border-ink/10 overflow-y-auto bg-paper"
               style={{ maxHeight: isFullScreen ? 'calc(100vh - 180px)' : '500px' }}>
            <div className="px-4 py-3 border-b border-ink/10 sticky top-0 bg-paper">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
                Locations ({locations.length})
              </h3>
            </div>
            <div className="divide-y divide-ink/10">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => flyToLocation(loc)}
                  className={`w-full text-left px-4 py-3 transition-colors duration-200 ${
                    filteredLocation?.id === loc.id
                      ? 'bg-ink/5'
                      : 'hover:bg-ink/5'
                  }`}
                >
                  <div className={`font-display text-base tracking-tight ${
                    filteredLocation?.id === loc.id ? 'text-accent' : 'text-ink'
                  }`}>{loc.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted mt-0.5">
                    {loc.photos.length} {loc.photos.length === 1 ? 'photograph' : 'photographs'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className={`relative flex-1 ${
          isFullScreen ? 'h-[calc(100vh-180px)]' : 'h-[500px] sm:h-[600px] lg:h-[700px]'
        }`}>
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-paper">
              <div className="h-full w-full relative">
                {/* Animated loading skeleton */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-1 animate-pulse">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="bg-ink/5" />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display text-xl text-ink/70 mb-1">Drawing the map…</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">One moment</p>
                </div>
              </div>
            </div>
          )}

          {!mapError && locations.length > 0 && (
            <MapGL
              ref={mapRef}
              initialViewState={INITIAL_VIEW_STATE}
              style={{ width: '100%', height: '100%' }}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
              onMove={handleMapMove}
              onLoad={handleMapLoad}
              onClick={handleMapClick}
              onError={handleMapError}
              attributionControl={false}
              dragRotate={false}
              touchPitch={false}
              maxZoom={20}
              minZoom={0}
              maxPitch={0}
              maxBounds={[[-180, -85], [180, 85]]}
            >
              <EnhancedMarkerCluster
                ref={clusterRef}
                locations={locations}
                clusterRadius={clusterRadius}
                onLocationSelect={handleLocationSelect}
                onPhotoClick={handlePhotoClick}
                onFilterByLocation={handleFilterByLocation}
                onViewAllPhotos={handleViewAllPhotos}
                showFilters={!filteredLocation}
                mapRef={mapRef}
              />
            </MapGL>
          )}
        </div>
      </div>
    </div>
  );
}