import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl';

export const RouteVisualization = ({ locations, showRoutes = false }) => {
  const routeData = useMemo(() => {
    if (!locations?.length || !showRoutes) return null;

    // Sort locations by date to create a chronological travel path
    const sortedLocations = [...locations]
      .filter(loc => loc.photos?.length > 0)
      .sort((a, b) => {
        const dateA = new Date(a.photos[0].dateCreated);
        const dateB = new Date(b.photos[0].dateCreated);
        return dateA - dateB;
      });

    if (sortedLocations.length < 2) return null;

    // Create GeoJSON for the route
    const coordinates = sortedLocations.map(location => [
      location.coordinates.lng,
      location.coordinates.lat
    ]);

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };
  }, [locations, showRoutes]);

  if (!routeData) return null;

  const routeLayerStyle = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#6366f1',
      'line-width': 3,
      'line-opacity': 0.8,
      'line-dasharray': [2, 2]
    }
  };

  const routeLayerAnimated = {
    id: 'route-animated',
    type: 'line',
    paint: {
      'line-color': '#f59e0b',
      'line-width': 2,
      'line-opacity': 0.6,
      'line-dasharray': [1, 3]
    }
  };

  return (
    <Source
      id="route-source"
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: [routeData]
      }}
    >
      <Layer {...routeLayerStyle} />
      <Layer {...routeLayerAnimated} />
    </Source>
  );
}; 