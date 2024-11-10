// src/app/bucket-list/global/page.js

'use client';

import React from 'react';
import BucketListItem from '../components/BucketListItem';
import { bucketListData } from '../bucketListData';

const GlobalBucketList = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">Global Bucket List</h2>
      <ul className="space-y-4">
        {bucketListData.map((item) => (
          <BucketListItem 
            key={item.slug}
            title={item.title}
            location={item.location}
            description={item.description}
            checked={item.checked}
          />
        ))}
      </ul>
    </div>
  );
};

export default GlobalBucketList;
