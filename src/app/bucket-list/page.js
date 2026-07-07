// src/app/bucket-list/page.js
'use client';

import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { bucketListData } from './bucketListData';

const countryMap = {
      // North America
      'USA': 'US',
      'Canada': 'CA',
      'Mexico': 'MX',

      // South America
      'Argentina': 'AR',
      'Brazil': 'BR',
      'Chile': 'CL',
      'Colombia': 'CO',
      'Peru': 'PE',
      'Uruguay': 'UY',
      'Venezuela': 'VE',

      // Europe
      'Austria': 'AT',
      'Belgium': 'BE',
      'Bulgaria': 'BG',
      'Croatia': 'HR',
      'Cyprus': 'CY',
      'Czech Republic': 'CZ',
      'Denmark': 'DK',
      'Estonia': 'EE',
      'Finland': 'FI',
      'France': 'FR',
      'Germany': 'DE',
      'Greece': 'GR',
      'Hungary': 'HU',
      'Iceland': 'IS',
      'Ireland': 'IE',
      'Italy': 'IT',
      'Latvia': 'LV',
      'Lithuania': 'LT',
      'Luxembourg': 'LU',
      'Malta': 'MT',
      'Netherlands': 'NL',
      'Norway': 'NO',
      'Poland': 'PL',
      'Portugal': 'PT',
      'Romania': 'RO',
      'Slovakia': 'SK',
      'Slovenia': 'SI',
      'Spain': 'ES',
      'Sweden': 'SE',
      'Switzerland': 'CH',
      'United Kingdom': 'GB',

      // Asia
      'China': 'CN',
      'Hong Kong': 'HK',
      'India': 'IN',
      'Indonesia': 'ID',
      'Japan': 'JP',
      'Malaysia': 'MY',
      'Philippines': 'PH',
      'Singapore': 'SG',
      'South Korea': 'KR',
      'Taiwan': 'TW',
      'Thailand': 'TH',
      'Vietnam': 'VN',

      // Middle East
      'Israel': 'IL',
      'Saudi Arabia': 'SA',
      'Turkey': 'TR',
      'United Arab Emirates': 'AE',

      // Africa
      'Egypt': 'EG',
      'Kenya': 'KE',
      'Morocco': 'MA',
      'Nigeria': 'NG',
      'South Africa': 'ZA',
      'Tanzania': 'TZ',

      // Oceania
      'Australia': 'AU',
      'New Zealand': 'NZ',

      // Common alternative names
      'United States': 'US',
      'United States of America': 'US',
      'UK': 'GB',
      'Great Britain': 'GB',
      'South Korea': 'KR',
      'Republic of Korea': 'KR',
      'North Korea': 'KP',
      'Russia': 'RU',
      'Russian Federation': 'RU'
};

const getCountryCode = (location) => {
  const country = location.split(',').pop().trim();
  return countryMap[country] || '';
};

const CountryFlag = ({ location }) => {
  const countryCode = getCountryCode(location);
  if (!countryCode) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      alt={`${location} flag`}
      className="h-3.5 flex-shrink-0"
      loading="lazy"
    />
  );
};

const VisitedMark = () => (
  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-accent">
    <Check className="h-3 w-3" />
    Visited
  </span>
);

const BucketListRow = ({ item, number }) => (
  <li>
    <div className="flex items-baseline gap-5 sm:gap-8 py-5">
      <span className="text-[11px] text-muted tabular-nums w-8 flex-shrink-0">
        {String(number).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className={`font-display text-lg sm:text-xl tracking-tight ${item.checked ? 'text-ink/50' : ''}`}>
            {item.title}
          </h3>
          <CountryFlag location={item.location} />
          {item.checked && <VisitedMark />}
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-1.5">{item.location}</p>
        <p className="text-sm text-ink/70 leading-relaxed mt-1.5 max-w-2xl">{item.description}</p>
      </div>
    </div>
  </li>
);

const BucketListCard = ({ item, number }) => (
  <div className="border border-ink/10 p-6 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted tabular-nums">
        № {String(number).padStart(2, '0')}
      </span>
      <div className="flex items-center gap-3">
        <CountryFlag location={item.location} />
        {item.checked && <VisitedMark />}
      </div>
    </div>
    <h3 className={`font-display text-xl tracking-tight leading-snug ${item.checked ? 'text-ink/50' : ''}`}>
      {item.title}
    </h3>
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted -mt-1">{item.location}</p>
    <p className="text-sm text-ink/70 leading-relaxed">{item.description}</p>
  </div>
);

const FILTERS = [
  ['all', 'Everything'],
  ['pending', 'Still to come'],
  ['completed', 'Visited'],
];

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
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2">The wish list</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Bucket list</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted mt-4">
            <span className="text-ink">{stats.completed}</span> visited · {' '}
            <span className="text-ink">{stats.remaining}</span> still to come · {' '}
            <span className="text-ink">{stats.progress}%</span> underway
          </p>
          {/* Progress rule */}
          <div className="mt-5 h-px bg-ink/10 max-w-md relative">
            <div
              className="absolute inset-y-0 left-0 bg-accent"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.18em]">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`pb-1 border-b transition-colors duration-200 ${
                  filter === value
                    ? 'text-ink border-accent'
                    : 'text-muted border-transparent hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search the list"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 bg-transparent pl-6 pb-1 text-[12px] tracking-wide border-0 border-b border-ink/20
                           placeholder:text-muted placeholder:uppercase placeholder:text-[11px] placeholder:tracking-[0.18em]
                           focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
              {[['list', 'Index'], ['grid', 'Grid']].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`pb-1 border-b transition-colors duration-200 ${
                    view === mode
                      ? 'text-ink border-accent'
                      : 'text-muted border-transparent hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items */}
        {filteredData.length > 0 ? (
          view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((item, index) => (
                <BucketListCard key={item.slug} item={item} number={index + 1} />
              ))}
            </div>
          ) : (
            <ol className="border-y border-ink/10 divide-y divide-ink/10">
              {filteredData.map((item, index) => (
                <BucketListRow key={item.slug} item={item} number={index + 1} />
              ))}
            </ol>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <p className="font-display text-2xl text-ink/70 mb-2">Nothing matches</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              Try a different search or filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketListPage;
