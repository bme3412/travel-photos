import React from 'react';
import { Calendar, Camera, MapPin, Clock } from 'lucide-react';

export default function AlbumStats({ album }) {
  if (!album) return null;

  const stats = [
    {
      icon: <Calendar className="h-5 w-5 text-teal-600" />,
      label: "Date",
      value: album.dateRange
    },
    {
      icon: <Clock className="h-5 w-5 text-teal-600" />,
      label: "Duration",
      value: `${album.duration} days`
    },
    {
      icon: <Camera className="h-5 w-5 text-teal-600" />,
      label: "Photos",
      value: album.photoCount
    },
    {
      icon: <MapPin className="h-5 w-5 text-teal-600" />,
      label: "Locations",
      value: album.locations?.length || 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
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