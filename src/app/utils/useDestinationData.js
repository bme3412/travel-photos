import { useMemo } from 'react';

export const useDestinationData = (destinationsData, photosData = null) => {
  return useMemo(() => {
    if (!destinationsData?.destinations) return { destinations: [], visitedCountries: {} };

    // Create visited countries object for map coloring
    const visitedCountries = {};
    destinationsData.destinations.forEach(dest => {
      // Map country names to ISO codes (simplified mapping)
      const countryMapping = {
        'France': 'FRA',
        'Japan': 'JPN', 
        'USA': 'USA',
        'Spain': 'ESP',
        'Australia': 'AUS',
        'Italy': 'ITA',
        'United Kingdom': 'GBR',
        'Germany': 'DEU',
        'Canada': 'CAN',
        'Brazil': 'BRA',
        'Argentina': 'ARG',
        'Chile': 'CHL',
        'Peru': 'PER',
        'Colombia': 'COL',
        'Mexico': 'MEX',
        'Costa Rica': 'CRI',
        'Guatemala': 'GTM',
        'Thailand': 'THA',
        'Vietnam': 'VNM',
        'Cambodia': 'KHM',
        'Laos': 'LAO',
        'Myanmar': 'MMR',
        'India': 'IND',
        'Nepal': 'NPL',
        'China': 'CHN',
        'South Korea': 'KOR',
        'Malaysia': 'MYS',
        'Singapore': 'SGP',
        'Indonesia': 'IDN',
        'Philippines': 'PHL',
        'New Zealand': 'NZL',
        'Egypt': 'EGY',
        'Morocco': 'MAR',
        'South Africa': 'ZAF',
        'Kenya': 'KEN',
        'Tanzania': 'TZA',
        'Botswana': 'BWA',
        'Namibia': 'NAM',
        'Zimbabwe': 'ZWE',
        'Zambia': 'ZMB',
        'Rwanda': 'RWA',
        'Uganda': 'UGA',
        'Ethiopia': 'ETH',
        'Tunisia': 'TUN',
        'Turkey': 'TUR',
        'Greece': 'GRC',
        'Croatia': 'HRV',
        'Montenegro': 'MNE',
        'Serbia': 'SRB',
        'Bosnia and Herzegovina': 'BIH',
        'Albania': 'ALB',
        'North Macedonia': 'MKD',
        'Bulgaria': 'BGR',
        'Romania': 'ROU',
        'Hungary': 'HUN',
        'Czech Republic': 'CZE',
        'Slovakia': 'SVK',
        'Poland': 'POL',
        'Lithuania': 'LTU',
        'Latvia': 'LVA',
        'Estonia': 'EST',
        'Finland': 'FIN',
        'Sweden': 'SWE',
        'Norway': 'NOR',
        'Denmark': 'DNK',
        'Netherlands': 'NLD',
        'Belgium': 'BEL',
        'Luxembourg': 'LUX',
        'Switzerland': 'CHE',
        'Austria': 'AUT',
        'Portugal': 'PRT',
        'Ireland': 'IRL',
        'Iceland': 'ISL',
        'Russia': 'RUS',
        'Georgia': 'GEO',
        'Armenia': 'ARM',
        'Azerbaijan': 'AZE',
        'Kazakhstan': 'KAZ',
        'Uzbekistan': 'UZB',
        'Kyrgyzstan': 'KGZ',
        'Tajikistan': 'TJK',
        'Turkmenistan': 'TKM',
        'Afghanistan': 'AFG',
        'Pakistan': 'PAK',
        'Bangladesh': 'BGD',
        'Sri Lanka': 'LKA',
        'Maldives': 'MDV',
        'Iran': 'IRN',
        'Iraq': 'IRQ',
        'Jordan': 'JOR',
        'Lebanon': 'LBN',
        'Syria': 'SYR',
        'Israel': 'ISR',
        'Palestine': 'PSE',
        'Saudi Arabia': 'SAU',
        'United Arab Emirates': 'ARE',
        'Qatar': 'QAT',
        'Kuwait': 'KWT',
        'Bahrain': 'BHR',
        'Oman': 'OMN',
        'Yemen': 'YEM'
      };
      
      const isoCode = countryMapping[dest.country];
      if (isoCode) {
        visitedCountries[isoCode] = true;
      } else {
        console.warn(`No ISO code found for country: ${dest.country}`);
      }
    });

    // Enhanced destinations with photo data if provided
    let enhancedDestinations = destinationsData.destinations;
    
    if (photosData?.photos) {
      enhancedDestinations = destinationsData.destinations.map(dest => {
        // Find photos that match this destination
        const matchingPhotos = photosData.photos.filter(photo => {
          if (!photo.locationId) return false;
          
          const destNameLower = dest.name.toLowerCase();
          const locationIdLower = photo.locationId.toLowerCase();
          
          // More precise matching logic
          // 1. Exact match of destination name
          if (destNameLower === locationIdLower) {
            return true;
          }
          
          // 2. Destination name appears as a complete word in locationId
          const words = locationIdLower.split(/[,\s]+/).map(word => word.trim());
          if (words.includes(destNameLower)) {
            return true;
          }
          
          // 3. For multi-word destination names, check if all words appear
          const destWords = destNameLower.split(/\s+/);
          if (destWords.length > 1) {
            return destWords.every(word => 
              words.some(locationWord => locationWord.includes(word))
            );
          }
          
          // 4. Special case for common city variations
          const cityVariations = {
            'new york city': ['new york', 'nyc', 'manhattan'],
            'los angeles': ['la', 'los angeles'],
            'san francisco': ['sf', 'san francisco'],
            'washington': ['washington dc', 'dc'],
          };
          
          const variations = cityVariations[destNameLower];
          if (variations) {
            return variations.some(variation => 
              words.includes(variation) || locationIdLower.includes(variation)
            );
          }
          
          return false;
        });

        // Debug logging for mismatches
        if (matchingPhotos.length > 0) {
          console.log(`✅ Destination "${dest.name}" matched with ${matchingPhotos.length} photos:`, 
            matchingPhotos.map(p => p.locationId)
          );
        }

        return {
          ...dest,
          photos: matchingPhotos,
          photoCount: matchingPhotos.length
        };
      });
    }

    return {
      destinations: enhancedDestinations,
      visitedCountries
    };
  }, [destinationsData, photosData]);
}; 