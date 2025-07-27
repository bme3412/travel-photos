'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Map as MapIcon, Loader2, Route, Filter, X, Target } from 'lucide-react';
import { useLocationData, useMapBounds } from '../utils/useLocationData';
import { EnhancedMarkerCluster } from './EnhancedMarkerCluster';
import { RouteVisualization } from './RouteVisualization';
import usePhotoStore from '../store/usePhotoStore';
import { useSmartZoom } from '../utils/smartZoom';

// Dynamically import react-map-gl
let MapComponent = null;
let mapboxCSSLoaded = false;

const loadMapboxResources = async () => {
  // Load CSS if not already loaded
  if (!mapboxCSSLoaded && typeof window !== 'undefined') {
    const cssLink = document.createElement('link');
    cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    cssLink.rel = 'stylesheet';
    document.head.appendChild(cssLink);
    mapboxCSSLoaded = true;
  }

  // Dynamically import react-map-gl
  if (!MapComponent) {
    const reactMapGL = await import('react-map-gl');
    MapComponent = reactMapGL.default;
  }

  return MapComponent;
};

export default function AlbumMap({ album, onLocationSelect }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [MapGL, setMapGL] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 2
  });
  const [showRoutes, setShowRoutes] = useState(false);
  const [filteredLocation, setFilteredLocation] = useState(null);
  
  // Refs for cluster component and map
  const clusterRef = useRef(null);
  const mapRef = useRef(null);
  
  // Photo store for lightbox integration
  const { openLightbox } = usePhotoStore();
  
  // Use memoized location processing
  const allLocations = useLocationData(album?.photos);
  const locations = useMemo(() => 
    filteredLocation 
      ? allLocations.filter(loc => loc.id === filteredLocation.id)
      : allLocations,
    [allLocations, filteredLocation]
  );
  const bounds = useMapBounds(locations);
  
  // Smart zoom functionality
  const { adjustZoom, isOptimalZoom } = useSmartZoom(locations, viewport, setViewport);

  // Load Mapbox resources when component mounts
  useEffect(() => {
    const loadMap = async () => {
      try {
        const Map = await loadMapboxResources();
        setMapGL(() => Map);
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load map resources:', error);
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  // Initialize map with proper bounds when locations are available
  const handleMapLoad = useCallback(() => {
    setIsLoading(false);
    
    // Fit to bounds if we have locations
    if (bounds && locations.length > 0) {
      const newViewport = {
        latitude: (bounds.north + bounds.south) / 2,
        longitude: (bounds.east + bounds.west) / 2,
        zoom: Math.min(12, 10 - Math.log2(Math.max(bounds.east - bounds.west, bounds.north - bounds.south)))
      };
      setViewport(newViewport);
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

  const toggleRoutes = useCallback(() => {
    setShowRoutes(prev => !prev);
  }, []);

  const handleAutoFit = useCallback(() => {
    adjustZoom(true);
  }, [adjustZoom]);

  // Memoize map move handler
  const handleMapMove = useCallback((evt) => {
    setViewport(evt.viewState);
  }, []);

  // Handle map container clicks to close popups
  const handleMapClick = useCallback(() => {
    // Check if the cluster component has a method to close popups
    if (clusterRef.current && clusterRef.current.closePopup) {
      clusterRef.current.closePopup();
    }
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

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Photo Locations</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapIcon className="h-4 w-4" />
            <span>{locations.length} locations • {album?.photos?.length || 0} photos</span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={toggleRoutes}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              showRoutes 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
            }`}
          >
            <Route className="h-3 w-3" />
            Routes
          </button>
          
          {!isOptimalZoom && (
            <button
              onClick={handleAutoFit}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Target className="h-3 w-3" />
              Auto Fit
            </button>
          )}
          
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            Zoom: {Math.round(viewport.zoom)}
          </div>
          
          {filteredLocation && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm bg-teal-50 border border-teal-200 rounded-lg">
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

      <div className="relative h-96">
        {(isLoading || !mapLoaded) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-gray-600">
              {!mapLoaded ? 'Loading map resources...' : 'Loading map...'}
            </p>
          </div>
        )}

        {mapLoaded && MapGL && locations.length > 0 && (
          <MapGL
            ref={mapRef}
            {...viewport}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            onMove={handleMapMove}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
            attributionControl={false}
            dragRotate={false}
            touchPitch={false}
          >
            <RouteVisualization 
              locations={allLocations}
              showRoutes={showRoutes}
            />
            <EnhancedMarkerCluster
              ref={clusterRef}
              locations={locations}
              zoom={viewport.zoom}
              onLocationSelect={handleLocationSelect}
              onPhotoClick={handlePhotoClick}
              onFilterByLocation={handleFilterByLocation}
              onViewAllPhotos={handleViewAllPhotos}
              showFilters={!filteredLocation}
              mapRef={mapRef.current}
              viewport={viewport}
            />
          </MapGL>
        )}
      </div>
    </div>
  );
}