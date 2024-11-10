// src/app/bucket-list/components/BucketListItem.js

'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

const BucketListItem = ({ title, location, description, checked }) => {
  return (
    <li
      className="
        flex items-start justify-between p-4 bg-white rounded-lg shadow 
        hover:bg-teal-50 transition-colors duration-300
      "
    >
      {/* Left Side: Title, Location, and Description */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {title}
        </h3>
        <p className="flex items-center text-gray-500 mt-1">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{location}</span>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {description}
        </p>
      </div>
      
      {/* Right Side: Checkmark */}
      {checked && (
        <span 
          className="text-green-500 text-xl ml-4" 
          role="img" 
          aria-label="Completed"
        >
          ✅
        </span>
      )}
    </li>
  );
};

export default BucketListItem;
