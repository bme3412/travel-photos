// components/GlobalBucketList.js

'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { bucketListData } from '../../bucket-list/bucketListData';

const GlobalBucketList = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">Global Bucket List</h2>
      <ul className="space-y-4">
        {bucketListData.map((item) => (
          <li 
            key={item.slug}
            className="
              flex items-start justify-between p-4 bg-white rounded-lg shadow 
              hover:bg-teal-50 transition-colors duration-300
            "
          >
            {/* Left Side: Title and Location */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {item.title}
              </h3>
              <p className="flex items-center text-gray-500 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{item.location}</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {item.description}
              </p>
            </div>
            
            {/* Right Side: Checkmark */}
            {item.checked && (
              <span 
                className="text-green-500 text-xl ml-4" 
                role="img" 
                aria-label="Completed"
              >
                ✅
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GlobalBucketList;
