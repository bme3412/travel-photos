import React, { useMemo, useRef, useCallback } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { getSmartPopupPosition, getPopupClasses, getPopupStyles } from '../utils/smartPopupPosition';

const CLUSTER_RADIUS = 50; // pixels

// Calculate distance between two points in pixels
const getDistance = (point1, point2, zoom) => {
  const scale = Math.pow(2, zoom);
  const dx = (point1.coordinates.lng - point2.coordinates.lng) * scale;
  const dy = (point1.coordinates.lat - point2.coordinates.lat) * scale;
  return Math.sqrt(dx * dx + dy * dy) * 111000; // rough conversion to meters
};

const ClusterMarker = ({ cluster, onLocationSelect, isHovered, onHover }) => {
  const { locations, coordinates, totalPhotos } = cluster;
  
  if (locations.length === 1) {
    // Single location marker
    const location = locations[0];
    return (
      <Marker
        latitude={location.coordinates.lat}
        longitude={location.coordinates.lng}
        anchor="center"
      >
        <div 
          className={`cursor-pointer transition-transform duration-200 ${
            isHovered ? 'scale-110' : 'hover:scale-105'
          }`}
          onClick={() => onLocationSelect?.(location)}
          onMouseEnter={() => onHover?.(location)}
          onMouseLeave={() => onHover?.(null)}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white border-2 border-white shadow-lg">
            <span className="text-sm font-medium">{location.photoCount}</span>
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
        className={`cursor-pointer transition-transform duration-200 ${
          isHovered ? 'scale-110' : 'hover:scale-105'
        }`}
        onClick={() => {
          // When cluster is clicked, could zoom in or show all locations
          console.log('Cluster clicked:', locations);
        }}
        onMouseEnter={() => onHover?.(cluster)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white border-3 border-white shadow-lg">
          <span className="text-sm font-bold">{totalPhotos}</span>
        </div>
        <div className="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">{locations.length}</span>
        </div>
      </div>
    </Marker>
  );
};

export const MarkerCluster = ({ 
  locations, 
  zoom, 
  onLocationSelect, 
  hoveredLocation, 
  setHoveredLocation,
  mapRef,
  viewport
}) => {
  const hideTimeoutRef = useRef(null);

  const handleMarkerMouseEnter = useCallback((locationOrCluster) => {
    // Cancel any pending hide operation
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredLocation(locationOrCluster);
  }, [setHoveredLocation]);

  const handleMarkerMouseLeave = useCallback(() => {
    // Add a delay before hiding the popup
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredLocation(null);
      hideTimeoutRef.current = null;
    }, 150); // 150ms delay
  }, [setHoveredLocation]);

  const handlePopupMouseEnter = useCallback(() => {
    // Cancel the hide operation when mouse enters popup
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    // Hide popup when mouse leaves popup area
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredLocation(null);
      hideTimeoutRef.current = null;
    }, 100); // Shorter delay when leaving popup
  }, [setHoveredLocation]);

  const clusters = useMemo(() => {
    if (!locations?.length) return [];
    if (zoom > 10) return locations.map(loc => ({ locations: [loc], coordinates: loc.coordinates, totalPhotos: loc.photoCount }));

    const clustered = [];
    const processed = new Set();

    locations.forEach((location, index) => {
      if (processed.has(index)) return;

      const cluster = {
        locations: [location],
        coordinates: { ...location.coordinates },
        totalPhotos: location.photoCount
      };

      // Find nearby locations to cluster
      locations.forEach((otherLocation, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return;

        const distance = getDistance(location, otherLocation, zoom);
        if (distance < CLUSTER_RADIUS) {
          cluster.locations.push(otherLocation);
          cluster.totalPhotos += otherLocation.photoCount;
          processed.add(otherIndex);
          
          // Update cluster center (simple average)
          cluster.coordinates.lat = cluster.locations.reduce((sum, loc) => sum + loc.coordinates.lat, 0) / cluster.locations.length;
          cluster.coordinates.lng = cluster.locations.reduce((sum, loc) => sum + loc.coordinates.lng, 0) / cluster.locations.length;
        }
      });

      processed.add(index);
      clustered.push(cluster);
    });

    return clustered;
  }, [locations, zoom]);

  if (!hoveredLocation) {
    return (
      <>
        {clusters.map((cluster, index) => (
          <ClusterMarker
            key={`cluster-${index}`}
            cluster={cluster}
            onLocationSelect={onLocationSelect}
            isHovered={hoveredLocation && (
              cluster.locations.length === 1 
                ? hoveredLocation.id === cluster.locations[0].id
                : hoveredLocation === cluster
            )}
            onHover={(locationOrCluster) => {
              if (locationOrCluster) {
                handleMarkerMouseEnter(locationOrCluster);
              } else {
                handleMarkerMouseLeave();
              }
            }}
          />
        ))}
      </>
    );
  }

  // Calculate smart positioning for the hovered location/cluster
  const popupLat = hoveredLocation.coordinates?.lat || hoveredLocation.locations?.[0]?.coordinates?.lat;
  const popupLng = hoveredLocation.coordinates?.lng || hoveredLocation.locations?.[0]?.coordinates?.lng;
  const smartPosition = getSmartPopupPosition(popupLat, popupLng, viewport, mapRef);

  return (
    <>
      {clusters.map((cluster, index) => (
        <ClusterMarker
          key={`cluster-${index}`}
          cluster={cluster}
          onLocationSelect={onLocationSelect}
          isHovered={hoveredLocation && (
            cluster.locations.length === 1 
              ? hoveredLocation.id === cluster.locations[0].id
              : hoveredLocation === cluster
          )}
          onHover={(locationOrCluster) => {
            if (locationOrCluster) {
              handleMarkerMouseEnter(locationOrCluster);
            } else {
              handleMarkerMouseLeave();
            }
          }}
        />
      ))}
      
      <Popup
        latitude={popupLat}
        longitude={popupLng}
        anchor={smartPosition.anchor}
        closeButton={false}
        closeOnClick={false}
        className="z-50"
        offset={smartPosition.offset}
      >
        <div 
          className={`${getPopupClasses()} p-3 min-w-[180px]`}
          style={getPopupStyles(smartPosition.maxHeight)}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          {hoveredLocation.locations ? (
            // Cluster popup
            <>
              <h3 className="font-semibold text-gray-900 mb-2">
                {hoveredLocation.locations.length} Locations
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {hoveredLocation.locations.map((loc, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium">{loc.name}</span>
                    <span className="text-gray-600 ml-2">({loc.photoCount} photos)</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
                Total: {hoveredLocation.totalPhotos} photos
              </p>
            </>
          ) : (
            // Single location popup
            <>
              <h3 className="font-semibold text-gray-900">{hoveredLocation.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{hoveredLocation.photoCount} photos</p>
              {hoveredLocation.photos?.length > 0 && (
                <div className="mt-2 flex -space-x-1">
                  {hoveredLocation.photos.slice(0, 3).map((photo, i) => (
                    <img
                      key={i}
                      src={photo.url}
                      alt={photo.caption}
                      className="w-8 h-8 rounded border-2 border-white object-cover"
                    />
                  ))}
                  {hoveredLocation.photos.length > 3 && (
                    <div className="w-8 h-8 rounded bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{hoveredLocation.photos.length - 3}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Popup>
    </>
  );
}; 