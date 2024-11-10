// src/app/bucket-list/page.js

'use client';

import React from 'react';
import BucketListItem from './components/BucketListItem';
import { bucketListData } from './bucketListData';

const BucketList = () => {
  // Select the Top 10 items
  const topTen = bucketListData.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6 text-center">Top 10 Bucket List</h1>
      <ul className="space-y-2">
        {topTen.map((item) => (
          <BucketListItem 
            key={item.slug}
            title={item.title}
            location={item.location}
            description={item.description}
            checked={item.checked}
          />
        ))}
      </ul>

      {/* "See All Bucket List" Link */}
      <div className="mt-6 text-center">
        <a 
          href="/bucket-list/global" 
          className="
            inline-flex items-center px-5 py-2 
            bg-teal-600 text-white rounded-lg 
            hover:bg-teal-700 transition-colors duration-300
            focus:outline-none focus:ring-2 focus:ring-teal-500
          "
          aria-label="See All Bucket List"
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
