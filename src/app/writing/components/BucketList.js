// src/app/writing/components/BucketList.js
'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { bucketListData } from '@/app/bucket-list/bucketListData';

// Local BucketListItem component to avoid import issues
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

const BucketList = () => {
  // Display top 10 bucket list items
  const topTen = bucketListData.slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Travel Bucket List</h2>
      <div className="grid gap-4">
        {topTen.map((item) => (
          <BucketListItem
            key={item.slug}
            title={item.title}
            location={item.location}
            description={item.description}
            checked={item.checked}
          />
        ))}
      </div>
      
      <div className="text-center mt-6">
        <Link
          href="/bucket-list"
          className="inline-flex items-center px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-300"
        >
          <span>See Full Bucket List</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default BucketList;