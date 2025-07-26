// Centralized Mapbox loader with caching
let mapboxglInstance = null;
let loadingPromise = null;
let cssLoaded = false;

const loadMapboxCSS = () => {
  if (cssLoaded) return;
  
  const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
  if (existingLink) {
    cssLoaded = true;
    return;
  }

  const link = document.createElement('link');
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
  link.rel = 'stylesheet';
  link.onload = () => { cssLoaded = true; };
  document.head.appendChild(link);
};

export const loadMapbox = async () => {
  // Return cached instance if available
  if (mapboxglInstance) {
    return mapboxglInstance;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Create new loading promise
  loadingPromise = (async () => {
    try {
      // Load CSS first
      loadMapboxCSS();
      
      // Dynamically import Mapbox GL
      const mapboxModule = await import('mapbox-gl');
      mapboxglInstance = mapboxModule.default;
      
      // Set access token if available
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (token) {
        mapboxglInstance.accessToken = token;
      }
      
      return mapboxglInstance;
    } catch (error) {
      // Reset promises on error so retry is possible
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
};

export const getMapboxInstance = () => mapboxglInstance;

// Cleanup utility
export const cleanupMapbox = () => {
  const cssLink = document.querySelector('link[href*="mapbox-gl.css"]');
  if (cssLink) {
    cssLink.remove();
    cssLoaded = false;
  }
}; 