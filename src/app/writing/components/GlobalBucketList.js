// src/app/writing/components/GlobalBucketList.js
'use client';

import React, { useMemo } from 'react';
import { MapPin, Check, Globe, Filter } from 'lucide-react';
import { bucketListData } from '@/app/bucket-list/bucketListData';

const getCountryCode = (location) => {
  // Extract country from location (assuming format "City, Country")
  const country = location.split(',').pop().trim();
  
  // Map countries to their 2-letter codes
  const countryMap = {
    'Japan': 'JP',
    'Norway': 'NO',
    'Tanzania': 'TZ',
    'Australia': 'AU',
    'Peru': 'PE',
    'Greece': 'GR',
    'Chile': 'CL',
    'Kenya': 'KE',
    'Switzerland': 'CH',
    'China': 'CN',
    'France': 'FR',
    'USA': 'US',
    'Indonesia': 'ID',
    'Italy': 'IT',
    'Turkey': 'TR',
    'Ecuador': 'EC',
    'Botswana': 'BW',
    'Canada': 'CA',
    'UAE': 'AE',
    'Morocco': 'MA',
    'Brazil': 'BR',
    'England': 'GB',
    'Jordan': 'JO',
    'India': 'IN',
    'South Africa': 'ZA',
    'Spain': 'ES',
    'Iceland': 'IS',
    'Russia': 'RU',
    'Czech Republic': 'CZ',
    'Singapore': 'SG',
    'Nepal': 'NP',
    'Thailand': 'TH',
    'Egypt': 'EG',
    'Portugal': 'PT',
    'Zambia': 'ZM',
    'Zimbabwe': 'ZW',
    'French Polynesia': 'PF',
    'Antarctica': 'AQ',
  };

  return countryMap[country] || '';
};

const GlobalBucketList = () => {
  const [filter, setFilter] = React.useState('all'); // 'all', 'completed', 'pending'
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredData = useMemo(() => {
    return bucketListData
      .filter(item => {
        if (filter === 'completed') return item.checked;
        if (filter === 'pending') return !item.checked;
        return true;
      })
      .filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [filter, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Global Bucket List</h1>
          <p className="text-lg text-gray-600">Track your travel adventures around the world</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  filter === 'all' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Globe className="w-4 h-4 mr-2" />
                All
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  filter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Check className="w-4 h-4 mr-2" />
                Completed
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  filter === 'pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Pending
              </button>
            </div>
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Bucket List Items */}
        <div className="grid gap-6">
          {filteredData.map((item) => {
            const countryCode = getCountryCode(item.location);
            return (
              <div
                key={item.slug}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        {countryCode && (
                          <img
                            src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
                            alt={`${item.location} flag`}
                            className="h-5 rounded"
                          />
                        )}
                        {item.checked && (
                          <span 
                            className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium"
                          >
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{item.location}</span>
                      </p>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No destinations found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalBucketList;