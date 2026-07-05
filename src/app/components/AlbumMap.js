'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import MapGL from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map as MapIcon, Loader2, Filter, X, Target, Maximize2, Minimize2, Navigation } from 'lucide-react';
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

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">Photo Locations</h2>
        </div>
        <div className="h-96 flex flex-col items-center justify-center text-gray-500">
          <div className="text-red-500 mb-4">⚠️ Map failed to load</div>
          <div className="text-sm text-gray-600 mb-4">{mapError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
      isFullScreen ? 'fixed inset-0 z-50 rounded-none' : ''
    }`}>
      <div className="p-4 sm:p-6 border-b bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Photo Locations</h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1">
              <MapIcon className="h-4 w-4" />
              <span>{locations.length} locations • {album?.photos?.length || 0} photos</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleLocationList}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                showLocationList 
                  ? 'text-teal-600 bg-teal-50' 
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
              }`}
              title="Toggle location list"
            >
              <Navigation className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Map Style Selector */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {MAP_STYLES.map(style => (
              <option key={style.id} value={style.style}>{style.label}</option>
            ))}
          </select>
          
          <button
            onClick={handleAutoFit}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Fit all locations"
          >
            <Target className="h-3 w-3" />
            <span className="hidden sm:inline">Fit All</span>
          </button>
          
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            Zoom: {displayZoom}
          </div>
          
          {filteredLocation && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm bg-teal-50 border border-teal-200 rounded-lg">
              <Filter className="h-3 w-3 text-teal-600" />
              <span className="text-teal-700">{filteredLocation.name}</span>
              <button 
                onClick={clearLocationFilter}
                className="text-teal-600 hover:text-teal-800"
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
          <div className="w-64 sm:w-80 flex-shrink-0 border-r overflow-y-auto bg-gray-50" 
               style={{ maxHeight: isFullScreen ? 'calc(100vh - 180px)' : '500px' }}>
            <div className="p-3 bg-white border-b sticky top-0">
              <h3 className="font-semibold text-sm text-gray-900">
                Locations ({locations.length})
              </h3>
            </div>
            <div className="p-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => flyToLocation(loc)}
                  className={`w-full text-left p-3 mb-2 rounded-lg transition-all duration-200 ${
                    filteredLocation?.id === loc.id
                      ? 'bg-teal-100 border border-teal-300'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{loc.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {loc.photos.length} {loc.photos.length === 1 ? 'photo' : 'photos'}
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
            <div className="absolute inset-0 z-10 bg-gray-100">
              <div className="h-full w-full relative">
                {/* Animated loading skeleton */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-1 animate-pulse">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Loading map...
                  </p>
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