import { useMemo, useCallback, useEffect, useRef } from 'react';

// Calculate optimal zoom level based on location spread
export const calculateOptimalZoom = (locations) => {
  if (!locations?.length) return 2;
  
  if (locations.length === 1) return 10;
  
  // Calculate bounding box
  const lats = locations.map(loc => loc.coordinates.lat);
  const lngs = locations.map(loc => loc.coordinates.lng);
  
  const latSpread = Math.max(...lats) - Math.min(...lats);
  const lngSpread = Math.max(...lngs) - Math.min(...lngs);
  const maxSpread = Math.max(latSpread, lngSpread);
  
  // Smart zoom calculation
  if (maxSpread > 50) return 2;      // Global view
  if (maxSpread > 20) return 3;      // Continental view
  if (maxSpread > 10) return 4;      // Multi-country view
  if (maxSpread > 5) return 5;       // Country view
  if (maxSpread > 2) return 6;       // Regional view
  if (maxSpread > 1) return 8;       // City view
  if (maxSpread > 0.1) return 10;    // District view
  return 12;                         // Local view
};

// Auto-adjust zoom based on content changes
export const useSmartZoom = (locations, viewport, setViewport) => {
  const lastLocationCount = useRef(0);
  const lastAutoAdjustTime = useRef(0);
  const isUserInteracting = useRef(false);
  
  const optimalZoom = useMemo(() => calculateOptimalZoom(locations), [locations]);
  
  const adjustZoom = useCallback((animated = true) => {
    if (!locations?.length) return;
    
    const lats = locations.map(loc => loc.coordinates.lat);
    const lngs = locations.map(loc => loc.coordinates.lng);
    
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    
    const newViewport = {
      ...viewport,
      latitude: centerLat,
      longitude: centerLng,
      zoom: optimalZoom,
      transitionDuration: animated ? 1000 : 0
    };
    
    setViewport(newViewport);
    lastAutoAdjustTime.current = Date.now();
  }, [locations, optimalZoom, viewport, setViewport]);
  
  // Track user interaction to prevent auto-adjustments during manual navigation
  useEffect(() => {
    const handleUserInteraction = () => {
      isUserInteracting.current = true;
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 2000); // Reset after 2 seconds of no interaction
    };
    
    // Listen for various interaction events
    const events = ['mousedown', 'touchstart', 'wheel'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);
  
  // Auto-adjust when locations change significantly (but be smarter about it)
  useEffect(() => {
    const currentLocationCount = locations?.length || 0;
    const locationCountChanged = currentLocationCount !== lastLocationCount.current;
    const timeSinceLastAdjust = Date.now() - lastAutoAdjustTime.current;
    
    // Only auto-adjust if:
    // 1. Location count changed significantly
    // 2. User isn't currently interacting with the map
    // 3. Enough time has passed since last auto-adjustment (prevent rapid adjustments)
    // 4. The zoom difference is significant
    if (locationCountChanged && 
        !isUserInteracting.current && 
        timeSinceLastAdjust > 3000 && // 3 seconds minimum between auto-adjustments
        locations?.length > 0) {
      
      const currentZoomDiff = Math.abs(viewport.zoom - optimalZoom);
      
      // Only auto-adjust if the difference is very significant (more than 3 zoom levels)
      if (currentZoomDiff > 3) {
        const timer = setTimeout(() => {
          adjustZoom(true);
        }, 500); // Small delay to allow other effects to settle
        
        lastLocationCount.current = currentLocationCount;
        return () => clearTimeout(timer);
      }
    }
    
    lastLocationCount.current = currentLocationCount;
  }, [locations, optimalZoom, viewport.zoom, adjustZoom, isUserInteracting]);
  
  return {
    optimalZoom,
    adjustZoom,
    isOptimalZoom: Math.abs(viewport.zoom - optimalZoom) < 1.5 // More lenient threshold
  };
};

// Density-based clustering threshold
export const getClusterThreshold = (zoom) => {
  if (zoom < 3) return 100;   // Very aggressive clustering for world view
  if (zoom < 5) return 50;    // Aggressive clustering for continental view
  if (zoom < 7) return 25;    // Moderate clustering for country view
  if (zoom < 9) return 15;    // Light clustering for regional view
  if (zoom < 11) return 8;    // Minimal clustering for city view
  return 0;                   // No clustering for local view
};

// Smart bounds fitting
export const getSmartBounds = (locations, padding = 50) => {
  if (!locations?.length) return null;
  
  const lats = locations.map(loc => loc.coordinates.lat);
  const lngs = locations.map(loc => loc.coordinates.lng);
  
  const bounds = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
  
  // Add intelligent padding based on spread
  const latSpread = bounds.north - bounds.south;
  const lngSpread = bounds.east - bounds.west;
  const maxSpread = Math.max(latSpread, lngSpread);
  
  // Adaptive padding - smaller areas get more padding
  const adaptivePadding = maxSpread < 0.1 ? padding * 3 : 
                         maxSpread < 1 ? padding * 2 : 
                         padding;
  
  return {
    ...bounds,
    padding: adaptivePadding
  };
}; 