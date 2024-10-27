// search.tsx
// Maxwell Guillermo 

// START of search events page frontend & backend
// START of Maxwell Guillermo

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Image, TextInput, TouchableOpacity, Dimensions, FlatList, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import TopNavBar from '../../components/TopNavBar';
import BottomNavBar from '../../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import getUserPreferences from '../../components/getUserPreference';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import { getDistance } from 'geolib';
import axios from 'axios';

const TICKETMASTER_API_KEY = 'dUU6uAGlJCm1uSxAJJFjS8oeh1gPkaSe';
const GOOGLE_PLACES_API_KEY = 'AIzaSyAa8GhuQxxebW8Dw-2xMyFGnBA3R5IZHOc'; // Replace with your actual API key
const { width } = Dimensions.get('window');
const cardWidth = width * 0.38; // Reduced from 42% to 38% of screen width

// Add this near the top of your file, after other imports and constants
const genreMapping: { [key: string]: string } = {
  'Alternative': 'KnvZfZ7vAvv',
  'Ballads/Romantic': 'KnvZfZ7vAve',
  'Blues': 'KnvZfZ7vAvd',
  'Chanson Francaise': 'KnvZfZ7vAvA',
  'Classical': 'KnvZfZ7vAeJ',
  'Country': 'KnvZfZ7vAv6',
  'Dance/Electronic': 'KnvZfZ7vAvF',
  'Folk': 'KnvZfZ7vAva',
  'Hip-Hop/Rap': 'KnvZfZ7vAv1',
  'Holiday': 'KnvZfZ7vAvJ',
  'Jazz': 'KnvZfZ7vAvE',
  'Latin': 'KnvZfZ7vAJ6',
  'Medieval/Renaissance': 'KnvZfZ7vAvI',
  'Metal': 'KnvZfZ7vAvt',
  'New Age': 'KnvZfZ7vAvn',
  'Other': 'KnvZfZ7vAvl',
  'Pop': 'KnvZfZ7vAev',
  'R&B': 'KnvZfZ7vAee',
  'Reggae': 'KnvZfZ7vAed',
  'Religious': 'KnvZfZ7vAe7',
  'Rock': 'KnvZfZ7vAeA',
  'Soul': 'KnvZfZ7vAe6',
  'World': 'KnvZfZ7vAeF',
  'Undefined': 'KnvZfZ7v7le'
};

// Types
interface Event {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  dates?: {
    start?: {
      localDate: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      location?: {
        latitude: string;
        longitude: string;
      };
      city?: {
        name: string;
      };
    }>;
    attractions?: Array<{
      name: string;
    }>;
  };
  info?: string;
  classifications?: Array<{
    genre?: {
      name: string;
    };
  }>;
  distance?: number;
  relevanceScore?: number;
}


interface CachedEvents {
  timestamp: number;
  events: Event[];
}

const CACHE_EXPIRATION = 1000 * 60 * 60; // 1 hour

const searchEvents = async (query: string, genres: Set<string>, location: string, artists: string[], pageNumber: number = 0) => {
  const cacheKey = `events_${query}_${Array.from(genres).join(',')}_${location}_${artists.join(',')}_${pageNumber}`;
  const cachedData = await AsyncStorage.getItem(cacheKey);

  if (cachedData) {
    const { timestamp, events }: CachedEvents = JSON.parse(cachedData);
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      console.log('Returning cached events');
      return events;
    }
  }

  let allEvents: Event[] = [];

  // Search for favorite artists
  for (const artist of artists) {
    const artistUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(artist)}&size=10&page=${pageNumber}&classificationName=music`;
    try {
      const response = await fetch(artistUrl);
      const data = await response.json();
      if (data._embedded?.events) {
        allEvents = [...allEvents, ...data._embedded.events.map((event: Event) => ({ ...event, relevanceScore: 2 }))];
      }
    } catch (error) {
      console.error(`Error fetching events for artist ${artist}:`, error);
    }
  }

  // General search if needed
  if (allEvents.length < 50) {
    const genreIds = new Set(Array.from(genres).map(genre => genreMapping[genre]).filter(Boolean));
    const genreQuery = genreIds.size > 0 ? `&genreId=${Array.from(genreIds).join(',')}` : '';
    const locationQuery = location && location !== 'Everywhere' ? `&city=${encodeURIComponent(location)}` : '';
    const keywordQuery = query ? `&keyword=${encodeURIComponent(query)}` : '';
    
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}${keywordQuery}${genreQuery}${locationQuery}&size=${50 - allEvents.length}&page=${pageNumber}&classificationName=music`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data._embedded?.events) {
        allEvents = [...allEvents, ...data._embedded.events.map((event: Event) => ({ ...event, relevanceScore: 0 }))];
      }
    } catch (error) {
      console.error('Error fetching additional events:', error);
    }
  }

  // Cache the results
  await AsyncStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now(),
    events: allEvents
  }));

  return allEvents;
};

const genreList = [
  'EDM', 'Hip-Hop', 'Pop', 'Country', 'Jazz', 'R&B', 'Indie', 'Rock', 
  'Techno', 'Latin', 'Soul', 'Classical', 'J-Pop', 'K-Pop', 'Metal', 'Reggae'
];

interface EditPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  currentPreferences: Set<string>;
  currentLocation: string;
  onSave: (preferences: Set<string>, location: string) => void;
}

const EditPreferencesModal: React.FC<EditPreferencesModalProps> = ({ visible, onClose, currentPreferences, currentLocation, onSave }) => {
  const [tempPreferences, setTempPreferences] = useState(new Set(currentPreferences));
  const [tempLocation, setTempLocation] = useState(currentLocation);
  const googlePlacesRef = useRef<GooglePlacesAutocompleteRef>(null);

  useEffect(() => {
    setTempPreferences(new Set(currentPreferences));
    setTempLocation(currentLocation);
  }, [currentPreferences, currentLocation]);

  const toggleGenre = (genre: string) => {
    setTempPreferences(prev => {
      const newPreferences = new Set(prev);
      if (newPreferences.has(genre)) {
        newPreferences.delete(genre);
      } else {
        newPreferences.add(genre);
      }
      return newPreferences;
    });
  };

  const handleSave = () => {
    onSave(tempPreferences, tempLocation);
    // Remove the onClose() call from here as it's now handled in handleSavePreferences
  };

  const isApplyEnabled = tempLocation.trim() !== '' || tempPreferences.size > 0;

  // Render the modal component for editing search preferences
  return (
    <Modal
      animationType="slide" // Slide animation when opening/closing modal
      transparent={true} // Modal background is transparent
      visible={visible} // Controls modal visibility
      onRequestClose={onClose} // Handle back button/gesture on Android
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Search Preferences</Text>

          {/* Location selection section */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            
            {/* "Search Everywhere" quick select button */}
            <TouchableOpacity
              style={styles.everywhereButton}
              onPress={() => {
                setTempLocation('Everywhere');
                // Reset the Google Places input text if ref exists
                if (googlePlacesRef.current) {
                  googlePlacesRef.current.setAddressText('Everywhere');
                }
              }}
            >
              <Text style={styles.everywhereButtonText}>Search Everywhere</Text>
            </TouchableOpacity>

            {/* Google Places Autocomplete for location search */}
            <GooglePlacesAutocomplete
              ref={googlePlacesRef}
              placeholder="Search for a location"
              onPress={(data, details = null) => {
                setTempLocation(data.description);
              }}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                types: '(cities)', // Restrict to city-level results
              }}
              styles={{
                container: styles.autocompleteContainer,
                textInputContainer: styles.locationInput,
                textInput: styles.locationTextInput,
                listView: styles.autocompleteListView,
              }}
              fetchDetails={true}
              onFail={error => console.error(error)}
              textInputProps={{
                onChangeText: (text) => setTempLocation(text),
              }}
            />
          </View>

          {/* Genre selection section */}
          <Text style={styles.inputLabel}>Music Genres</Text>
          <FlatList
            data={genreList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.genreItem}
                onPress={() => toggleGenre(item)}
              >
                <Text style={styles.genreText}>{item}</Text>
                {/* Show checkmark icon for selected genres */}
                {tempPreferences.has(item) && (
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            style={styles.genreList}
          />

          {/* Action buttons container */}
          <View style={styles.buttonContainer}>
            {/* Cancel button */}
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            {/* Apply button - disabled if no location or genres selected */}
            <TouchableOpacity 
              style={[styles.button, !isApplyEnabled && styles.disabledButton]}
              onPress={handleSave}
              disabled={!isApplyEnabled}
            >
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper function to get the best quality image from an array of images
const getBestImage = (images: Array<{ url: string; width?: number; height?: number }>) => {
  // Sort images by resolution (width * height) in descending order, if available
  const sortedImages = images.sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
  return sortedImages[0]?.url || '';
};

// Utility Functions
/**
 * Converts full city names to their common abbreviations
 * Example: "New York" -> "NYC"
 */
const getCityAbbreviation = (cityName: string): string => {
  const cityAbbreviations: { [key: string]: string } = {
    'New York': 'NYC',
    'Los Angeles': 'LA',
    'San Francisco': 'SF',
    'Las Vegas': 'LV',
    'Chicago': 'CHI',
    'Miami': 'MIA',
    'Dallas': 'DAL',
    'Houston': 'HOU',
    'Washington': 'DC',
    'Boston': 'BOS',
    // Add more cities and their abbreviations as needed
  };

  return cityAbbreviations[cityName] || cityName.substring(0, 2).toUpperCase();
};

/**
 * Type guard to check if a preferences object contains extended preferences
 * Used to safely access similarGenres and similarArtists properties
 */
function hasExtendedPreferences(prefs: any): prefs is { similarGenres: string[], similarArtists: string[] } {
  return 'similarGenres' in prefs && 'similarArtists' in prefs;
}

// Main SearchEvents component
const SearchEvents = () => {
  // State management for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // User preferences state
  const [userGenres, setUserGenres] = useState<Set<string>>(new Set());
  const [tempGenres, setTempGenres] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchQuery);
  const [userPreferences, setUserPreferences] = useState<any>({});
  
  // Pagination and loading state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Location and search state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');

  // Track current active search criteria
  const [activeSearchCriteria, setActiveSearchCriteria] = useState({
    query: '',
    genres: new Set<string>(),
    location: '',
    artists: [] as string[]
  });

  // Fetch user's genre preferences from Firestore
  const fetchUserGenres = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const genres = new Set(userData.musicPreference || []);
        const userLocation = userData.location || '';
        console.log('Fetched user genres:', genres);
        console.log('Fetched user location:', userLocation);
        return { genres, location: userLocation };
      } else {
        console.log('User document does not exist');
      }
    } else {
      console.log('No user is currently logged in');
    }
    return { genres: new Set(), location: '' };
  }, []);

  // Effect to fetch user preferences and initial events
  useEffect(() => {
    const fetchUserPreferencesAndEvents = async () => {
      try {
        const preferences = await getUserPreferences();
        console.log('User preferences:', JSON.stringify(preferences, null, 2));
        setUserPreferences(preferences || {});
        
        if (preferences) {
          // Combine user's direct preferences with similar/recommended items
          const allGenres = new Set([
            ...(preferences.musicPreference || []),
            ...(hasExtendedPreferences(preferences) ? preferences.similarGenres : [])
          ]);
          const favoriteArtists = preferences.favoriteArtists?.map((artist: { name: string }) => artist.name) ?? [];
          const similarArtists = hasExtendedPreferences(preferences) ? preferences.similarArtists : [];
          const allArtists = [...favoriteArtists, ...similarArtists];
          
          // Log fetched preferences for debugging
          console.log('Genres:', Array.from(allGenres));
          console.log('Favorite artists:', favoriteArtists);
          console.log('Similar artists:', similarArtists);
          console.log('Location:', preferences.location);
          
          // Update active search criteria with fetched preferences
          setActiveSearchCriteria({
            query: '',
            genres: allGenres,
            location: preferences.location || '',
            artists: allArtists
          });
          
          // Fetch initial events based on preferences
          const initialEvents = await searchEvents(
            '',
            allGenres,
            preferences.location || '',
            favoriteArtists,
            0
          );
          
          // Filter and sort the fetched events
          const filteredAndSortedResults = filterAndSortEvents(initialEvents, preferences, userLocation);
          setEvents(filteredAndSortedResults);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        setUserPreferences({});
        setEvents([]);
      } finally {
        setIsInitialLoad(false);
        setLoading(false);
      }
    };
    fetchUserPreferencesAndEvents();
  }, [userLocation]);

  /**
   * Filters and sorts events based on user preferences and location
   * @param events - Array of events to filter and sort
   * @param userPreferences - User's preferences including favorite artists and genres
   * @param userLocation - User's current location coordinates
   * @returns Filtered and sorted array of events
   */
  const filterAndSortEvents = (events: Event[], userPreferences: any, userLocation: { latitude: number; longitude: number } | null): Event[] => {
    // Track artists we've already shown to avoid duplicates
    const seenArtists = new Set<string>();

    return events
      // Calculate distance from user for each event if location data available
      .map(event => {
        if (userLocation && event._embedded?.venues?.[0]?.location) {
          event.distance = getDistance(
            userLocation,
            { 
              latitude: parseFloat(event._embedded.venues[0].location.latitude), 
              longitude: parseFloat(event._embedded.venues[0].location.longitude) 
            }
          );
        }
        return event;
      })
      // Sort events by relevance score, distance, and date
      .sort((a, b) => {
        // Primary sort by relevance score (higher scores first)
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore! - a.relevanceScore!;
        }

        // Secondary sort by distance if available
        if (a.distance && b.distance && a.distance !== b.distance) {
          return a.distance - b.distance;
        }

        // Tertiary sort by date
        const dateA = new Date(a.dates?.start?.localDate || '');
        const dateB = new Date(b.dates?.start?.localDate || '');
        return dateA.getTime() - dateB.getTime();
      })
      // Filter out duplicate artists while keeping non-favorite artist events
      .filter(event => {
        const artistName = event._embedded?.attractions?.[0]?.name;
        if (artistName && !seenArtists.has(artistName)) {
          seenArtists.add(artistName);
          return true;
        }
        return event.relevanceScore !== 2; // Keep events that aren't from favorite artists
      })
      .slice(0, 35); // Limit results to 35 events
  };

  /**
   * Handles the search operation when search criteria changes
   * Fetches new events and updates the UI accordingly
   */
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    setHasMore(true);
    try {
      const { query, genres, location, artists } = activeSearchCriteria;
      const searchResults = await searchEvents(query, genres, location, artists, 0);
      const filteredAndSortedResults = filterAndSortEvents(searchResults, { ...userPreferences, location }, userLocation);
      setEvents(filteredAndSortedResults);
    } catch (error) {
      console.error('Error searching events:', error);
      setError('Error searching events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [activeSearchCriteria, userPreferences, userLocation]);

  /**
   * Triggers a new search when the search input changes
   * Updates search criteria and initiates search
   */
  const triggerSearch = useCallback(() => {
    setActiveSearchCriteria(prev => ({
      ...prev,
      query: searchInputValue
    }));
    handleSearch();
  }, [searchInputValue, handleSearch]);

  /**
   * Loads more events when user scrolls to bottom
   * Fetches next page of results and appends them to existing events
   */
  const loadMoreEvents = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const moreEvents = await searchEvents(
        searchInputValue, 
        tempGenres, 
        location, 
        userPreferences?.favoriteArtists?.map((artist: { name: string }) => artist.name) ?? [], 
        nextPage
      );
      if (moreEvents.length > 0) {
        setEvents(prevEvents => [...prevEvents, ...moreEvents]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, page, searchInputValue, tempGenres, location, userPreferences]);

  /**
   * Handles the edit preferences button press
   * Fetches current user genres and location and opens the edit modal
   */
  const handleEditPress = async () => {
    const { genres, location } = await fetchUserGenres();
    setTempGenres(genres as Set<string>);
    setLocation(location);
    setIsModalVisible(true);
  };

  const handleSavePreferences = async (newPreferences: Set<string>, newLocation: string) => {
    // Update state using callbacks to ensure we're working with the latest state
    setTempGenres(prev => new Set(newPreferences));
    setLocation(prev => newLocation);
    setSearchInputValue('');
    
    const updatedCriteria = {
      query: '',
      genres: newPreferences,
      location: newLocation,
      artists: [] // Reset artists to empty array
    };

    // Use a callback to ensure we're working with the latest state
    setActiveSearchCriteria(prev => ({
      ...prev,
      ...updatedCriteria
    }));

    setUserPreferences((prev: any) => ({
      ...prev,
      musicPreference: Array.from(newPreferences),
      location: newLocation
    }));

    // Clear all cached event data
    const keys = await AsyncStorage.getAllKeys();
    const eventCacheKeys = keys.filter(key => key.startsWith('events_'));
    await AsyncStorage.multiRemove(eventCacheKeys);

    // Use the updated criteria directly in the search
    await searchEventsWithCriteria(updatedCriteria);

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
        location: newLocation,
        musicPreference: Array.from(newPreferences)
      });
    }

    // Close the modal
    setIsModalVisible(false);
  };

  // New function to search events with given criteria
  const searchEventsWithCriteria = async (criteria: {
    query: string,
    genres: Set<string>,
    location: string,
    artists: string[]
  }) => {
    setLoading(true);
    setError(null);
    setPage(0);
    setHasMore(true);
    try {
      const { query, genres, location, artists } = criteria;
      const searchResults = await searchEvents(query, genres, location, artists, 0);
      const filteredAndSortedResults = filterAndSortEvents(searchResults, { location }, userLocation);
      setEvents(filteredAndSortedResults);
    } catch (error) {
      console.error('Error searching events:', error);
      setError('Error searching events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  type TicketmasterEvent = {
    id: string;

  };


  const handleEventPress = (event: { id: string; [key: string]: any }) => {
    const eventData = {
      id: event.id,
      name: event.name,
      date: event.dates.start.localDate,
      imageUrl: event.images[0].url,
      venue: event._embedded.venues[0].name,
      info: event.info || '',
    };
    router.push({
      pathname: '/events/event-details',
      params: { eventData: JSON.stringify(eventData) }
    });
  };

  // Main component for rendering individual event cards in a grid layout
  // Takes an Event object as input and returns a TouchableOpacity card component
  const renderEvent = ({ item }: { item: Event }) => {
    // Validate that required event data exists before rendering
    // Returns null if any essential data is missing to prevent errors
    if (!item || !item.name || !item.dates || !item.dates.start || !item._embedded || !item._embedded.venues) {
      console.log('Skipping event due to missing data:', item);
      return null;
    }

    // Extract venue and city information from the event data
    // Format the location string with city abbreviation if available
    const venueName = item._embedded.venues[0]?.name;
    const cityName = item._embedded.venues[0]?.city?.name;
    const cityAbbr = cityName ? getCityAbbreviation(cityName) : '';
    const venueAndCity = venueName && cityAbbr ? `${venueName}, ${cityAbbr}` : venueName || 'Venue not specified';

    // Return the event card component wrapped in a TouchableOpacity for tap handling
    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={() => handleEventPress(item)} // Navigate to event details on tap
      >
        <View style={styles.card}>
          {/* Container for the event image */}
          <View style={styles.imageContainer}>
            {/* Render event image if available */}
            {item.images && item.images.length > 0 && (
              <Image 
                source={{ uri: getBestImage(item.images) }} // Get optimal image from available options
                style={styles.image}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
        {/* Display formatted event date */}
        <Text style={styles.date}>{formatDate(item.dates.start.localDate)}</Text>
        {/* Display venue location with icon */}
        <View style={styles.venueContainer}>
          <Ionicons name="location-outline" size={10} color="#000000" />
          <Text style={styles.venue}>{venueAndCity}</Text>
        </View>
        {/* Show distance from user if available */}
        {item.distance && (
          <Text style={styles.distance}>{(item.distance / 1000).toFixed(1)} km away</Text>
        )}
        {/* Show artist name for favorite artist events */}
        {item.relevanceScore === 2 && item._embedded?.attractions?.[0]?.name && (
          <Text style={styles.relevance}>{item._embedded.attractions[0].name}</Text>
        )}
        {/* Show "Similar Artist" label for recommended events */}
        {item.relevanceScore === 1 && (
          <Text style={styles.relevance}>Similar Artist</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Effect to handle search input changes
  // Triggers search when debounced search term updates
  useEffect(() => {
    if (debouncedSearchTerm !== searchInputValue) {
      setDebouncedSearchTerm(searchInputValue);
      setActiveSearchCriteria(prev => ({
        ...prev,
        query: searchInputValue
      }));
      handleSearch();
    }
  }, [searchInputValue, handleSearch]);

  // Effect to log number of events when events state changes
  useEffect(() => {
    console.log('Events in state:', events.length);
  }, [events]);

  // Memoized events array to prevent unnecessary re-renders
  const sortedAndFilteredEvents = useMemo(() => {
    return events;
  }, [events]);

  // Function to get user's current location using browser geolocation
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setUserLocation(null);
    }
  }, []);

  // Effect to get user location when component mounts
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Helper function to compare distances between two events and user location
  const isEventCloser = (event1: Event, event2: Event): boolean => {
    if (!userLocation || !event1._embedded?.venues?.[0] || !event2._embedded?.venues?.[0]) return false;

    const venue1 = event1._embedded.venues[0];
    const venue2 = event2._embedded.venues[0];

    if (!venue1.location?.latitude || !venue1.location?.longitude || 
        !venue2.location?.latitude || !venue2.location?.longitude) return false;

    const distance1 = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: parseFloat(venue1.location.latitude), longitude: parseFloat(venue1.location.longitude) }
    );

    const distance2 = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: parseFloat(venue2.location.latitude), longitude: parseFloat(venue2.location.longitude) }
    );

    return distance1 < distance2;
  };

  // Log event IDs for debugging
  console.log('Event IDs:', sortedAndFilteredEvents.map(event => event.id));

  // Render main component UI
  return (
    <SafeAreaView style={styles.pageContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      {/* Search bar section */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchInputValue}
            onChangeText={setSearchInputValue}
            onSubmitEditing={triggerSearch}
          />
          <TouchableOpacity onPress={triggerSearch} style={styles.searchButton}>
            <Ionicons name="search" size={18} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
            <Ionicons name="create-outline" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Suggestions</Text>
      {/* Show loading indicator or event list */}
      {isInitialLoad || loading ? (
        <ActivityIndicator size="large" color="#79ce54" style={styles.loader} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          onEndReached={loadMoreEvents}
          onEndReachedThreshold={0.1}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator size="large" color="#79ce54" /> : null}
          ListEmptyComponent={<View style={styles.emptyBuffer} />}
        />
      )}
      <BottomNavBar />
      {/* Modal for editing search preferences */}
      <EditPreferencesModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        currentPreferences={new Set(tempGenres)}
        currentLocation={location}
        onSave={(newPreferences, newLocation) => handleSavePreferences(new Set(newPreferences), newLocation)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  searchWrapper: {
    alignItems: 'center',
    marginTop: 13, // Increased top margin
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 20,
    width: '40%',
    height: 20,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 5,
    paddingRight: 25,
  },
  searchIcon: {
    position: 'absolute',
    right: 10,
  },
  editButton: {
    position: 'absolute',
    right: -33,
    padding: 2,
    marginTop: 50, // Add some padding for easier tapping
  },
  sectionTitle: {
    marginLeft: 67,
    marginRight: 30, // Add right margin
    fontSize: 18,
    fontWeight: 'bold',
    color: '#79ce54',
    marginBottom: 0,
    marginTop: 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    paddingBottom: 100, // Add extra padding at the bottom
  },
  container: {
    width: cardWidth,
    marginBottom: 15,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff8f0',
    borderRadius: 0,
    overflow: 'hidden',
    aspectRatio: 1,
    padding: 6, // Reduced padding to make image smaller
    width: '87%', // Reduced width to make image smaller
  },
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    aspectRatio: 16 / 9, // Maintain a 16:9 aspect ratio
  },
  date: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fc6c85',
    marginTop: 4,
    textAlign: 'center',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  venue: {
    fontSize: 10,
    fontWeight: '500',
    color: '#37bdd5',
    marginLeft: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  everywhereButton: {
    backgroundColor: '#79ce54',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 5,
  },
  everywhereButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  autocompleteContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  locationTextInput: {
    height: 35,
    fontSize: 14,
    paddingHorizontal: 8,
  },
  autocompleteListView: {
    maxHeight: 100,
  },
  genreList: {
    maxHeight: 150,
  },
  genreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  genreText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 8,
    backgroundColor: '#79ce54',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  eventContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  eventImage: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 5,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#37bdd5',
    marginBottom: 3,
  },
  eventVenue: {
    fontSize: 14,
    color: '#666',
  },
  eventList: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  eventRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eventItem: {
    width: '48%', // Adjust this value as needed to fit your layout
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listFooter: {
    height: 100, // Add extra space at the bottom of the list
  },
  distance: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  relevance: {
    fontSize: 10,
    color: '#79ce54',
    marginTop: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  emptyBuffer: {
    height: 100, // Adjust as needed
  },
  searchButton: {
    padding: 0,
  },
});

export default SearchEvents;

// search.tsx
// Maxwell Guillermo 

// END of search events page frontend & backend
// END of Maxwell Guillermo

