import React, { useRef, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-map-gl';
import Link from 'next/link';
import Image from 'next/image';
import { CircleDot, MapPin, ExternalLink, Camera, Image as ImageIcon } from 'lucide-react';
import { getSmartPopupPosition, getPopupClasses, getPopupStyles } from '../utils/smartPopupPosition';
import { transformToCloudFront } from '../utils/imageUtils';

const EnhancedDestinationPopup = ({ destination, onMouseEnter, onMouseLeave, popupStyle, onOpenSidePanel }) => {
  const { name, country, description, photos, photoCount } = destination;
  
  // Get up to 3 photos for preview
  const previewPhotos = photos?.slice(0, 3) || [];

  return (
    <div 
      className={getPopupClasses()}
      style={{
        ...popupStyle,
        pointerEvents: 'auto'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with gradient background */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-xl leading-tight pr-3">
            {name}
          </h3>
          {photoCount > 0 && photos && photos.length > 0 && (
            <button
              onClick={() => onOpenSidePanel({ ...destination, name, photos })}
              className="group p-2.5 hover:bg-white/70 rounded-xl transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md transform hover:scale-105"
              title={`View ${photoCount} photos in side panel`}
            >
              <Camera className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/70 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-500" />
            </div>
            <span className="font-medium">{country}</span>
          </div>
          {photoCount > 0 && photos && photos.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100/70 rounded-lg">
                <Camera className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium text-blue-700">{photoCount} photos</span>
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            {description}
          </p>
        )}
      </div>

      {/* Photo Preview Section */}
      {previewPhotos.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <ImageIcon className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Photo Preview</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {previewPhotos.map((photo, index) => (
              <div
                key={photo.id || index}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg group"
                onClick={() => onOpenSidePanel({ ...destination, name, photos })}
              >
                <Image
                  src={transformToCloudFront(photo.url)}
                  alt={photo.caption || `${name} photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="120px"
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100" />
                </div>
                
                {/* Photo counter for first image */}
                {index === 0 && photoCount > 3 && (
                  <div className="absolute bottom-1 right-1 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-md backdrop-blur-sm">
                    +{photoCount - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions with enhanced styling */}
      <div className="p-5 bg-gradient-to-br from-gray-50 to-white">
        <Link 
          href={`/albums`}
          className="group flex items-center justify-center gap-3 w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
          View Albums
        </Link>
      </div>
    </div>
  );
};

const CustomDestinationMarker = ({ onClick, onMouseEnter, onMouseLeave, isHovered, isBlocked }) => (
  <div 
    className="relative cursor-pointer group marker-hover-area"
    style={{
      pointerEvents: isBlocked ? 'none' : 'auto',
      zIndex: isHovered ? 65 : 50
    }}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {/* Simple, clean marker */}
    <div className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-out ${
      isHovered ? 'scale-110' : 'hover:scale-105'
    } border-2 border-white bg-indigo-600`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <CircleDot className="h-3 w-3 text-white" />
      </div>
    </div>
  </div>
);

export const EnhancedDestinationMarkers = ({ 
  destinations, 
  mapLoaded, 
  hoveredDestination, 
  setHoveredDestination,
  onOpenSidePanel,
  mapRef,
  viewport
}) => {
  const timeoutRef = useRef(null);
  const enterTimeoutRef = useRef(null);
  const activeMarkerRef = useRef(null);
  const popupStateRef = useRef({ isOverMarker: false, isOverPopup: false });
  const lastUpdateRef = useRef(0);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback((delay = 250) => {
    clearTimeouts();
    timeoutRef.current = setTimeout(() => {
      if (!popupStateRef.current.isOverMarker && !popupStateRef.current.isOverPopup) {
        setHoveredDestination(null);
        activeMarkerRef.current = null;
      }
    }, delay);
  }, [clearTimeouts, setHoveredDestination]);

  const handleMarkerMouseEnter = useCallback((dest) => {
    const now = Date.now();
    
    // Prevent rapid fire events (debounce with minimum interval)
    if (now - lastUpdateRef.current < 50) {
      return;
    }
    lastUpdateRef.current = now;
    
    // Prevent interference if another popup is already active
    if (activeMarkerRef.current && activeMarkerRef.current !== dest.id) {
      return;
    }
    
    clearTimeouts();
    popupStateRef.current.isOverMarker = true;
    activeMarkerRef.current = dest.id;
    
    // Longer delay to prevent rapid flickering and ensure stability
    enterTimeoutRef.current = setTimeout(() => {
      if (popupStateRef.current.isOverMarker && activeMarkerRef.current === dest.id) {
        setHoveredDestination(dest);
      }
    }, 150); // Increased from 100ms for more stability
  }, [clearTimeouts, setHoveredDestination]);

  const handleMarkerMouseLeave = useCallback(() => {
    popupStateRef.current.isOverMarker = false;
    scheduleHide(400); // Longer delay to allow moving to popup
  }, [scheduleHide]);

  const handlePopupMouseEnter = useCallback(() => {
    clearTimeouts();
    popupStateRef.current.isOverPopup = true;
  }, [clearTimeouts]);

  const handlePopupMouseLeave = useCallback(() => {
    popupStateRef.current.isOverPopup = false;
    scheduleHide(200);
  }, [scheduleHide]);

  // Reset state when hovered destination changes externally
  useEffect(() => {
    if (!hoveredDestination) {
      activeMarkerRef.current = null;
      popupStateRef.current = { isOverMarker: false, isOverPopup: false };
    }
  }, [hoveredDestination]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  if (!mapLoaded || !destinations?.length) return null;

  const hasActivePopup = !!hoveredDestination;

  return (
    <>
      {destinations.map((dest) => {
        const isCurrentlyHovered = hoveredDestination?.id === dest.id;
        const isBlocked = hasActivePopup && !isCurrentlyHovered;
        
        // Calculate smart positioning for this destination's popup (memoized internally)
        const smartPosition = getSmartPopupPosition(
          dest.latitude, 
          dest.longitude, 
          viewport, 
          mapRef
        );

        return (
          <React.Fragment key={dest.id}>
            <Marker
              latitude={dest.latitude}
              longitude={dest.longitude}
              anchor="center"
            >
              <CustomDestinationMarker
                isHovered={isCurrentlyHovered}
                isBlocked={isBlocked}
                onMouseEnter={() => handleMarkerMouseEnter(dest)}
                onMouseLeave={handleMarkerMouseLeave}
                onClick={() => {
                  // Optional: Add click behavior for destinations
                  console.log('Clicked destination:', dest.name);
                }}
              />
            </Marker>
            {isCurrentlyHovered && (
              <Popup
                latitude={dest.latitude}
                longitude={dest.longitude}
                anchor={smartPosition.anchor}
                closeButton={false}
                closeOnClick={false}
                className="destination-popup"
                offset={smartPosition.offset}
                focusAfterOpen={false}
                style={{ zIndex: 70 }}
              >
                <EnhancedDestinationPopup 
                  destination={hoveredDestination}
                  onMouseEnter={handlePopupMouseEnter}
                  onMouseLeave={handlePopupMouseLeave}
                  onOpenSidePanel={onOpenSidePanel}
                  popupStyle={getPopupStyles(smartPosition.maxHeight, 'destination')}
                />
              </Popup>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}; 