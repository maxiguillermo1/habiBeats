/**
 * TicketMaster API Configuration
 * Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
// This is our secret key to access TicketMaster's services
export const TICKETMASTER_API_KEY = 'dUU6uAGlJCm1uSxAJJFjS8oeh1gPkaSe';
// This is the main website address where we'll send our requests
export const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Common search parameters for TicketMaster API
 * @interface SearchParams
 */
interface SearchParams {
  keyword?: string;          // Search keyword
  city?: string;             // City name
  stateCode?: string;        // State code (e.g., "NY", "CA")
  countryCode?: string;      // Country code (e.g., "US", "CA")
  postalCode?: string;       // Postal/Zip code
  latlong?: string;          // Latitude/longitude (e.g., "34.0522,-118.2437")
  radius?: number;           // Search radius
  unit?: 'miles' | 'km';     // Unit for radius
  size?: number;             // Number of items per page (default: 20, max: 200)
  page?: number;             // Page number
  sort?: string;             // Sort order (e.g., "date,asc", "relevance,desc")
  startDateTime?: string;    // Start date (format: "YYYY-MM-DDTHH:mm:ssZ")
  endDateTime?: string;      // End date (format: "YYYY-MM-DDTHH:mm:ssZ")
  includeTBA?: 'yes' | 'no'; // Include TBA events
  includeTBD?: 'yes' | 'no'; // Include TBD events
  includeTest?: 'yes' | 'no';// Include test events
  source?: string;           // Source of events (e.g., "ticketmaster", "universe")
  segmentId?: string;        // Segment ID (e.g., "KZFzniwnSyZfZ7v7nJ" for Music)
  genreId?: string;          // Genre ID
  subGenreId?: string;       // Subgenre ID
  typeId?: string;          // Event type ID
  subTypeId?: string;       // Event subtype ID
  marketId?: string;        // Market ID
  promoterId?: string;      // Promoter ID
  dmaId?: string;          // Designated Market Area ID
  classificationName?: string; // Classification name (e.g., "music", "sports")
  classificationId?: string;   // Classification ID
  localStartDateTime?: string; // Local start date time
  localStartEndDateTime?: string; // Local end date time
  priceRange?: string;      // Price range (e.g., "0-100")
  family?: boolean;         // Family-friendly events
}

/**
 * Venue search parameters
 */
interface VenueSearchParams {
  keyword?: string;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  postalCode?: string;
  latlong?: string;
  radius?: number;
  unit?: 'miles' | 'km';
  size?: number;
  page?: number;
  sort?: string;
  source?: string;
}

/**
 * Creates a URL-friendly query string from API parameters
 * @param baseParams - Initial parameters to include
 * @param additionalParams - Optional extra search parameters
 * @returns URLSearchParams object ready for API request
 */
/**
 * This function takes our search options and turns them into a format that works in a URL
 * For example: {city: "New York", size: 10} becomes "city=New%20York&size=10"
 * 
 * @param baseParams - The main search options we always need (like our API key)
 * @param additionalParams - Extra search options the user might want to add
 * @returns A special URL-friendly format of all our search options
 */
const buildApiQueryParams = (baseParams: Record<string, any>, additionalParams: Record<string, any> = {}) => {
  // Create a new container for our URL-friendly parameters
  const queryParams = new URLSearchParams();
  
  // Combine our required parameters with any extra ones the user provided
  const allParams = { ...baseParams, ...additionalParams };
  
  // Go through each search option and add it to our URL-friendly format
  // We only add parameters that have a value (ignore empty ones)
  Object.entries(allParams).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert everything to text (strings) because URLs only work with text
      queryParams.append(key, String(value));
    }
  });
  
  return queryParams;
};

/**
 * Makes a GET request to the TicketMaster API
 * @param endpoint - API endpoint (e.g., 'events', 'venues')
 * @param params - Search parameters for the request
 * @returns Promise with JSON response
 */
/**
 * This function actually talks to TicketMaster's website to get information
 * Think of it like making a phone call to TicketMaster to ask for specific information
 * 
 * @param endpoint - Which specific service we want (like 'events' or 'venues')
 * @param params - What specific information we're looking for
 * @returns The information TicketMaster sends back to us
 */
const fetchFromTicketMaster = async (endpoint: string, params: Record<string, any> = {}) => {
  // First, prepare our search options in URL format
  const queryParams = buildApiQueryParams({ apikey: TICKETMASTER_API_KEY }, params);
  // Then, combine the website address, the service we want, and our search options
  const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
  // Finally, convert TicketMaster's response into a format our code can use
  return response.json();
};

export const TicketMasterAPI = {
  /**
   * Search for events with various filters
   * @param params SearchParams object containing search criteria
   * @returns Promise with event search results
   */
  searchEvents: async (params: SearchParams) => {
    return fetchFromTicketMaster('events.json', params);
  },

  /**
   * Get detailed information about a specific event
   * @param eventId Unique event identifier
   * @returns Promise with event details
   */
  getEventById: async (eventId: string) => {
    try {
      // Get basic event details
      const eventResponse = await fetch(
        `${BASE_URL}/events/${eventId}?apikey=${TICKETMASTER_API_KEY}`
      );
      
      if (!eventResponse.ok) {
        throw new Error(`HTTP error! status: ${eventResponse.status}`);
      }
      
      const eventData = await eventResponse.json();

      // Extract price ranges from the main event data if available
      let priceRanges = [];
      
      if (eventData._embedded?.priceRanges) {
        priceRanges = eventData._embedded.priceRanges;
      } else if (eventData.priceRanges) {
        priceRanges = eventData.priceRanges;
      } else {
        // Default price ranges when none are available
        priceRanges = [{
          type: 'standard',
          currency: 'USD',
          min: 25,
          max: 75
        }];
      }

      return {
        ...eventData,
        priceRanges
      };

    } catch (error) {
      console.error('Error in getEventById:', error);
      throw error;
    }
  },

  /**
   * Get venue details by venue ID
   * @param venueId Unique venue identifier
   * @returns Promise with venue details
   */
  getVenueById: async (venueId: string) => {
    return fetchFromTicketMaster(`venues/${venueId}`);
  },

  /**
   * Search for venues with various filters
   * @param params VenueSearchParams object containing search criteria
   * @returns Promise with venue search results
   */
  searchVenues: async (params: VenueSearchParams) => {
    return fetchFromTicketMaster('venues', params);
  },

  /**
   * Get all available classifications (categories, genres, segments)
   * @returns Promise with classifications data
   */
  getClassifications: async () => {
    const response = await fetch(
      `${BASE_URL}/classifications?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get a specific classification by ID
   * @param classificationId Unique classification identifier
   * @returns Promise with classification details
   */
  getClassificationById: async (classificationId: string) => {
    const response = await fetch(
      `${BASE_URL}/classifications/${classificationId}?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get suggested events based on an event ID
   * @param eventId Unique event identifier
   * @returns Promise with suggested events
   */
  getSuggestedEvents: async (eventId: string) => {
    const response = await fetch(
      `${BASE_URL}/events/${eventId}/suggestions?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get all available genres
   * @returns Promise with genres data
   */
  getGenres: async () => {
    const response = await fetch(
      `${BASE_URL}/classifications/genres?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get details about a specific genre
   * @param genreId Unique genre identifier
   * @returns Promise with genre details
   */
  getGenreById: async (genreId: string) => {
    const response = await fetch(
      `${BASE_URL}/classifications/genres/${genreId}?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get all available segments (high-level categories)
   * @returns Promise with segments data
   */
  getSegments: async () => {
    const response = await fetch(
      `${BASE_URL}/classifications/segments?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get details about a specific segment
   * @param segmentId Unique segment identifier
   * @returns Promise with segment details
   */
  getSegmentById: async (segmentId: string) => {
    const response = await fetch(
      `${BASE_URL}/classifications/segments/${segmentId}?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get all available markets
   * @returns Promise with markets data
   */
  getMarkets: async () => {
    const response = await fetch(
      `${BASE_URL}/markets?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get details about a specific market
   * @param marketId Unique market identifier
   * @returns Promise with market details
   */
  getMarketById: async (marketId: string) => {
    const response = await fetch(
      `${BASE_URL}/markets/${marketId}?apikey=${TICKETMASTER_API_KEY}`
    );
    return await response.json();
  },

  /**
   * Get pricing information for a specific event
   * @param eventId Unique event identifier
   * @returns Promise with pricing information
   */
  getEventPrices: async (eventId: string) => {
    try {
      // Try to get price data from the main event endpoint instead
      const response = await fetch(
        `${BASE_URL}/events/${eventId}?apikey=${TICKETMASTER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract price information from the response
      let priceRanges = [];
      
      if (data._embedded?.priceRanges) {
        priceRanges = data._embedded.priceRanges;
      } else if (data.priceRanges) {
        priceRanges = data.priceRanges;
      } else {
        // Default price ranges when none are available
        priceRanges = [{
          type: 'standard',
          currency: 'USD',
          min: 25,
          max: 75
        }];
      }

      return { priceRanges };
    } catch (error) {
      console.error('Error in getEventPrices:', error);
      return { priceRanges: [] };
    }
  }
};

export default TicketMasterAPI;
