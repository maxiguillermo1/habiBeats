// event-details.tsx
// Created by Maxwell Guillermo 
// START of Maxwell's contribution

// This file creates a detailed view page for individual events
// It shows event info, generates AI descriptions, and handles user interactions

// Import necessary tools and components we need
import React, { useState, useEffect, useRef } from 'react'; // Core React features for building the component
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native'; // Basic UI components from React Native
import { useLocalSearchParams, useRouter } from 'expo-router'; // Tools for navigation and getting URL parameters
import axios from 'axios'; // Tool for making API requests
import { Ionicons } from '@expo/vector-icons'; // Package for nice-looking icons
import { Link } from 'expo-router'; // Add this import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate } from '../../utils/dateUtils';
import { auth, db } from '../../firebaseConfig'; // Assuming you have a firebaseConfig file
import { doc, getDoc } from 'firebase/firestore';

// API key for Google's Gemini AI service that generates event descriptions
const GEMINI_API_KEY = 'AIzaSyD6l21NbFiYT1QtW6H6iaIQMvKxwMAQ604';

// Main component that displays all event details
const EventDetailsPage = () => {
  // Get event data passed through URL parameters and parse it from JSON string
  const params = useLocalSearchParams();
  const eventData = params.eventData ? JSON.parse(params.eventData as string) : null;
  const router = useRouter(); // Tool to help with navigation

  // Variables to store and update different states of the page
  const [aiDescription, setAiDescription] = useState(''); // Stores AI-generated event description
  const descriptionGeneratedRef = useRef(false); // Keeps track if we already generated a description
  const [isLoading, setIsLoading] = useState(true); // Shows loading spinner while getting description
  const [isAttending, setIsAttending] = useState(false); // Tracks if user marked as attending
  const [isFavorite, setIsFavorite] = useState(false); // Tracks if user favorited the event
  const [isDarkMode, setIsDarkMode] = useState(false); // Tracks if dark mode is enabled

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

  // Check if event is already saved when component mounts
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const attendingEvents = await AsyncStorage.getItem('attendingEvents');
        const favoriteEvents = await AsyncStorage.getItem('favoriteEvents');
        
        if (attendingEvents) {
          const attending = JSON.parse(attendingEvents);
          setIsAttending(attending.some((event: { title: string }) => event.title === eventData.name));
        }
        
        if (favoriteEvents) {
          const favorites = JSON.parse(favoriteEvents);
          setIsFavorite(favorites.some((event: { title: string }) => event.title === eventData.name));
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkSavedStatus();
  }, [eventData]);

  // This runs when the component loads to generate an AI description of the event
  useEffect(() => {
    const generateAIDescription = async () => {
      if (!eventData || descriptionGeneratedRef.current) return;

      setIsLoading(true);
      try {
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          {
            contents: [{
              parts: [{
                text: `Create a concise 5-sentence description for ${eventData.name}'s upcoming performance...`
              }]
            }]
          },
          {
            params: { key: GEMINI_API_KEY },
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          setAiDescription(response.data.candidates[0].content.parts[0].text);
        } else {
          setAiDescription('Unable to generate description at this time.');
        }
        descriptionGeneratedRef.current = true;
      } catch (error) {
        console.error('Error generating AI description:', error);
        setAiDescription('Unable to generate description at this time.');
        descriptionGeneratedRef.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    generateAIDescription();
  }, [eventData]);

  // Functions to handle user interactions
  const handleBackPress = () => {
    router.back(); // Go back to previous screen
  };

  const handleArtistDetails = () => {
    router.push({
      pathname: '/events/artist-details',
      params: { artistData: JSON.stringify(eventData) }
    });
  };

  const handleTickets = () => {
    router.push({
      pathname: '/events/event-tickets',
      params: { eventData: JSON.stringify(eventData) }
    });
  };

  const handleAttending = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem('attendingEvents');
      let events = savedEvents ? JSON.parse(savedEvents) : [];
      
      if (!isAttending) {
        // Add to attending
        const eventToSave = {
          title: eventData.name,
          date: eventData.date,
          venue: eventData.venue,
          imageUrl: eventData.imageUrl,
        };
        events = [...events, eventToSave];
      } else {
        // Remove from attending
        events = events.filter((event: { title: string }) => event.title !== eventData.name);
      }
      
      await AsyncStorage.setItem('attendingEvents', JSON.stringify(events));
      setIsAttending(!isAttending);
    } catch (error) {
      console.error('Error updating attending events:', error);
    }
  };

  const handleFavorite = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem('favoriteEvents');
      let events = savedEvents ? JSON.parse(savedEvents) : [];
      
      if (!isFavorite) {
        // Add to favorites
        const eventToSave = {
          title: eventData.name,
          date: eventData.date,
          venue: eventData.venue,
          imageUrl: eventData.imageUrl,
        };
        events = [...events, eventToSave];
      } else {
        // Remove from favorites
        events = events.filter((event: { title: string }) => event.title !== eventData.name);
      }
      
      await AsyncStorage.setItem('favoriteEvents', JSON.stringify(events));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite events:', error);
    }
  };

  // The actual layout/display of the page
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <ScrollView>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
          {/* Back button at top of screen */}
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#ffffff' : '#007AFF'} />
            </TouchableOpacity>
          </View>
          
          {/* Event title and date */}
          {eventData?.name && <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{eventData.name}</Text>}
          {eventData?.date && <Text style={[styles.date, { color: isDarkMode ? '#fba904' : '#fba904' }]}>{formatDate(eventData.date)}</Text>}
          
          {/* Event image */}
          {eventData?.imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: eventData.imageUrl }} style={styles.image} />
            </View>
          )}
          
          {/* Event details section */}
          <View style={styles.detailsContainer}>
            {/* Venue and location info */}
            {(eventData?.venue || eventData?.location) && (
              <TouchableOpacity onPress={() => router.push({
                pathname: '/events/event-location',
                params: { venue: eventData.venue, location: eventData.location }
              })}>
                <Text style={[styles.detailText, { color: isDarkMode ? '#fc6c85' : '#fc6c85' }]}>
                  {`${eventData.venue || ''} ${eventData.venue && eventData.location ? '-' : ''} ${eventData.location || ''}`}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleArtistDetails}>
              <Text style={[styles.detailText, { color: isDarkMode ? '#fc6c85' : '#fc6c85' }]}>Artist Details</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTickets}>
              <Text style={[styles.detailText, { color: isDarkMode ? '#fc6c85' : '#fc6c85' }]}>Tickets</Text>
            </TouchableOpacity>
            <Text style={[styles.descriptionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Event Description</Text>
            
            {/* Show loading spinner or AI description */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={isDarkMode ? '#79ce54' : 'rgba(121, 206, 84, 0.7)'} />
              </View>
            ) : (
              <Text style={[styles.descriptionText, styles.centeredText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{aiDescription}</Text>
            )}
          </View>

          {/* Buttons for user interactions */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isAttending && styles.activeButton]}
              onPress={handleAttending}
            >
              <Text style={[styles.buttonText, isAttending && styles.activeButtonText]}>
                {isAttending ? "I'm Going!" : "I'm Attending"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, isFavorite && styles.activeButton]}
              onPress={handleFavorite}
            >
              <Text style={[styles.buttonText, isFavorite && styles.activeButtonText]}>
                {isFavorite ? "Favorited!" : "Favorite"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles that control how everything looks
const styles = StyleSheet.create({
  safeArea: {
    flex: 1, // Take up all available space
    backgroundColor: '#fff8f0', // Light cream background
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff8f0',
    borderRadius: 10, // Rounded corners
    margin: 30,
    // Shadow settings (currently disabled)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  customHeader: {
    flexDirection: 'row', // Arrange items horizontally
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 21.5,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fba904', // Orange color
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'cover',
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
    color: '#fc6c85', // Pink color
    fontWeight: 'bold',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  centeredText: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#37bdd5', // Blue color
    padding: 8,
    borderRadius: 3,
    width: '45%',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#79ce54', // Changed from '#FF69B4' to '#79ce54'
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
});

// Make this component available to other parts of the app
export default EventDetailsPage;

// End of file
// Created by Maxwell Guillermo 

// This completes the event details page with both frontend display and backend logic
// End of Maxwell's contribution
