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

const TICKETMASTER_API_KEY = 'NmyRpAYBV0T5oqLqGf4kghGLiFLB2NB0';
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

const searchEvents = async (query: string, genres: Set<string>, location: string, artists: string[], similarArtists: string[], pageNumber: number = 0) => {
  const cacheKey = `events_${query}_${Array.from(genres).join(',')}_${location}_${artists.join(',')}_${similarArtists.join(',')}_${pageNumber}`;
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
  // Search for similar artists
  for (const artist of similarArtists) {
    if (allEvents.length >= 50) break;
    const artistUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(artist)}&size=10&page=${pageNumber}&classificationName=music`;
    try {
      const response = await fetch(artistUrl);
      const data = await response.json();
      if (data._embedded?.events) {
        allEvents = [...allEvents, ...data._embedded.events.map((event: Event) => ({ ...event, relevanceScore: 1 }))];
      }
    } catch (error) {
      console.error(`Error fetching events for similar artist ${artist}:`, error);
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
    onClose();
  };

  const isApplyEnabled = tempLocation.trim() !== '' || tempPreferences.size > 0;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Search Preferences</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TouchableOpacity
              style={styles.everywhereButton}
              onPress={() => {
                setTempLocation('Everywhere');
                if (googlePlacesRef.current) {
                  googlePlacesRef.current.setAddressText('Everywhere');
                }
              }}
            >
              <Text style={styles.everywhereButtonText}>Search Everywhere</Text>
            </TouchableOpacity>
            <GooglePlacesAutocomplete
              ref={googlePlacesRef}
              placeholder="Search for a location"
              onPress={(data, details = null) => {
                setTempLocation(data.description);
              }}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                types: '(cities)',
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
          <Text style={styles.inputLabel}>Music Genres</Text>
          <FlatList
            data={genreList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.genreItem}
                onPress={() => toggleGenre(item)}
              >
                <Text style={styles.genreText}>{item}</Text>
                {tempPreferences.has(item) && (
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            style={styles.genreList}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
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

const getBestImage = (images: Array<{ url: string; width?: number; height?: number }>) => {
  // Sort images by resolution (width * height) in descending order, if available
  const sortedImages = images.sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
  return sortedImages[0]?.url || '';
};

const SearchEvents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [userGenres, setUserGenres] = useState<Set<string>>(new Set());
  const [tempGenres, setTempGenres] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchQuery);
  const [userPreferences, setUserPreferences] = useState<any>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  useEffect(() => {
    const fetchUserPreferencesAndEvents = async () => {
      try {
        const preferences = await getUserPreferences();
        console.log('User preferences:', JSON.stringify(preferences, null, 2));
        setUserPreferences(preferences || {});  // Ensure it's always an object
        if (preferences) {
          const allGenres = [...new Set([
            ...preferences.musicPreference,
            ...('similarGenres' in preferences ? preferences.similarGenres : [])
          ])];
          const allArtists = [
            ...(preferences.favoriteArtists?.map((artist: { name: string }) => artist.name) ?? []),
            ...('similarArtists' in preferences ? preferences.similarArtists : [])
          ];
          console.log('Searching with genres:', allGenres);
          console.log('Searching with artists:', allArtists);
          handleSearch('', new Set(allGenres), preferences.location, allArtists); 
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        setUserPreferences({});  // Set to empty object on error
      }
    };
    fetchUserPreferencesAndEvents();
  }, []);

  const filterAndSortEvents = (events: Event[], userPreferences: any, userLocation: { latitude: number; longitude: number } | null): Event[] => {
    const seenArtists = new Set<string>();

    return events
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
      .sort((a, b) => {
        // Sort by relevance score first
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore! - a.relevanceScore!;
        }

        // Then by distance if available
        if (a.distance && b.distance && a.distance !== b.distance) {
          return a.distance - b.distance;
        }

        // Finally by date
        const dateA = new Date(a.dates?.start?.localDate || '');
        const dateB = new Date(b.dates?.start?.localDate || '');
        return dateA.getTime() - dateB.getTime();
      })
      .filter(event => {
        const artistName = event._embedded?.attractions?.[0]?.name;
        if (artistName && !seenArtists.has(artistName)) {
          seenArtists.add(artistName);
          return true;
        }
        return event.relevanceScore !== 2; // Keep non-favorite artist events
      })
      .slice(0, 35);
  };

  const handleSearch = useCallback(async (text: string, genres: Set<string>, location: string, artists: string[]) => {
    setLoading(true);
    setError(null);
    setPage(0);
    setHasMore(true);
    try {
      const preferences = await getUserPreferences();
      setUserPreferences(preferences);

      const similarArtists = preferences && typeof preferences === 'object' && 'similarArtists' in preferences ? preferences.similarArtists : [];
      const searchResults = await searchEvents(text, genres, location, artists, similarArtists, 0);
      console.log('Before filtering:', searchResults.length);
      const filteredAndSortedResults = filterAndSortEvents(searchResults, preferences, userLocation); 
      console.log('After filtering and sorting:', filteredAndSortedResults.length);
      setEvents(filteredAndSortedResults);
    } catch (error) {
      console.error('Error searching events:', error);
      setError('Error searching events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  const triggerSearch = useCallback(() => {
    handleSearch(searchInputValue, tempGenres, location, userPreferences?.favoriteArtists?.map((artist: { name: string }) => artist.name) ?? []);
  }, [handleSearch, searchInputValue, tempGenres, location, userPreferences]);

  const loadMoreEvents = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const similarArtists = userPreferences && typeof userPreferences === 'object' && 'similarArtists' in userPreferences 
        ? userPreferences.similarArtists 
        : [];
      const moreEvents = await searchEvents(
        searchInputValue, 
        tempGenres, 
        location, 
        userPreferences?.favoriteArtists?.map((artist: { name: string }) => artist.name) ?? [], 
        similarArtists, 
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

  const handleEditPress = async () => {
    const { genres, location } = await fetchUserGenres();
    setTempGenres(genres as Set<string>);
    setLocation(location);
    setIsModalVisible(true);
  };

  const handleSavePreferences = async (newPreferences: Set<string>, newLocation: string) => {
    setTempGenres(new Set(newPreferences));
    setLocation(newLocation);
    
    setSearchInputValue('');
    
    if (newPreferences.size === 0) {
      setEvents([]);
    } else {
      triggerSearch();
    }

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
        location: newLocation,
        musicPreference: Array.from(newPreferences)
      });
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

  // This component renders individual event cards in a grid layout
  // Each card displays an event image, date, and venue
  // The layout is designed to show two cards per row
  const renderEvent = ({ item }: { item: Event }) => {
    if (!item || !item.name || !item.dates || !item.dates.start || !item._embedded || !item._embedded.venues) {
      console.log('Skipping event due to missing data:', item);
      return null;
    }

    const venueName = item._embedded.venues[0]?.name;

    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={() => handleEventPress(item)}
      >
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            {item.images && item.images.length > 0 && (
              <Image 
                source={{ uri: getBestImage(item.images) }} 
                style={styles.image}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
        <Text style={styles.date}>{formatDate(item.dates.start.localDate)}</Text>
        {venueName && (
          <View style={styles.venueContainer}>
            <Ionicons name="location-outline" size={10} color="#000000" />
            <Text style={styles.venue}>{venueName}</Text>
          </View>
        )}
        {item.distance && (
          <Text style={styles.distance}>{(item.distance / 1000).toFixed(1)} km away</Text>
        )}
        {item.relevanceScore === 2 && item._embedded?.attractions?.[0]?.name && (
          <Text style={styles.relevance}>{item._embedded.attractions[0].name}</Text>
        )}
        {item.relevanceScore === 1 && (
          <Text style={styles.relevance}>Similar Artist</Text>
        )}
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (debouncedSearchTerm !== searchInputValue) {
      setDebouncedSearchTerm(searchInputValue);
    }
  }, [searchInputValue]);

  useEffect(() => {
    console.log('Events in state:', events.length);
  }, [events]);

  const sortedAndFilteredEvents = useMemo(() => {
    return events;
  }, [events]);

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
          setUserLocation(null); // or set a default location
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setUserLocation(null); // or set a default location
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

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

  console.log('Event IDs:', sortedAndFilteredEvents.map(event => event.id));

  return (
    <SafeAreaView style={styles.pageContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
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
      {loading ? (
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
    marginTop: 20, // Increased top margin
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
    height: 23,
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
    marginBottom: 27.5,
    marginTop: 15.5,
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
