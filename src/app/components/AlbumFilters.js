import React, { useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const YearCountriesPopup = ({ countries, onCountrySelect, activeCountry, onClose }) => (
  <div 
    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl p-3 z-50"
    style={{ minWidth: '200px' }}
    onMouseLeave={onClose}
  >
    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
      {countries.map((country) => (
        <button
          key={country.id}
          onClick={() => onCountrySelect(country.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm w-full
            transition-colors duration-200
            ${activeCountry === country.id 
              ? 'bg-teal-600 text-white' 
              : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <img
            src={`https://flagcdn.com/${country.id.toLowerCase()}.svg`}
            alt=""
            className="w-4 h-3 object-cover rounded-sm"
          />
          <span className="truncate">{country.name}</span>
        </button>
      ))}
    </div>
    {/* Pointer arrow */}
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 transform rotate-45 bg-white" />
  </div>
);

const YearButton = React.memo(({ 
  year,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  showCountries,
  countriesForYear,
  activeCountry,
  onCountrySelect
}) => (
  <div className="relative">
    <button
      onClick={() => onClick(year)}
      onMouseEnter={() => onMouseEnter(year)}
      onMouseLeave={onMouseLeave}
      className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap
        transition-all duration-200 ease-in-out
        ${isActive
          ? 'bg-teal-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {year === 'all' ? 'All Years' : year}
    </button>

    {showCountries && countriesForYear?.length > 0 && (
      <YearCountriesPopup
        countries={countriesForYear}
        onCountrySelect={onCountrySelect}
        activeCountry={activeCountry}
        onClose={onMouseLeave}
      />
    )}
  </div>
));

YearButton.displayName = 'YearButton';

export default function AlbumFilters({
  onYearFilter,
  onCountryFilter,
  activeYear,
  activeCountry,
  countriesData,
  albums
}) {
  const yearScrollRef = useRef(null);
  const [hoveredYear, setHoveredYear] = useState(null);

  const years = useMemo(() => {
    const yearsArray = ['all'];
    const uniqueYears = [...new Set(albums?.map(album => album.year))]
      .sort((a, b) => b - a); // Sort years in descending order
    return [...yearsArray, ...uniqueYears];
  }, [albums]);

  const countriesByYear = useMemo(() => {
    if (!albums || !countriesData?.countries) return {};
    
    return albums.reduce((acc, album) => {
      if (!acc[album.year]) {
        acc[album.year] = [];
      }
      
      const countryData = countriesData.countries.find(c => c.id === album.countryId);
      if (countryData && !acc[album.year].find(c => c.id === countryData.id)) {
        acc[album.year].push({
          id: countryData.id,
          name: countryData.name
        });
      }
      
      return acc;
    }, {});
  }, [albums, countriesData]);

  const handleScroll = (direction) => {
    if (yearScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      yearScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleYearHover = (year) => {
    setHoveredYear(year);
  };

  const handleCountrySelect = (countryId) => {
    onCountryFilter(countryId);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <span>Year</span>
        </div>
        
        <div className="relative flex-1">
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
            aria-label="Scroll years left"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          <div
            ref={yearScrollRef}
            className="flex gap-2 overflow-x-auto hide-scrollbar px-8 py-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {years.map((year) => (
              <YearButton
                key={year}
                year={year}
                isActive={activeYear === year}
                onClick={onYearFilter}
                onMouseEnter={handleYearHover}
                onMouseLeave={() => setHoveredYear(null)}
                showCountries={hoveredYear === year}
                countriesForYear={countriesByYear[year]}
                activeCountry={activeCountry}
                onCountrySelect={handleCountrySelect}
              />
            ))}
          </div>

          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
            aria-label="Scroll years right"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}