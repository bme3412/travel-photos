// src/app/components/AlbumStats.js
'use client';
import React from 'react';
import { Camera, CalendarDays, Clock, MapPin } from 'lucide-react';

export default function AlbumStats({ album }) {
  const stats = [
    {
      id: 1,
      icon: <Camera className="h-6 w-6 text-blue-600" />,
      label: 'Total Photos',
      value: album.photoCount,
      bgColor: 'bg-blue-50',
    },
    {
      id: 2,
      icon: <CalendarDays className="h-6 w-6 text-green-600" />,
      label: 'Date Range',
      value: album.dateRange,
      bgColor: 'bg-green-50',
    },
    {
      id: 3,
      icon: <Clock className="h-6 w-6 text-purple-600" />,
      label: 'Trip Duration',
      value: `${album.duration} days`,
      bgColor: 'bg-purple-50',
    },
    {
      id: 4,
      icon: <MapPin className="h-6 w-6 text-red-600" />,
      label: 'Country',
      value: album.country,
      bgColor: 'bg-red-50',
    },
    {
      id: 5,
      icon: <MapPin className="h-6 w-6 text-orange-600" />,
      label: 'Locations',
      value: album.locations.length,
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Album Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {stats.map((stat) => (
          <div key={stat.id} className="flex items-center gap-4">
            <div className={`p-4 ${stat.bgColor} rounded-full`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-semibold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
