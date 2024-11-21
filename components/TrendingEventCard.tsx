// TrendingEvents.tsx
// Maxwell Guillermo & Mariann Grace Dizon

// START of TrendingEvents UI/UX
// START of Maxwell Guillermo Contribution

import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserFavoriteArtists } from './getUserFavoriteArtists';
import { TicketMasterAPI } from '../api/ticket-master-api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the path as necessary

// Define the structure for event data
interface Event {
  id: string;      // Add this line
  title: string;      // Name of the event/concert
  date: string;       // Date of the event
  venue: string;      // Location where event will be held
  imageUrl: string;   // URL for event promotional image
  artist: string;     // Name of the performing artist
}

// Fallback image if no event image is available
const DEFAULT_IMAGE = 'https://via.placeholder.com/215';

// Add this helper function at the top of the file, after the imports
const getBestImage = (images: any[]) => {
  if (!images || images.length === 0) return DEFAULT_IMAGE;
  
  // First, try to find a 4:3 ratio image with the highest resolution
  const squareImages = images.filter(img => 
    img.ratio === '4_3' || 
    (img.width && img.height && Math.abs(img.width / img.height - 1.33) < 0.1)
  );

  if (squareImages.length > 0) {
    // Sort by resolution and return the highest
    return squareImages.sort((a, b) => 
      (b.width * b.height) - (a.width * a.height)
    )[0].url;
  }

  // If no 4:3 images, sort all images by resolution and return the highest
  return images.sort((a, b) => 
    ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0))
  )[0].url;
};

// Sub-component to display event details (title, date, venue)
const EventInfoContainer = ({ title, date, venue, formatDate, event, onFavorite, isFavorite, isDarkMode }: { 
  title: string; 
  date: string; 
  venue: string;
  formatDate?: (date: string) => string;
  event: Event;
  onFavorite: (event: Event) => void;
  isFavorite: boolean;
  isDarkMode: boolean;
}) => (
  <View style={styles.eventInfoContainer}>
    <View style={styles.titleContainer}>
      <TouchableOpacity 
        onPress={() => onFavorite(event)}
        style={styles.starButton}
      >
        <Ionicons 
          name={isFavorite ? "star" : "star-outline"} 
          size={14}
          color={isFavorite ? "#FFD700" : (isDarkMode ? "#FFF" : "#000")}
        />
      </TouchableOpacity>
      <Text style={isDarkMode ? styles.darkTitle : styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
    </View>
    <Text style={styles.date}>{formatDate ? formatDate(date) : date}</Text>
    <View style={styles.venueContainer}>
      <Ionicons name="location-outline" size={14} color="#666" />
      <Text style={styles.venue} numberOfLines={2} ellipsizeMode="tail">{venue}</Text>
    </View>
  </View>
);

interface TrendingEventCardProps {
  formatDate?: (date: string) => string;
}

const TrendingEventCard: React.FC<TrendingEventCardProps> = ({ formatDate }) => {
  const router = useRouter();  // Initialize router for navigation between screens
  // State variables to manage component data and UI states
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]); // Stores list of events
  const [loading, setLoading] = useState(true);                      // Tracks loading state
  const [error, setError] = useState<string | null>(null);          // Stores error messages
  const [favoriteEvents, setFavoriteEvents] = useState<{[key: string]: boolean}>({});

    // START of Mariann Grace Dizon Contribution

    // Initialize Firebase Auth
    const auth = getAuth();

    // Use theme context
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

    // Update dark mode state when theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark');
    }, [theme]);

    // Fetch user's theme preference from Firebase
    useEffect(() => {
        if (!auth.currentUser) return;
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            const userData = docSnapshot.data();
            
            // Ensure userData is defined before accessing themePreference
            const userTheme = userData?.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

  useEffect(() => {
    // Function to fetch and process event data
    const fetchEvents = async () => {
      try {
        setLoading(true);    // Start loading state
        setError(null);      // Clear any previous errors
        
        // Get user's favorite artists from storage/API
        const favoriteArtists = await getUserFavoriteArtists();
        
        // If no favorite artists found, set empty events and exit
        if (!favoriteArtists?.length) {
          setTrendingEvents([]);
          setLoading(false);
          return;
        }

        // Map to store one event per artist to avoid duplicates
        const eventsByArtist = new Map<string, Event>();
        // Remove duplicate artists from the list
        const uniqueArtists = Array.from(new Set(favoriteArtists)) as string[];

        // Process each artist
        for (const artist of uniqueArtists) {
          // Add delay between API calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            // Search TicketMaster API for events matching the artist
            const response = await TicketMasterAPI.searchEvents({
              keyword: `"${artist}"`,
              classificationName: 'music',
              size: 20,
              sort: 'date,asc'
            });

            // If events found, process them
            if (response?._embedded?.events) {
              // Find exact match for artist name to avoid false positives
              const exactMatch = response._embedded.events.find((event: any) => {
                return event._embedded?.attractions?.some((attraction: any) => 
                  attraction.name.toLowerCase() === artist.toLowerCase()
                );
              });

              // If exact match found, store event details
              if (exactMatch) {
                eventsByArtist.set(artist, {
                  id: exactMatch.id,
                  title: exactMatch.name,
                  date: exactMatch.dates.start.localDate,
                  venue: exactMatch._embedded?.venues?.[0]?.name || 'Venue TBA',
                  imageUrl: getBestImage(exactMatch.images || []),
                  artist: artist
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching events for ${artist}:`, error);
          }
        }

        // Convert Map of events to array for state storage
        const allEvents = Array.from(eventsByArtist.values());
        console.log('Events by artist:', JSON.stringify(allEvents, null, 2));
        
        setTrendingEvents(allEvents);
        
        // Show error if no events found
        if (allEvents.length === 0) {
          setError('No upcoming events found for your favorite artists');
        }
        
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to fetch events');
      } finally {
        setLoading(false);  // End loading state regardless of outcome
      }
    };

    fetchEvents(); // Execute the fetch function when component mounts
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const loadFavoriteEvents = async () => {
      try {
        const savedEvents = await AsyncStorage.getItem('favoriteEvents');
        if (savedEvents) {
          const events = JSON.parse(savedEvents);
          const favoriteStatus: {[key: string]: boolean} = {};
          events.forEach((event: any) => {
            favoriteStatus[event.title] = true;
          });
          setFavoriteEvents(favoriteStatus);
        }
      } catch (error) {
        console.error('Error loading favorite events:', error);
      }
    };
    loadFavoriteEvents();
  }, []);

  const handleFavorite = async (event: Event) => {
    try {
      const savedEvents = await AsyncStorage.getItem('favoriteEvents');
      let events = savedEvents ? JSON.parse(savedEvents) : [];
      
      if (!favoriteEvents[event.title]) {
        // Add to favorites
        const eventToSave = {
          title: event.title,
          date: event.date,
          venue: event.venue,
          imageUrl: event.imageUrl,
        };
        events = [...events, eventToSave];
      } else {
        // Remove from favorites
        events = events.filter((e: { title: string }) => e.title !== event.title);
      }
      
      await AsyncStorage.setItem('favoriteEvents', JSON.stringify(events));
      setFavoriteEvents(prev => ({
        ...prev,
        [event.title]: !prev[event.title]
      }));
    } catch (error) {
      console.error('Error updating favorite events:', error);
    }
  };

  // Function to handle when a user taps on an event
  const handleEventPress = (event: Event) => {
    // Prepare event data for navigation
    const eventData = {
      id: event.id,
      name: event.title,
      date: event.date,
      imageUrl: event.imageUrl,
      venue: event.venue,
      info: '', // Additional event information (empty for now)
    };
    
    // Navigate to the event details page with event data as parameters
    router.push({
      pathname: '/events/event-details',
      params: { eventData: JSON.stringify(eventData) }
    });
  };

  // Show loading state
  if (loading) {
    return (
      <View style={isDarkMode ? styles.darkContainer : styles.container}>
        <Text style={isDarkMode ? styles.darkSectionTitle : styles.sectionTitle}>Loading events...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={isDarkMode ? styles.darkContainer : styles.container}>
        <Text style={isDarkMode ? styles.darkErrorText : styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Render the component
  return (
    <ScrollView 
      style={isDarkMode ? styles.darkContainer : styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={isDarkMode ? styles.darkSectionTitle : styles.sectionTitle}>Trending Events</Text>
      {trendingEvents.map((event, index) => (
        <View key={index} style={isDarkMode ? styles.darkEventContainer : styles.eventContainer}>
          <EventInfoContainer 
            title={event.title} 
            date={event.date} 
            venue={event.venue}
            formatDate={formatDate}
            event={event}
            onFavorite={handleFavorite}
            isFavorite={favoriteEvents[event.title] || false}
            isDarkMode={isDarkMode}
          />
          <TouchableOpacity onPress={() => handleEventPress(event)}>
            <Image 
              source={typeof event.imageUrl === 'string' ? { uri: event.imageUrl } : event.imageUrl} 
              style={styles.image} 
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

// Styles define the visual appearance of components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
    paddingHorizontal: 20,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#79ce54',
    marginBottom: 0,
    marginLeft: 85,
    marginTop: 20,
  },
  darkSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#79ce54',
    marginBottom: 0,
    marginLeft: 85,
    marginTop: 20,
  },
  eventContainer: {
    marginTop: 0,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    borderRadius: 10,
    padding: 15,
  },
  darkEventContainer: {
    marginTop: 0,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 15,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  darkErrorText: {
    color: '#CF6679',
    textAlign: 'center',
    marginTop: 20,
  },
  image: {
    width: 185,
    height: 185,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  eventInfoContainer: {
    width: '100%',
    marginBottom: 10,
    marginLeft: 150,
    paddingRight: '40%',
  },
  starButton: {
    padding: 3,
    marginRight: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 5,
  },
  darkTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginRight: 5,
  },
  date: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fba904',
    marginTop: 5,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    flexWrap: 'wrap', // Allow content to wrap
  },
  venue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 5,
    flex: 1,
    flexWrap: 'wrap', // Allow text to wrap
  },
});

export default TrendingEventCard; // Make component available for import in other files

// END of TrendingEvents UI/UX
// END of Maxwell Guillermo Contribution
