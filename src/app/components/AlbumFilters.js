// AlbumFilters.js
'use client';

import React, { useMemo } from 'react';
import { Calendar, MapPin } from 'lucide-react';

export default function AlbumFilters({
  onYearFilter,
  onCountryFilter,
  activeYear,
  activeCountry,
  countriesData,
}) {
  // Generate years array dynamically based on current year
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsArray = ['all'];
    for (let year = currentYear; year >= 2020; year--) {
      yearsArray.push(year.toString());
    }
    return yearsArray;
  }, []);

  // Process countries data
  const countries = useMemo(() => {
    if (!Array.isArray(countriesData?.countries)) {
      return [{ id: 'all', name: 'All Countries' }];
    }

    return [
      { id: 'all', name: 'All Countries' },
      ...countriesData.countries
        .filter(country => country.name && country.id)
        .sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, [countriesData]);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
      {/* Year Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal-600" aria-hidden="true" />
          <span className="font-medium text-gray-700">Year</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onYearFilter(year)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
                ${activeYear === year
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              aria-pressed={activeYear === year}
            >
              {year === 'all' ? 'All Years' : year}
            </button>
          ))}
        </div>
      </div>

      {/* Country Filter */}
      <div className="relative flex items-center min-w-[200px]">
        <MapPin className="h-5 w-5 text-teal-600 absolute left-3" aria-hidden="true" />
        <select
          onChange={(e) => onCountryFilter(e.target.value)}
          value={activeCountry}
          className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-full
                     text-gray-700 appearance-none cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          aria-label="Filter by Country"
        >
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none">
          <svg 
            width="12" 
            height="8" 
            viewBox="0 0 12 8" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}