// search.tsx
// Maxwell Guillermo and Mariann Grace Dizon

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
import getBestImage from '../../utils/imageUtils';

const TICKETMASTER_API_KEY = 'dUU6uAGlJCm1uSxAJJFjS8oeh1gPkaSe';
const GOOGLE_PLACES_API_KEY = 'AIzaSyAa8GhuQxxebW8Dw-2xMyFGnBA3R5IZHOc'; // Replace with your actual API key
const { width } = Dimensions.get('window');
const cardWidth = 135; // Keep original card size

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

// Add this function before using it
const hasExtendedPreferences = (preferences: any): boolean => {
  return !!(preferences.similarGenres || preferences.similarArtists);
};

// Main SearchEvents component
const SearchEvents = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
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
            ...((preferences as any).similarGenres || [])
          ]);
          const favoriteArtists = preferences.favoriteArtists?.map((artist: { name: string }) => artist.name) ?? [];
          const similarArtists = (preferences as any).similarArtists ?? [];
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
    const isLongVenue = venueAndCity.length > 25;

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
          <Text style={[
            styles.venue, 
            isLongVenue && styles.smallVenue
          ]} numberOfLines={1}>
            {venueAndCity}
          </Text>
        </View>
        {/* Show distance from user if available */}
        {item.distance && (
          <Text style={styles.distance}>{(item.distance / 1000).toFixed(1)} km away</Text>
        )}
        {/* Show artist name for favorite artist events */}
        {item.relevanceScore === 2 && item._embedded?.attractions?.[0]?.name && (
          <Text style={styles.artistName} numberOfLines={1} ellipsizeMode="tail">
            {item._embedded.attractions[0].name}
          </Text>
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

  // START of Mariann Grace Dizon Contribution
  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsDarkMode(userData.themePreference === 'dark'); // Set dark mode based on themePreference
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);
  // END of Mariann Grace Dizon Contribution

  // Render main component UI
  return (
    <SafeAreaView style={[styles.pageContainer, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      {/* Search bar section */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#333' : '#fff', borderColor: isDarkMode ? '#fff' : '#000' }]}>
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#000' }]}
            placeholder="Search events..."
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={searchInputValue}
            onChangeText={setSearchInputValue}
            onSubmitEditing={triggerSearch}
          />
          <TouchableOpacity onPress={triggerSearch} style={styles.searchButton}>
            <Ionicons name="search" size={14} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
            <Ionicons name="create-outline" size={18} color={isDarkMode ? '#fff' : '#000'} />
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
          numColumns={2}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventGrid}
          columnWrapperStyle={styles.row}
          ListFooterComponent={<View style={styles.emptyBuffer} />}
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
    flex: 1, // Makes container take up full screen height
    backgroundColor: '#fff8f0', // Sets cream colored background
  },
  searchWrapper: {
    alignItems: 'center', // Centers search bar horizontally
    paddingTop: 30, // Adds space above search bar
    marginBottom: -5, // Reduces space below search bar
  },
  searchContainer: {
    flexDirection: 'row', // Places search elements in a horizontal line
    alignItems: 'center', // Vertically centers items in search bar
    backgroundColor: '#fff', // White background for search bar
    borderWidth: 2, // Adds border around search bar
    borderColor: '#000', // Black border color
    borderRadius: 20, // Rounds corners of search bar
    width: '50%', // Increased width to make the search bar larger
    height: 30, // Increased height for a larger search bar
    paddingHorizontal: 13, // Adjusted padding for better spacing
  },
  searchInput: {
    flex: 1, // Makes input take up remaining space
    fontSize: 10, // Increased font size for better readability
    paddingVertical: 5, // Adds vertical padding inside input
    paddingRight: 25, // Adds space for search icon
  },
  searchIcon: {
    position: 'absolute', // Positions icon relative to container
    right: 10, // Places icon 10 units from right
  },
  editButton: {
    position: 'absolute', // Positions button relative to container
    right: -33, // Places button outside search container
    padding: 2, // Adds padding around edit icon
    marginTop: 50, // Moves button down for tapping
  },
  sectionTitle: {
    fontSize: 15, // Sets size of section title
    fontWeight: 'bold', // Makes title text bold
    color: '#79ce54', // Sets green color for title
    marginBottom: 0, // Removes space below title
    marginLeft: 85, // Positions title from left edge
    marginTop: 30, // Adds space above title
  },
  scrollViewContent: {
    flexGrow: 1, // Allows content to expand
    paddingBottom: 100, // Adds padding at bottom of scroll view
  },
  grid: {
    flexDirection: 'row', // Arranges items horizontally
    flexWrap: 'wrap', // Allows items to wrap to next line
    justifyContent: 'center', // Centers items horizontally
    paddingVertical: 10, // Adds vertical padding to grid
    paddingHorizontal: 30, // Adds horizontal padding to grid
    paddingBottom: 100, // Extra padding at bottom
  },
  container: {
    width: cardWidth, // Sets fixed width for event containers
    marginBottom: 15, // Adds space between rows
    alignItems: 'center', // Centers items horizontally
    marginHorizontal: 0, // Removes horizontal margins
  },
  card: {
    backgroundColor: 'transparent', // Sets cream background for cards
    borderRadius: 0, // Removes corner rounding
    overflow: 'hidden', // Clips content to card bounds
    aspectRatio: 1, // Makes cards square
    padding: 6, // Adds padding inside cards
    width: '87%', // Sets card width relative to container
  },
  imageContainer: {
    flex: 1, // Takes up available space
    overflow: 'hidden', // Clips image to container
  },
  image: {
    width: '100%', // Makes image fill container width
    height: '100%', // Makes image fill container height
    resizeMode: 'cover', // Scales image to cover container
    borderRadius: 0, // Removes image corner rounding
  },
  date: {
    fontSize: 11, // Sets date text size
    fontWeight: '800', // Makes date text extra bold
    color: '#FF69B4', // Sets pink color for date
    marginTop: 4, // Adds space above date
    textAlign: 'center', // Centers date text
    width: '100%', // Makes date take full width
  },
  venueContainer: {
    flexDirection: 'row', // Arranges venue elements horizontally
    alignItems: 'center', // Centers items vertically
    justifyContent: 'center', // Centers items horizontally
    marginTop: 2, // Adds space above venue
    paddingHorizontal: 10, // Adds horizontal padding
    width: '100%', // Takes full width
  },
  venue: {
    fontSize: 10, // Sets venue text size
    fontWeight: '500', // Makes venue text medium weight
    color: '#37bdd5', // Sets blue color for venue
    marginLeft: 2, // Adds space to left of venue
    textAlign: 'center', // Centers venue text
    flexShrink: 1, // Allows text to shrink if needed
  },
  smallVenue: {
    fontSize: 8, // Smaller text for long venue names
  },
  artistName: {
    fontSize: 11, // Sets artist name text size
    color: '#79ce54', // Sets green color for artist name
    textAlign: 'center', // Centers artist name
    width: '100%', // Takes full width
    marginTop: 2, // Adds space above artist name
  },
  loader: {
    flex: 1, // Takes up available space
    justifyContent: 'center', // Centers spinner vertically
    alignItems: 'center', // Centers spinner horizontally
  },
  errorText: {
    fontSize: 16, // Sets error text size
    color: 'red', // Sets red color for errors
    textAlign: 'center', // Centers error text
    marginTop: 20, // Adds space above error
  },
  noResultsText: {
    fontSize: 16, // Sets no results text size
    color: '#666', // Sets gray color for no results
    textAlign: 'center', // Centers no results text
    marginTop: 20, // Adds space above no results
  },
  modalContainer: {
    flex: 1, // Takes up full screen
    justifyContent: 'center', // Centers modal vertically
    alignItems: 'center', // Centers modal horizontally
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#fff', // White background for modal
    padding: 15, // Adds padding inside modal
    borderRadius: 10, // Rounds modal corners
    width: '80%', // Sets modal width
    maxHeight: '80%', // Limits modal height
  },
  modalTitle: {
    fontSize: 18, // Sets modal title size
    fontWeight: 'bold', // Makes title bold
    marginBottom: 10, // Adds space below title
    textAlign: 'center', // Centers title text
  },
  inputContainer: {
    marginBottom: 10, // Adds space below inputs
  },
  inputLabel: {
    fontSize: 14, // Sets input label size
    fontWeight: 'bold', // Makes labels bold
    marginBottom: 5, // Adds space below labels
  },
  everywhereButton: {
    backgroundColor: '#79ce54', // Sets green background
    padding: 8, // Adds padding inside button
    borderRadius: 5, // Rounds button corners
    alignItems: 'center', // Centers button content
    marginBottom: 5, // Adds space below button
  },
  everywhereButtonText: {
    color: '#fff', // White text color
    fontWeight: 'bold', // Makes button text bold
    fontSize: 12, // Sets button text size
  },
  autocompleteContainer: {
    flex: 0, // Prevents container from growing
    position: 'relative', // For positioning dropdown
    zIndex: 1, // Places dropdown above other content
  },
  locationInput: {
    borderWidth: 1, // Adds border around input
    borderColor: '#ccc', // Sets light gray border
    borderRadius: 5, // Rounds input corners
  },
  locationTextInput: {
    height: 35, // Sets input height
    fontSize: 14, // Sets input text size
    paddingHorizontal: 8, // Adds horizontal padding
  },
  autocompleteListView: {
    maxHeight: 100, // Limits dropdown height
  },
  genreList: {
    maxHeight: 150, // Limits genre list height
  },
  genreItem: {
    flexDirection: 'row', // Arranges genre items horizontally
    justifyContent: 'space-between', // Spaces items evenly
    alignItems: 'center', // Centers items vertically
    paddingVertical: 8, // Adds vertical padding
    borderBottomWidth: 1, // Adds bottom border
    borderBottomColor: '#eee', // Light gray border
  },
  genreText: {
    fontSize: 14, // Sets genre text size
  },
  buttonContainer: {
    flexDirection: 'row', // Arranges buttons horizontally
    justifyContent: 'space-between', // Spaces buttons evenly
    marginTop: 10, // Adds space above buttons
  },
  button: {
    flex: 1, // Makes buttons equal width
    marginHorizontal: 5, // Adds space between buttons
    padding: 8, // Adds padding inside buttons
    backgroundColor: '#79ce54', // Sets green background
    borderRadius: 5, // Rounds button corners
    alignItems: 'center', // Centers button content
  },
  buttonText: {
    color: '#fff', // White text color
    fontWeight: 'bold', // Makes button text bold
    fontSize: 12, // Sets button text size
  },
  disabledButton: {
    backgroundColor: '#ccc', // Gray background for disabled
  },
  eventContainer: {
    flexDirection: 'row', // Arranges event items horizontally
    padding: 10, // Adds padding around events
    borderBottomWidth: 1, // Adds bottom border
    borderBottomColor: '#ccc', // Light gray border
  },
  eventImage: {
    width: 80, // Sets event image width
    height: 80, // Sets event image height
    marginRight: 10, // Adds space right of image
    borderRadius: 5, // Rounds image corners
  },
  eventDetails: {
    flex: 1, // Takes remaining space
    justifyContent: 'center', // Centers content vertically
  },
  eventName: {
    fontSize: 16, // Sets event name size
    fontWeight: 'bold', // Makes name bold
    marginBottom: 5, // Adds space below name
  },
  eventDate: {
    fontSize: 14, // Sets date text size
    color: '#37bdd5', // Sets blue color for date
    marginBottom: 3, // Adds space below date
  },
  eventVenue: {
    fontSize: 14, // Sets venue text size
    color: '#666', // Sets gray color for venue
  },
  eventList: {
    paddingHorizontal: 10, // Adds horizontal padding
    paddingTop: 10, // Adds top padding
  },
  eventRow: {
    justifyContent: 'space-between', // Spaces events evenly
    marginBottom: 20, // Adds space below rows
  },
  eventItem: {
    width: '48%', // Sets event width to roughly half
    marginBottom: 10, // Adds space below items
  },
  row: {
    justifyContent: 'center', // Centers items horizontally
    gap: 0, // Removes gap between cards
    width: '100%', // Takes full width
  },
  listFooter: {
    height: 100, // Adds space at list bottom
  },
  distance: {
    fontSize: 10, // Sets distance text size
    color: '#666', // Sets gray color for distance
    marginTop: 2, // Adds space above distance
  },
  relevance: {
    fontSize: 10, // Sets relevance text size
    color: '#79ce54', // Sets green color for relevance
    marginTop: 2, // Adds space above relevance
    textAlign: 'center', // Centers relevance text
    flexWrap: 'wrap', // Allows text to wrap
  },
  emptyBuffer: {
    height: 100, // Adds space at bottom
  },
  searchButton: {
    padding: 0, // Removes padding from search button
  },
  eventGrid: {
    paddingHorizontal: 20, // Adds horizontal padding
    marginTop: 25, // Adds space above grid
    paddingBottom: 100, // Adds padding at bottom
  },
});

export default SearchEvents;

// search.tsx
// Maxwell Guillermo 

// END of search events page frontend & backend
// END of Maxwell Guillermo

const getCityAbbreviation = (cityName: string): string => {
  return cityName.length > 12 ? cityName.substring(0, 12) + '...' : cityName;
};

