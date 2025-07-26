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
    
    // Account for header height (approximately 60px based on new compact header)
    const HEADER_HEIGHT = 70; // Add some buffer
    const SAFE_MARGIN = 20; // Additional safe margin
    
    // Calculate relative position within the container, accounting for header
    const effectiveHeight = containerRect.height - HEADER_HEIGHT;
    const relativeX = markerPixels.x / containerRect.width;
    const relativeY = (markerPixels.y - HEADER_HEIGHT) / effectiveHeight;
    
    // Define positioning thresholds
    const EDGE_THRESHOLD = 0.25; // 25% from edge
    
    let anchor = 'bottom';
    let offsetX = 0;
    let offsetY = 25;
    let maxHeight = '350px';
    
    // Determine best anchor based on position
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
      maxHeight = `${Math.min(350, Math.max(200, availableHeight))}px`;
    } else if (isNearBottom) {
      // Reduce max height when near bottom
      const availableHeight = (containerRect.height * relativeY) - 40;
      maxHeight = `${Math.min(350, Math.max(200, availableHeight))}px`;
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
      maxHeight: '350px'
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
  const positionClasses = 'relative z-[60]'; // Higher z-index to stay above header
  
  return `${baseClasses} ${animationClasses} ${scrollClasses} ${positionClasses}`;
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
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  zIndex: 60 // Ensure it stays above header
}); 