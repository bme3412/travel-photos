import React, { useRef, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-map-gl';
import Image from 'next/image';
import { CircleDot, Camera } from 'lucide-react';
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
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-ink/10">
        <h3 className="font-display text-xl text-ink tracking-tight leading-tight pr-3">
          {name}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-2">
          {country}
          {photoCount > 0 && <> · {photoCount} photographs</>}
        </p>

        {description && (
          <p className="text-[13px] text-ink/75 leading-relaxed mt-3">
            {description}
          </p>
        )}
      </div>

      {/* Photo preview */}
      {previewPhotos.length > 0 && (
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {previewPhotos.map((photo, index) => (
              <div
                key={photo.id || index}
                className="relative aspect-square overflow-hidden cursor-pointer bg-ink/5 group"
                onClick={() => onOpenSidePanel({ ...destination, name, photos })}
              >
                <Image
                  src={transformToCloudFront(photo.url)}
                  alt={photo.caption || `${name} photo ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="120px"
                />

                {/* Photo counter for first image */}
                {index === 0 && photoCount > 3 && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-ink/70 text-paper text-[10px] tracking-[0.1em] backdrop-blur-sm">
                    +{photoCount - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {photoCount > 0 && photos && photos.length > 0 && (
        <div className="px-5 pb-5">
          <button
            onClick={() => onOpenSidePanel({ ...destination, name, photos })}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink/70
                       border-b border-ink/20 pb-1 hover:border-accent hover:text-ink transition-colors duration-300"
          >
            <Camera className="h-3.5 w-3.5" />
            View all photographs
          </button>
        </div>
      )}
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
    <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-out ${
      isHovered ? 'scale-110' : 'hover:scale-105'
    } border-2 border-paper bg-accent`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <CircleDot className="h-3 w-3 text-paper" />
      </div>
    </div>
  </div>
);

const EnhancedDestinationMarkersComponent = ({
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

  // Only the hovered destination's popup needs positioning — computing it per
  // marker forces a layout read (getBoundingClientRect) for every destination.
  const smartPosition = hoveredDestination
    ? getSmartPopupPosition(
        hoveredDestination.latitude,
        hoveredDestination.longitude,
        viewport,
        mapRef
      )
    : null;

  return (
    <>
      {destinations.map((dest) => {
        const isCurrentlyHovered = hoveredDestination?.id === dest.id;
        const isBlocked = hasActivePopup && !isCurrentlyHovered;

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
                onClick={() => handleMarkerMouseEnter(dest)}
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

export const EnhancedDestinationMarkers = React.memo(EnhancedDestinationMarkersComponent);
EnhancedDestinationMarkers.displayName = 'EnhancedDestinationMarkers';