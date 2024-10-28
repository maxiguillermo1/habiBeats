// TrendingEvents.tsx
// Maxwell Guillermo 

// START of TrendingEvents UI/UX
// START of Maxwell Guillermo Contribution

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserFavoriteArtists } from './getUserFavoriteArtists';
import { TicketMasterAPI } from '../api/ticket-master-api';
import { useRouter } from 'expo-router';

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

// Sub-component to display event details (title, date, venue)
const EventInfoContainer = ({ title, date, venue }: { title: string; date: string; venue: string }) => (
  <View style={styles.eventInfoContainer}>
    <View style={styles.titleContainer}>
      <Ionicons name="star-outline" size={18} color="#000" style={styles.starIcon} />
      <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
    </View>
    <Text style={styles.date}>{date}</Text>
    <View style={styles.venueContainer}>
      <Ionicons name="location-outline" size={14} color="#666" />
      <Text style={styles.venue} numberOfLines={2} ellipsizeMode="tail">{venue}</Text>
    </View>
  </View>
);

const TrendingEventCard = () => {
  const router = useRouter();  // Initialize router for navigation between screens
  // State variables to manage component data and UI states
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]); // Stores list of events
  const [loading, setLoading] = useState(true);                      // Tracks loading state
  const [error, setError] = useState<string | null>(null);          // Stores error messages

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
                  imageUrl: exactMatch.images?.[0]?.url || DEFAULT_IMAGE,
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
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Loading events...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Render the component
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.sectionTitle}>Trending Events</Text>
      {trendingEvents.map((event, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.eventContainer}
          onPress={() => handleEventPress(event)}
        >
          <EventInfoContainer title={event.title} date={event.date} venue={event.venue} />
          <Image 
            source={typeof event.imageUrl === 'string' ? { uri: event.imageUrl } : event.imageUrl} 
            style={styles.image} 
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Styles define the visual appearance of components
const styles = StyleSheet.create({
  container: {
    flex: 1,                  // Take up all available space
    backgroundColor: '#fff8f0', // Light cream background color
    paddingHorizontal: 20,    // Add horizontal padding
  },
  scrollContent: {
    paddingBottom: 100, // Add padding at the bottom for scrolling
  },
  sectionTitle: {
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
  eventInfoContainer: {
    width: '100%',
    marginBottom: 10,
    // Remove or adjust marginLeft if it's causing the text to be cut off
    marginLeft: 150,
    paddingRight: '40%',
  },
  starIcon: {
    marginRight: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap', // Allow content to wrap
    width: '100%',    // Ensure it takes up the full width available
    marginRight: 100,  // Add some margin on the right side to create space between text and image
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    lineHeight: 16,
    flexWrap: 'wrap', // Allow text to wrap
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
  image: {
    width: 215,
    height: 215,
    resizeMode: 'cover',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TrendingEventCard; // Make component available for import in other files

// END of TrendingEvents UI/UX
// END of Maxwell Guillermo Contribution
