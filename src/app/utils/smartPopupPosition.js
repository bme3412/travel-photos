/**
 * Smart popup positioning utility that automatically adjusts anchor points
 * and offsets based on marker position relative to viewport boundaries
 */

/**
 * Calculate the best popup position for a marker
 * @param {number} latitude - Marker latitude
 * @param {number} longitude - Marker longitude  
 * @param {object} viewport - Current map viewport {latitude, longitude, zoom}
 * @param {object} mapRef - Reference to the map instance
 * @returns {object} - {anchor, offset, maxHeight}
 */
export const getSmartPopupPosition = (latitude, longitude, viewport, mapRef) => {
  if (!mapRef) {
    // Fallback to default positioning
    return {
      anchor: 'bottom',
      offset: 25,
      maxHeight: '400px'
    };
  }

  try {
    // Get the map container dimensions
    const mapContainer = mapRef.getContainer();
    const containerRect = mapContainer.getBoundingClientRect();
    
    // Project the marker's geographic coordinates to screen pixels
    const markerPixels = mapRef.project([longitude, latitude]);
    
    // Calculate relative position within the container (0-1)
    const relativeX = markerPixels.x / containerRect.width;
    const relativeY = markerPixels.y / containerRect.height;
    
    // Define positioning thresholds
    const EDGE_THRESHOLD = 0.25; // 25% from edge
    
    let anchor = 'bottom';
    let offsetX = 0;
    let offsetY = 25;
    let maxHeight = '400px';
    
    // Determine best anchor based on position
    const isNearTop = relativeY < EDGE_THRESHOLD;
    const isNearBottom = relativeY > (1 - EDGE_THRESHOLD);
    const isNearLeft = relativeX < EDGE_THRESHOLD;
    const isNearRight = relativeX > (1 - EDGE_THRESHOLD);
    
    // Corner cases first (most restrictive)
    if (isNearTop && isNearLeft) {
      anchor = 'top-right';
      offsetX = 20;
      offsetY = 20;
    } else if (isNearTop && isNearRight) {
      anchor = 'top-left';
      offsetX = -20;
      offsetY = 20;
    } else if (isNearBottom && isNearLeft) {
      anchor = 'bottom-right';
      offsetX = 20;
      offsetY = -20;
    } else if (isNearBottom && isNearRight) {
      anchor = 'bottom-left';
      offsetX = -20;
      offsetY = -20;
    }
    // Edge cases
    else if (isNearTop) {
      anchor = 'top';
      offsetY = 25;
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
    // Default center positioning
    else {
      anchor = 'bottom';
      offsetY = 25;
    }
    
    // Adjust max height based on available space
    if (isNearTop || isNearBottom) {
      // Reduce max height when near top/bottom edges
      const availableHeight = isNearTop 
        ? (containerRect.height * (1 - relativeY)) - 60
        : (containerRect.height * relativeY) - 60;
      maxHeight = `${Math.min(400, Math.max(200, availableHeight))}px`;
    }
    
    return {
      anchor,
      offset: [offsetX, offsetY],
      maxHeight
    };
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
 * Get viewport-aware popup classes for styling
 * @returns {string} - CSS classes
 */
export const getPopupClasses = () => {
  const baseClasses = 'bg-white rounded-2xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm';
  const animationClasses = 'animate-in fade-in-0 zoom-in-95 duration-300';
  const scrollClasses = 'overflow-y-auto';
  
  return `${baseClasses} ${animationClasses} ${scrollClasses}`;
};

/**
 * Get content wrapper styles for popups
 * @param {string} maxHeight - Maximum height constraint
 * @returns {object} - Style object
 */
export const getPopupStyles = (maxHeight) => ({
  maxHeight,
  minWidth: '300px',
  maxWidth: '420px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
}); 