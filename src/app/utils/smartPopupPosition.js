/**
 * Smart popup positioning utility that automatically adjusts anchor points
 * and offsets based on marker position relative to viewport boundaries
 */

// Cache for popup position calculations to prevent flickering
const positionCache = new Map();
const cacheKey = (lat, lng, viewport) => 
  `${lat.toFixed(4)}-${lng.toFixed(4)}-${viewport.zoom.toFixed(2)}-${Math.round(viewport.latitude * 100)}-${Math.round(viewport.longitude * 100)}`;

/**
 * Calculate the best popup position for a marker
 * @param {number} latitude - Marker latitude
 * @param {number} longitude - Marker longitude  
 * @param {object} viewport - Current map viewport {latitude, longitude, zoom}
 * @param {object} mapRef - Reference to the map instance
 * @returns {object} - {anchor, offset, maxHeight}
 */
export const getSmartPopupPosition = (latitude, longitude, viewport, mapRef) => {
  if (!mapRef || !viewport) {
    // Fallback to default positioning
    return {
      anchor: 'bottom',
      offset: 25,
      maxHeight: '400px'
    };
  }

  // Check cache first to prevent rapid recalculations
  const key = cacheKey(latitude, longitude, viewport);
  if (positionCache.has(key)) {
    return positionCache.get(key);
  }

  try {
    // Get the map container dimensions
    const mapContainer = mapRef.getContainer();
    if (!mapContainer) {
      return {
        anchor: 'bottom',
        offset: 25,
        maxHeight: '400px'
      };
    }
    
    const containerRect = mapContainer.getBoundingClientRect();
    
    // Project the marker's geographic coordinates to screen pixels
    const markerPixels = mapRef.project([longitude, latitude]);
    
    // Account for header height (approximately 60px based on new compact header)
    const HEADER_HEIGHT = 70; // Add some buffer
    const SAFE_MARGIN = 20; // Additional safe margin
    
    // Calculate relative position within the container, accounting for header
    const effectiveHeight = containerRect.height - HEADER_HEIGHT;
    const relativeX = markerPixels.x / containerRect.width;
    const relativeY = (markerPixels.y - HEADER_HEIGHT) / effectiveHeight;
    
    // Define positioning thresholds with some tolerance to prevent rapid switching
    const EDGE_THRESHOLD = 0.3; // Increased from 0.25 to reduce sensitivity
    
    let anchor = 'bottom';
    let offsetX = 0;
    let offsetY = 25;
    let maxHeight = '400px';
    
    // Determine best anchor based on position with hysteresis
    const isNearTop = relativeY < EDGE_THRESHOLD;
    const isNearBottom = relativeY > (1 - EDGE_THRESHOLD);
    const isNearLeft = relativeX < EDGE_THRESHOLD;
    const isNearRight = relativeX > (1 - EDGE_THRESHOLD);
    
    // Corner cases first (most restrictive)
    if (isNearTop && isNearLeft) {
      anchor = 'top-right';
      offsetX = 20;
      offsetY = Math.max(25, HEADER_HEIGHT - markerPixels.y + SAFE_MARGIN);
    } else if (isNearTop && isNearRight) {
      anchor = 'top-left';
      offsetX = -20;
      offsetY = Math.max(25, HEADER_HEIGHT - markerPixels.y + SAFE_MARGIN);
    } else if (isNearBottom && isNearLeft) {
      anchor = 'bottom-right';
      offsetX = 20;
      offsetY = -20;
    } else if (isNearBottom && isNearRight) {
      anchor = 'bottom-left';
      offsetX = -20;
      offsetY = -20;
    }
    // Edge cases - prioritize avoiding header
    else if (isNearTop || markerPixels.y < HEADER_HEIGHT + 100) {
      anchor = 'top';
      offsetY = Math.max(30, HEADER_HEIGHT - markerPixels.y + SAFE_MARGIN);
    } else if (isNearBottom) {
      anchor = 'bottom';
      offsetY = -25;
    } else if (isNearLeft) {
      anchor = 'left';
      offsetX = 25;
    } else if (isNearRight) {
      anchor = 'right';
      offsetX = -25;
    }
    // Default center positioning - check if too close to header
    else if (markerPixels.y < HEADER_HEIGHT + 80) {
      anchor = 'top';
      offsetY = Math.max(30, HEADER_HEIGHT - markerPixels.y + SAFE_MARGIN);
    } else {
      anchor = 'bottom';
      offsetY = 25;
    }
    
    // Adjust max height based on available space and header constraints
    if (isNearTop || markerPixels.y < HEADER_HEIGHT + 100) {
      // Reduce max height when near header area
      const availableHeight = effectiveHeight - Math.max(0, HEADER_HEIGHT - markerPixels.y) - 60;
      maxHeight = `${Math.min(400, Math.max(250, availableHeight))}px`;
    } else if (isNearBottom) {
      // Reduce max height when near bottom
      const availableHeight = (containerRect.height * relativeY) - 40;
      maxHeight = `${Math.min(400, Math.max(250, availableHeight))}px`;
    }
    
    const result = {
      anchor,
      offset: [offsetX, offsetY],
      maxHeight
    };

    // Cache the result but limit cache size to prevent memory leaks
    if (positionCache.size > 100) {
      const firstKey = positionCache.keys().next().value;
      positionCache.delete(firstKey);
    }
    positionCache.set(key, result);
    
    return result;
  } catch (error) {
    console.warn('Error calculating smart popup position:', error);
    // Fallback to safe default
    return {
      anchor: 'bottom',
      offset: 25,
      maxHeight: '400px'
    };
  }
};

/**
 * Clear the position cache (useful for memory management)
 */
export const clearPositionCache = () => {
  positionCache.clear();
};

/**
 * Get consistent popup classes for all popup types
 * @returns {string} - CSS classes
 */
export const getPopupClasses = () => {
  return 'popup-content-wrapper popup-hover-stable';
};

/**
 * Get standardized popup styles for different content types
 * @param {string} maxHeight - Maximum height constraint
 * @param {string} type - Popup type ('destination', 'location', 'cluster')
 * @returns {object} - Style object
 */
export const getPopupStyles = (maxHeight, type = 'destination') => {
  // Base styles for all popups
  const baseStyles = {
    maxHeight,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    border: 'none',
    // Prevent flickering during animations
    willChange: 'auto',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden'
  };

  // Type-specific dimensions
  const typeConfig = {
    destination: {
      width: '380px',
      minWidth: '320px',
      maxWidth: '420px'
    },
    location: {
      width: '360px', 
      minWidth: '320px',
      maxWidth: '400px'
    },
    cluster: {
      width: '340px',
      minWidth: '300px',
      maxWidth: '360px'
    }
  };

  const config = typeConfig[type] || typeConfig.destination;

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  if (isMobile) {
    return {
      ...baseStyles,
      width: '90vw',
      maxWidth: '350px',
      minWidth: '280px'
    };
  }

  return {
    ...baseStyles,
    ...config
  };
}; 