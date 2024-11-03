/**
 * Configuration object for Google Places API queries
 * Contains essential parameters for location-based searches
 * 
 * @returns {Object} Query configuration object with API key and search parameters
 */
export const getGooglePlacesQueryConfig = (): {
  key: string;
  language: string; 
  types: string;
} => {
  // API key for accessing Google Places services
  // Note: In production, this should be stored securely
  const GOOGLE_PLACES_API_KEY = 'AIzaSyAa8GhuQxxebW8Dw-2xMyFGnBA3R5IZHOc';

  // Construct and return the query configuration
  return {
    // Authenticate requests with our API key
    key: GOOGLE_PLACES_API_KEY,
    
    // Set response language (ISO 639-1 code)
    // Could be expanded to support multiple languages
    language: 'en',
    
    // Remove the cities restriction since we're searching for venues
    types: '(establishment)',
  };
};

// Function to fetch data from Google Places API using a query string
export const getGooglePlacesAPIRequest = async (query: string) => {
  const config = getGooglePlacesQueryConfig();
  // Fix the URL construction - properly add the key parameter
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${config.key}&language=${config.language}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
};


/**
 * Get details for a specific place using its Place ID
 * @param placeId The unique identifier for a place
 * @returns Detailed information about the place
 */
export const getPlaceDetails = async (placeId: string) => {
  const config = getGooglePlacesQueryConfig();
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${config.key}`
  );
  const data = await response.json();
  return data;
};

/**
 * Search for places nearby a location using coordinates
 * @param latitude Latitude of the center point
 * @param longitude Longitude of the center point
 * @param radius Search radius in meters (max 50000)
 * @param type Optional place type to filter results
 * @returns Array of nearby places
 */
export const getNearbyPlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 1500,
  type?: string
) => {
    const config = getGooglePlacesQueryConfig();
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${config.key}`;
    
    if (type) {
        url += `&type=${type}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    return data;
};

/**
 * Get autocomplete predictions for a search query
 * @param input User's search input
 * @param types Optional array of place types to restrict results
 * @returns Array of autocomplete predictions
 */
export const getAutocompletePredictions = async (
  input: string,
  types?: string[]
) => {
    const config = getGooglePlacesQueryConfig();
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${config.key}`;
    
    if (types && types.length > 0) {
        url += `&types=${types.join('|')}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    return data;
};

/**
 * Get the geocoded address details from coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Address details for the location
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
) => {
    const config = getGooglePlacesQueryConfig();
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.key}`
    );
    const data = await response.json();
    return data;
};
