// src/app/writing/page.js
'use client';

import React from 'react';
import BucketList from './components/BucketList';
import Essays from './components/Essays';
import Lists from './components/Lists';

const WritingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Writing & Travel Stories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore travel bucket lists, personal essays, and curated collections of travel experiences and recommendations.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Bucket List Column */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <span className="p-2 bg-teal-100 rounded-lg">
                  <svg 
                    className="w-6 h-6 text-teal-600"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                    />
                  </svg>
                </span>
                <h2 className="text-2xl font-semibold text-gray-900">Bucket List</h2>
              </div>
              <div className="flex-grow">
                <BucketList />
              </div>
            </div>
          </div>

          {/* Essays Column */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <span className="p-2 bg-indigo-100 rounded-lg">
                  <svg 
                    className="w-6 h-6 text-indigo-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" 
                    />
                  </svg>
                </span>
                <h2 className="text-2xl font-semibold text-gray-900">Essays</h2>
              </div>
              <div className="flex-grow">
                <Essays />
              </div>
            </div>
          </div>

          {/* Lists Column */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <span className="p-2 bg-rose-100 rounded-lg">
                  <svg 
                    className="w-6 h-6 text-rose-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
                    />
                  </svg>
                </span>
                <h2 className="text-2xl font-semibold text-gray-900">Lists</h2>
              </div>
              <div className="flex-grow">
                <Lists />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingPage;