'use client';

import React, { useMemo } from 'react';
import { Calendar, Camera, MapPin, Clock } from 'lucide-react';

export default function AlbumStats({ album }) {
  // Move all useMemo hooks outside of conditional blocks
  const uniqueLocations = useMemo(() => 
    album?.photos ? new Set(album.photos.map(photo => photo.locationId)) : new Set()
  , [album?.photos]);

  const dateRange = useMemo(() => {
    if (!album?.photos?.length) return 'N/A';
    
    const dates = album.photos.map(photo => new Date(photo.dateCreated));
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    
    // If same day, show single date
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    // If different days but same month and year
    if (startDate.getMonth() === endDate.getMonth() && 
        startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    
    // If different months or years
    return `${startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })} - ${endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  }, [album?.photos]);

  const duration = useMemo(() => {
    if (!album?.photos?.length) return 'N/A';
    
    const dates = album.photos.map(photo => new Date(photo.dateCreated));
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 0 ? '1 day' : `${diffDays + 1} days`;
  }, [album?.photos]);

  // Early return if no album
  if (!album) return null;

  const stats = [
    {
      icon: <Calendar className="h-5 w-5 text-teal-600" />,
      label: "Date",
      value: dateRange
    },
    {
      icon: <Clock className="h-5 w-5 text-teal-600" />,
      label: "Duration",
      value: duration
    },
    {
      icon: <Camera className="h-5 w-5 text-teal-600" />,
      label: "Photos",
      value: album.photos?.length || 0
    },
    {
      icon: <MapPin className="h-5 w-5 text-teal-600" />,
      label: "Locations",
      value: uniqueLocations.size
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center"
        >
          <div className="bg-teal-50 p-3 rounded-full mb-3">
            {stat.icon}
          </div>
          <dt className="text-sm font-medium text-gray-500 mb-1">
            {stat.label}
          </dt>
          <dd className="text-2xl font-semibold text-gray-900">
            {stat.value}
          </dd>
        </div>
      ))}
    </div>
  );
}