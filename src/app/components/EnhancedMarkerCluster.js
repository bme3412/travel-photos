import React, { useMemo, useCallback, useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-map-gl';
import Image from 'next/image';
import { Eye, Filter, MapPin, Calendar, X, Camera } from 'lucide-react';
import { getClusterThreshold } from '../utils/smartZoom';
import { getSmartPopupPosition, getPopupStyles } from '../utils/smartPopupPosition';
import { transformToCloudFront } from '../utils/imageUtils';

// Optimized distance calculation with caching
const distanceCache = new Map();
const getDistance = (point1, point2, zoom) => {
  const key = `${point1.coordinates.lat},${point1.coordinates.lng}-${point2.coordinates.lat},${point2.coordinates.lng}-${zoom}`;
  if (distanceCache.has(key)) {
    return distanceCache.get(key);
  }
  
  const scale = Math.pow(2, zoom);
  const dx = (point1.coordinates.lng - point2.coordinates.lng) * scale;
  const dy = (point1.coordinates.lat - point2.coordinates.lat) * scale;
  const distance = Math.sqrt(dx * dx + dy * dy) * 111000;
  
  // Cache the result but limit cache size
  if (distanceCache.size > 1000) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  distanceCache.set(key, distance);
  
  return distance;
};

const PhotoPreview = ({ photo, onClick, className = "", size = "md" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: "w-16 h-16",
    md: "w-20 h-20", 
    lg: "w-28 h-28",
    xl: "w-36 h-36"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7"
  };
  
  return (
    <div 
      className={`relative cursor-pointer group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${sizes[size]} ${className}`}
      onClick={() => onClick(photo)}
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 animate-pulse flex items-center justify-center">
          <div className="p-2 bg-white/70 rounded-lg">
            <Camera className={`${iconSizes[size]} text-gray-500`} />
          </div>
        </div>
      )}
      
      {!imageError && (
        <Image
          src={transformToCloudFront(photo.url)}
          alt={photo.caption || 'Photo'}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="140px"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
      
      {imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="p-2 bg-white/80 rounded-lg">
            <MapPin className={`${iconSizes[size]} text-gray-400`} />
          </div>
        </div>
      )}
      
      {/* Enhanced hover overlay */}
      {imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-2 bg-white/90 rounded-xl transform scale-75 group-hover:scale-100 transition-all duration-300">
              <Eye className="h-5 w-5 text-gray-700" />
            </div>
          </div>
          
          {photo.caption && (
            <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 rounded-lg backdrop-blur-sm">
              <div className="text-xs text-white font-medium line-clamp-2 leading-tight">
                {photo.caption}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced photo indicator */}
      <div className="absolute top-2 right-2 p-1 bg-black/30 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
        <Camera className="h-3 w-3 text-white" />
      </div>
    </div>
  );
};

const LocationPopup = ({ 
  location, 
  onPhotoClick, 
  onFilterByLocation, 
  onViewAllPhotos,
  onOpenSidePanel,
  onClose,
  showFilters = true
}) => {
  const { name, photoCount, photos } = location;
  const sortedPhotos = useMemo(() => 
    photos?.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) || [],
    [photos]
  );

  return (
    <div 
      style={{
        ...getPopupStyles('400px', 'location'),
        pointerEvents: 'auto'
      }}
    >
      {/* Header with gradient background */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-xl leading-tight pr-3">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            {photoCount > 0 && (
              <button
                onClick={() => onOpenSidePanel(location)}
                className="group p-2.5 hover:bg-white/70 rounded-xl transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md transform hover:scale-105"
                title="View photos in side panel"
              >
                <Camera className="h-6 w-6 text-teal-600 group-hover:text-teal-700 transition-colors duration-300" />
              </button>
            )}
            <button
              onClick={onClose}
              className="group p-2.5 hover:bg-white/70 rounded-xl transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-300" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/70 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="font-semibold text-teal-700">{photoCount} photos</span>
          </div>
          {sortedPhotos[0]?.dateCreated && (
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100/70 rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="font-medium">{new Date(sortedPhotos[0].dateCreated).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Photo Grid with enhanced styling */}
      {sortedPhotos.length > 0 && (
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {sortedPhotos.slice(0, 6).map((photo) => (
              <PhotoPreview
                key={photo.id}
                photo={photo}
                onClick={onPhotoClick}
                size="lg"
              />
            ))}
          </div>
          
          {sortedPhotos.length > 6 && (
            <div 
              className="text-center py-3 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer border-t border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 rounded-lg"
              onClick={() => onViewAllPhotos(location)}
            >
              <span className="flex items-center justify-center gap-2">
                <Camera className="h-4 w-4" />
                +{sortedPhotos.length - 6} more photos
              </span>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Action Buttons */}
      {showFilters && (
        <div className="p-5 border-t border-gray-100 flex gap-3 bg-gradient-to-br from-gray-50 to-white">
          <button
            onClick={() => onFilterByLocation(location)}
            className="group flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <Filter className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            Filter
          </button>
          {sortedPhotos.length > 0 && (
            <button
              onClick={() => onViewAllPhotos(location)}
              className="group flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-teal-700 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] border border-teal-200"
            >
              <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              View All
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ClusterPopup = ({ cluster, onLocationSelect, onPhotoClick, onClose }) => {
  const { locations, totalPhotos } = cluster;
  const recentPhotos = useMemo(() => 
    locations
      .flatMap(loc => loc.photos || [])
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
      .slice(0, 6),
    [locations]
  );

  return (
    <div 
      style={{
        ...getPopupStyles('350px', 'cluster'),
        pointerEvents: 'auto'
      }}
    >
      {/* Header with close button */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-base">
            {locations.length} Locations
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-600 font-medium">{totalPhotos} photos</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Recent Photos Preview */}
        {recentPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {recentPhotos.map((photo) => (
              <PhotoPreview
                key={photo.id}
                photo={photo}
                onClick={onPhotoClick}
                size="md"
              />
            ))}
          </div>
        )}
      </div>

      {/* Location List */}
      <div className="max-h-48 overflow-y-auto">
        {locations.map((location, i) => (
          <div
            key={i}
            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors duration-200"
            onClick={() => onLocationSelect(location)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900 text-sm">{location.name}</div>
                <div className="text-xs text-gray-600">{location.photoCount} photos</div>
              </div>
              <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-teal-600">{location.photoCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClusterMarker = React.memo(({ cluster, isSelected, onClick, onMouseEnter, onMouseLeave, isBlocked }) => {
  const { locations, coordinates, totalPhotos } = cluster;
  
  const handleClick = useCallback((e) => {
    try {
      e.stopPropagation();
      onClick(locations.length === 1 ? locations[0] : cluster);
    } catch (error) {
      console.error('Error in marker click handler:', error);
    }
  }, [onClick, locations, cluster]);

  const handleMouseEnter = useCallback(() => {
    try {
      onMouseEnter?.(locations.length === 1 ? locations[0] : cluster);
    } catch (error) {
      console.error('Error in marker mouse enter handler:', error);
    }
  }, [onMouseEnter, locations, cluster]);

  const handleMouseLeave = useCallback(() => {
    try {
      onMouseLeave?.();
    } catch (error) {
      console.error('Error in marker mouse leave handler:', error);
    }
  }, [onMouseLeave]);
  
  // Safety check for valid coordinates
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    console.warn('Invalid coordinates for cluster:', cluster);
    return null;
  }
  
  if (locations.length === 1) {
    // Single location marker
    const location = locations[0];
    
    // Additional safety check for single location
    if (!location.coordinates || typeof location.coordinates.lat !== 'number' || typeof location.coordinates.lng !== 'number') {
      console.warn('Invalid coordinates for single location:', location);
      return null;
    }
    
    return (
      <Marker
        latitude={location.coordinates.lat}
        longitude={location.coordinates.lng}
        anchor="center"
      >
        <div 
          className={`cursor-pointer transition-transform duration-200 ease-out marker-hover-area ${
            isSelected ? 'scale-110' : 'hover:scale-105'
          }`}
          style={{
            pointerEvents: isBlocked ? 'none' : 'auto',
            zIndex: isSelected ? 75 : 55
          }}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative">
            {/* Simple, clean marker with selection state */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white border-2 border-white shadow-md ${
              isSelected ? 'bg-teal-700' : 'bg-teal-600'
            }`}>
              <span className="text-xs font-semibold">{location.photoCount}</span>
            </div>
            
            {/* Minimal photo indicator dot */}
            <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-white ${
              isSelected ? 'bg-orange-600' : 'bg-orange-500'
            }`}></div>
          </div>
        </div>
      </Marker>
    );
  }

  // Cluster marker
  return (
    <Marker
      latitude={coordinates.lat}
      longitude={coordinates.lng}
      anchor="center"
    >
      <div 
        className={`cursor-pointer transition-transform duration-200 ease-out marker-hover-area ${
          isSelected ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{
          pointerEvents: isBlocked ? 'none' : 'auto',
          zIndex: isSelected ? 75 : 55
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative">
          {/* Clean cluster marker with selection state */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white border-2 border-white shadow-md ${
            isSelected ? 'bg-indigo-700' : 'bg-indigo-600'
          }`}>
            <span className="text-sm font-semibold">{totalPhotos}</span>
          </div>
          
          {/* Simple location count */}
          <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white ${
            isSelected ? 'bg-orange-600' : 'bg-orange-500'
          }`}>
            <span className="text-xs text-white font-bold">{locations.length}</span>
          </div>
        </div>
      </div>
    </Marker>
  );
});

ClusterMarker.displayName = 'ClusterMarker';

// Optimized clustering algorithm - O(n log n) instead of O(n²)
const optimizedClustering = (locations, clusterRadius) => {
  if (clusterRadius === 0) {
    return locations.map(loc => ({ 
      locations: [loc], 
      coordinates: loc.coordinates, 
      totalPhotos: loc.photoCount 
    }));
  }

  // Filter out locations with invalid coordinates
  const validLocations = locations.filter(loc => 
    loc.coordinates && 
    typeof loc.coordinates.lat === 'number' && 
    typeof loc.coordinates.lng === 'number' &&
    !isNaN(loc.coordinates.lat) && 
    !isNaN(loc.coordinates.lng)
  );

  if (validLocations.length === 0) {
    return [];
  }

  // Sort locations by latitude for spatial optimization
  const sortedLocations = [...validLocations].sort((a, b) => a.coordinates.lat - b.coordinates.lat);
  const clustered = [];
  const processed = new Set();

  sortedLocations.forEach((location, index) => {
    if (processed.has(location.id)) return;

    const cluster = {
      locations: [location],
      coordinates: { ...location.coordinates },
      totalPhotos: location.photoCount
    };

    let latSum = location.coordinates.lat;
    let lngSum = location.coordinates.lng;

    // Only check nearby locations (spatial optimization)
    for (let i = index + 1; i < sortedLocations.length; i++) {
      const otherLocation = sortedLocations[i];
      
      // Early exit if we're too far in latitude
      if (otherLocation.coordinates.lat - location.coordinates.lat > clusterRadius / 111000) {
        break;
      }
      
      if (processed.has(otherLocation.id)) continue;

      const distance = getDistance(location, otherLocation, 10); // Use fixed zoom for clustering
      if (distance < clusterRadius) {
        cluster.locations.push(otherLocation);
        cluster.totalPhotos += otherLocation.photoCount;
        processed.add(otherLocation.id);
        
        latSum += otherLocation.coordinates.lat;
        lngSum += otherLocation.coordinates.lng;
      }
    }

    // Update cluster center using accumulated sums
    cluster.coordinates.lat = latSum / cluster.locations.length;
    cluster.coordinates.lng = lngSum / cluster.locations.length;

    processed.add(location.id);
    clustered.push(cluster);
  });

  return clustered;
};

export const EnhancedMarkerCluster = forwardRef(({ 
  locations, 
  zoom, 
  onLocationSelect, 
  onPhotoClick,
  onFilterByLocation,
  onViewAllPhotos,
  onOpenSidePanel,
  showFilters = true,
  mapRef,
  viewport
}, ref) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const timeoutRef = useRef(null);
  const activeMarkerRef = useRef(null);
  const popupStateRef = useRef({ isOverMarker: false, isOverPopup: false });

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback((delay = 250) => {
    clearTimeouts();
    timeoutRef.current = setTimeout(() => {
      if (!popupStateRef.current.isOverMarker && !popupStateRef.current.isOverPopup) {
        setSelectedLocation(null);
        activeMarkerRef.current = null;
      }
    }, delay);
  }, [clearTimeouts]);

  const handleMarkerClick = useCallback((location) => {
    clearTimeouts();
    setSelectedLocation(location);
    onLocationSelect?.(location);
  }, [onLocationSelect, clearTimeouts]);

  const handleMarkerMouseEnter = useCallback((location) => {
    const locationId = location.id || (location.locations ? `cluster-${location.locations[0]?.id}` : null);
    
    // Prevent interference if another popup is already active
    if (activeMarkerRef.current && activeMarkerRef.current !== locationId) {
      return;
    }
    
    clearTimeouts();
    popupStateRef.current.isOverMarker = true;
    activeMarkerRef.current = locationId;
    
    // Increased delay to prevent rapid flickering and ensure stability
    timeoutRef.current = setTimeout(() => {
      if (popupStateRef.current.isOverMarker && activeMarkerRef.current === locationId) {
        setSelectedLocation(location);
      }
    }, 150); // Increased from 100ms for more stability
  }, [clearTimeouts]);

  const handleMarkerMouseLeave = useCallback(() => {
    popupStateRef.current.isOverMarker = false;
    scheduleHide(400); // Increased delay to allow moving to popup
  }, [scheduleHide]);

  const handlePopupMouseEnter = useCallback(() => {
    clearTimeouts();
    popupStateRef.current.isOverPopup = true;
  }, [clearTimeouts]);

  const handlePopupMouseLeave = useCallback(() => {
    popupStateRef.current.isOverPopup = false;
    scheduleHide(200); // Increased delay for stability
  }, [scheduleHide]);

  const handleClosePopup = useCallback(() => {
    clearTimeouts();
    setSelectedLocation(null);
    activeMarkerRef.current = null;
    popupStateRef.current = { isOverMarker: false, isOverPopup: false };
  }, [clearTimeouts]);

  // Reset state when selected location changes externally
  useEffect(() => {
    if (!selectedLocation) {
      activeMarkerRef.current = null;
      popupStateRef.current = { isOverMarker: false, isOverPopup: false };
    }
  }, [selectedLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  const clusters = useMemo(() => {
    if (!locations?.length) return [];
    
    const clusterRadius = getClusterThreshold(zoom);
    return optimizedClustering(locations, clusterRadius);
  }, [locations, zoom]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    closePopup: handleClosePopup
  }), [handleClosePopup]);

  const hasActivePopup = !!selectedLocation;

  // Calculate smart positioning for the selected location/cluster
  const smartPosition = selectedLocation 
    ? getSmartPopupPosition(
        selectedLocation.coordinates?.lat || selectedLocation.locations?.[0]?.coordinates?.lat,
        selectedLocation.coordinates?.lng || selectedLocation.locations?.[0]?.coordinates?.lng,
        viewport,
        mapRef
      )
    : null;

  // Safety check for valid smart position
  const isValidPosition = smartPosition && 
    typeof smartPosition.anchor === 'string' && 
    typeof smartPosition.offset === 'object';

  return (
    <>
      {clusters.map((cluster, index) => {
        // Safety check for valid cluster coordinates
        if (!cluster.coordinates || typeof cluster.coordinates.lat !== 'number' || typeof cluster.coordinates.lng !== 'number') {
          console.warn('Skipping cluster with invalid coordinates:', cluster);
          return null;
        }
        
        const isCurrentlySelected = selectedLocation && (
          cluster.locations.length === 1 
            ? selectedLocation.id === cluster.locations[0].id
            : selectedLocation === cluster
        );
        const isBlocked = hasActivePopup && !isCurrentlySelected;
        
        return (
          <ClusterMarker
            key={`cluster-${index}-${cluster.locations[0]?.id}`}
            cluster={cluster}
            isSelected={isCurrentlySelected}
            isBlocked={isBlocked}
            onClick={handleMarkerClick}
            onMouseEnter={handleMarkerMouseEnter}
            onMouseLeave={handleMarkerMouseLeave}
          />
        );
      })}
      
      {selectedLocation && isValidPosition && (
        <Popup
          latitude={selectedLocation.coordinates?.lat || selectedLocation.locations?.[0]?.coordinates?.lat}
          longitude={selectedLocation.coordinates?.lng || selectedLocation.locations?.[0]?.coordinates?.lng}
          anchor={smartPosition.anchor}
          offset={smartPosition.offset}
          closeButton={false}
          closeOnClick={false}
          closeOnMove={false}
          className="location-popup"
          focusAfterOpen={false}
          style={{ zIndex: 80 }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
          >
            {selectedLocation.locations ? (
              <ClusterPopup
                cluster={selectedLocation}
                onLocationSelect={(location) => {
                  onLocationSelect(location);
                  handleClosePopup();
                }}
                onPhotoClick={onPhotoClick}
                onClose={handleClosePopup}
              />
            ) : (
              <LocationPopup
                location={selectedLocation}
                onPhotoClick={onPhotoClick}
                onFilterByLocation={(location) => {
                  onFilterByLocation(location);
                  handleClosePopup();
                }}
                onViewAllPhotos={onViewAllPhotos}
                onOpenSidePanel={onOpenSidePanel}
                onClose={handleClosePopup}
                showFilters={showFilters}
              />
            )}
          </div>
        </Popup>
      )}
    </>
  );
});

EnhancedMarkerCluster.displayName = 'EnhancedMarkerCluster'; 