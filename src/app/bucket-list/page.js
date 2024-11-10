// src/app/bucket-list/page.js
'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Globe, Check, Filter, Search, MapIcon } from 'lucide-react';
import { bucketListData } from './bucketListData';

const getCountryCode = (location) => {
  const country = location.split(',').pop().trim();
  const countryMap = {
    'Japan': 'JP', 'Norway': 'NO', 'Tanzania': 'TZ', 'Australia': 'AU',
    'Peru': 'PE', 'Greece': 'GR', 'Chile': 'CL', 'Kenya': 'KE',
    'Switzerland': 'CH', 'China': 'CN', 'France': 'FR', 'USA': 'US',
    // Add other countries as needed
  };
  return countryMap[country] || '';
};

const BucketListItem = ({ title, location, description, checked }) => {
  const countryCode = getCountryCode(location);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {countryCode && (
              <img
                src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
                alt={`${location} flag`}
                className="h-5 rounded"
              />
            )}
            {checked && (
              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                Completed
              </span>
            )}
          </div>
          <p className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{location}</span>
          </p>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

const BucketListPage = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list'); // 'list' or 'grid'

  const stats = useMemo(() => ({
    total: bucketListData.length,
    completed: bucketListData.filter(item => item.checked).length,
    remaining: bucketListData.filter(item => !item.checked).length,
    progress: Math.round((bucketListData.filter(item => item.checked).length / bucketListData.length) * 100)
  }), []);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header & Stats */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Global Travel Bucket List
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Track and explore your travel adventures around the world
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-teal-600">{stats.total}</div>
              <div className="text-gray-600 text-sm">Destinations</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-gray-600 text-sm">Completed</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.remaining}</div>
              <div className="text-gray-600 text-sm">Remaining</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.progress}%</div>
              <div className="text-gray-600 text-sm">Progress</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  filter === 'all' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                All
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  filter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Check className="w-4 h-4" />
                Completed
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  filter === 'pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Pending
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg ${
                  view === 'list' 
                    ? 'bg-gray-200' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg ${
                  view === 'grid' 
                    ? 'bg-gray-200' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bucket List Items */}
        <div className={
          view === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "grid grid-cols-1 gap-4"
        }>
          {filteredData.map((item) => (
            <BucketListItem
              key={item.slug}
              title={item.title}
              location={item.location}
              description={item.description}
              checked={item.checked}
            />
          ))}
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

export default BucketListPage;