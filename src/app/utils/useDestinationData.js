import { useMemo } from 'react';
import { countryToISO } from './countryMapping';

export const useDestinationData = (destinationsData, photosData = null) => {
  return useMemo(() => {
    if (!destinationsData?.destinations) return { destinations: [], visitedCountries: {} };

    // Create visited countries object for map coloring
    const visitedCountries = {};
    destinationsData.destinations.forEach(dest => {
      const isoCode = countryToISO[dest.country];
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