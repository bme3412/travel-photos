// src/app/bucket-list/components/BucketListItem.js
'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

const BucketListItem = ({ title, location, description, checked }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="flex items-center text-gray-500 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{location}</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        </div>
        {checked && (
          <span 
            className="flex-shrink-0 text-green-500 text-xl ml-4"
            role="img"
            aria-label="Completed"
          >
            ✅
          </span>
        )}
      </div>
    </div>
  );
};

export default BucketListItem;