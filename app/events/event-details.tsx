// event-details.tsx
// Maxwell Guillermo 

// START of my events page frontend & backend
// START of Maxwell Guillermo

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const GEMINI_API_KEY = 'AIzaSyD6l21NbFiYT1QtW6H6iaIQMvKxwMAQ604';

const EventDetailsPage = () => {
  const params = useLocalSearchParams();
  const eventData = params.eventData ? JSON.parse(params.eventData as string) : null;
  const router = useRouter();
  const [aiDescription, setAiDescription] = useState('');
  const descriptionGeneratedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    const generateAIDescription = async () => {
      if (!eventData || descriptionGeneratedRef.current) return;

      setIsLoading(true);
      try {
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          {
            contents: [
              {
                parts: [
                  { text: `Create a concise 5-sentence description for ${eventData.name}'s upcoming performance:

                    1. Introduce the artist and their significance in the music industry.
                    2. Describe the location and details of the upcoming event.
                    3. Briefly mention the artist's backstory or journey in music.
                    4. Highlight the artist's primary genre or style of music.
                    5. Explain why this artist is worth seeing live.

                    Use the following information:
                    Artist: ${eventData.name}
                    Genre: ${eventData.genre || 'Not specified'}
                    Event Date: ${eventData.date}
                    Venue: ${eventData.venue}
                    Location: ${eventData.location}` }
                ]
              }
            ]
          },
          {
            params: { key: GEMINI_API_KEY },
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        const generatedDescription = response.data.candidates[0].content.parts[0].text;
        setAiDescription(generatedDescription);
        descriptionGeneratedRef.current = true;
      } catch (error) {
        console.error('Error generating AI description:', error);
        setAiDescription('');
        descriptionGeneratedRef.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    generateAIDescription();
  }, [eventData]);

  const handleBackPress = () => {
    router.back();
  };

  const handleArtistDetails = () => {
    // Implement navigation to artist details page
    console.log('Navigate to artist details');
  };

  const handleTickets = () => {
    // Implement navigation to tickets page or external ticketing system
    console.log('Navigate to tickets');
  };

  const handleAttending = () => {
    setIsAttending(!isAttending);
    // Add logic to update backend or local storage
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Add logic to update backend or local storage
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {eventData?.name && <Text style={styles.title}>{eventData.name}</Text>}
          {eventData?.date && <Text style={styles.date}>{formatDate(eventData.date)}</Text>}
          
          {eventData?.imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: eventData.imageUrl }} style={styles.image} />
            </View>
          )}
          
          <View style={styles.detailsContainer}>
            {(eventData?.venue || eventData?.location) && (
              <Text style={styles.detailText}>
                {`${eventData.venue || ''} ${eventData.venue && eventData.location ? '-' : ''} ${eventData.location || ''}`}
              </Text>
            )}
            <Text style={styles.detailText}>Artist Details</Text>
            <Text style={styles.detailText}>Tickets</Text>
            <Text style={styles.descriptionTitle}>Event Description</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="rgba(121, 206, 84, 0.7)" />
              </View>
            ) : (
              <Text style={[styles.descriptionText, styles.centeredText]}>{aiDescription}</Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isAttending && styles.activeButton]}
              onPress={handleAttending}
            >
              <Text style={styles.buttonText}>
                {isAttending ? "I'm Attending!" : "I'm Attending"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, isFavorite && styles.activeButton]}
              onPress={handleFavorite}
            >
              <Text style={styles.buttonText}>
                {isFavorite ? "Favorited" : "Favorite"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff8f0', // Light gray background
    borderRadius: 10,
    margin: 30,
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
    flexDirection: 'row',
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
    color: '#fba904',
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
    color: '#fc6c85',
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
    backgroundColor: '#37bdd5',
    padding: 8, // Reduced from 10
    borderRadius: 3,
    width: '45%',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: 'rgba(76, 217, 100, 0.7)', // Made transparent
  },
  buttonText: {
    color: 'white',
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40, // Reduced height
  },
});

export default EventDetailsPage;

// my-events.tsx
// Maxwell Guillermo 

// END of event-details page frontend & backend
// END of Maxwell Guillermo