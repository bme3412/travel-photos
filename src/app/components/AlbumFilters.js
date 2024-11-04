// src/app/components/AlbumFilters.js
'use client';
import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

export default function AlbumFilters({
  onYearFilter,
  onCountryFilter,
  activeYear,
  activeCountry,
  albums,
}) {
  const years = ['all', '2025', '2024', '2023', '2022', '2021', '2020'];

  // Extract unique countries from albums and sort them alphabetically
  const countries = ['all', ...Array.from(new Set(albums.map((album) => album.country)))].sort();

  return (
    <div className="mb-12">
      <div className="flex flex-wrap gap-8 items-center justify-center">
        {/* Year Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-teal-700" aria-hidden="true" />
            <span className="font-semibold text-gray-800 text-lg">Year:</span>
          </div>
          <div className="flex gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => onYearFilter(year)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeYear === year
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                aria-pressed={activeYear === year}
              >
                {year === 'all' ? 'All Years' : year}
              </button>
            ))}
          </div>
        </div>

        {/* Country Filter */}
        <div className="relative flex items-center">
          <MapPin className="h-6 w-6 text-teal-700 absolute left-3" aria-hidden="true" />
          <select
            onChange={(e) => onCountryFilter(e.target.value)}
            value={activeCountry}
            className="pl-12 pr-8 py-2 border border-gray-300 rounded-full appearance-none bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
            aria-label="Filter by Country"
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country === 'all' ? 'All Countries' : country}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 pointer-events-none"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L6 6L11 1"
              stroke="#4B5563"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
