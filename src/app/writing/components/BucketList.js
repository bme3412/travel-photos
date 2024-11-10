// components/BucketList.js

'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { bucketListData } from '../../bucket-list/bucketListData';

const BucketList = () => {
  // Select the top 10 items
  const topTen = bucketListData.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ul className="space-y-2">
        {topTen.map((item) => (
          <li 
            key={item.slug}
            className="
              flex items-center justify-between p-3 bg-white rounded-lg shadow-sm 
              hover:bg-teal-50 transition-colors duration-300
            "
          >
            {/* Left Side: Title and Location */}
            <div>
              <h3 className="text-md font-medium text-gray-900">
                {item.title}
              </h3>
              <p className="flex items-center text-gray-500 mt-1.5">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{item.location}</span>
              </p>
            </div>
            
            {/* Right Side: Checkmark */}
            {item.checked && (
              <span 
                className="text-green-500 text-xl" 
                role="img" 
                aria-label="Completed"
              >
                ✅
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* "See All" Link */}
      <div className="mt-6 text-center">
        <a 
          href="/bucket-list" 
          className="
            inline-flex items-center px-5 py-2 
            bg-teal-600 text-white rounded-lg 
            hover:bg-teal-700 transition-colors duration-300
            focus:outline-none focus:ring-2 focus:ring-teal-500
          "
        >
          <span className="font-medium">See All Bucket List</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default BucketList;
