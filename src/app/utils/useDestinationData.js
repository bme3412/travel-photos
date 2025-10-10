import { useMemo } from 'react';
import { countryToISO } from './countryMapping';

export const useDestinationData = (destinationsData, photosData = null, locationsData = []) => {
  return useMemo(() => {
    // Handle both array and object formats
    const destinationsArray = Array.isArray(destinationsData) 
      ? destinationsData 
      : destinationsData?.destinations;
    
    if (!destinationsArray || destinationsArray.length === 0) {
      return { destinations: [], visitedCountries: {} };
    }

    // Create visited countries object for map coloring
    const visitedCountries = {};
    destinationsArray.forEach(dest => {
      const isoCode = countryToISO[dest.country];
      if (isoCode) {
        visitedCountries[isoCode] = true;
      } else {
        console.warn(`No ISO code found for country: ${dest.country}`);
      }
    });

    // Helper function to resolve location name from ID
    const getLocationName = (locationId) => {
      if (!locationId) return '';
      // If it starts with 'loc', look it up in locations array
      if (locationId.startsWith('loc') && locationsData.length > 0) {
        const location = locationsData.find(loc => loc.id === locationId);
        return location?.name || locationId;
      }
      // Otherwise, it's already a location name
      return locationId;
    };

    // Enhanced destinations with photo data if provided
    let enhancedDestinations = destinationsArray;
    
    if (photosData?.photos) {
      enhancedDestinations = destinationsArray.map(dest => {
        // Find photos that match this destination
        const matchingPhotos = photosData.photos.filter(photo => {
          if (!photo.locationId) return false;
          
          // Resolve location name from ID if needed
          const locationName = getLocationName(photo.locationId);
          
          const destNameLower = dest.name.toLowerCase();
          const locationIdLower = locationName.toLowerCase();
          
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
  }, [destinationsData, photosData, locationsData]);
}; 