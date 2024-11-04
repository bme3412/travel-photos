// src/app/components/AlbumMap.js
'use client';
import React from 'react';

export default function AlbumMap({ locations }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">Photo Locations</h2>
      </div>
      <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
        {/* Placeholder for map - Integrate a mapping library like React Leaflet or Google Maps */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Map Integration Coming Soon</p>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {locations.map((location) => (
            <div key={location.id} className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">{location.name}</span>
              <span className="text-sm text-gray-500">{location.photoCount} photos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
