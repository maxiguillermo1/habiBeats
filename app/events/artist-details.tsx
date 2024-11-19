import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth, db } from '../../firebaseConfig'; // Assuming you have a firebaseConfig file
import { doc, getDoc } from 'firebase/firestore';

const GEMINI_API_KEY = 'AIzaSyD6l21NbFiYT1QtW6H6iaIQMvKxwMAQ604';

const ArtistDetailsPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const artistData = params.artistData ? JSON.parse(params.artistData as string) : null;
  
  const [aiContent, setAiContent] = useState({
    biography: '',
    genre: '',
    isLoaded: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  useEffect(() => {
    const getArtistInfo = async () => {
      if (!artistData || aiContent.isLoaded) return;

      setIsLoading(true);
      try {
        const genreResponse = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          {
            contents: [{
              parts: [{
                text: `What is the primary music genre of the artist "${artistData.name}"? 
                Respond with just the genre name, nothing else. If unsure, respond with "Various genres".`
              }]
            }]
          },
          {
            params: { key: GEMINI_API_KEY },
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        const genre = genreResponse.data.candidates[0].content.parts[0].text.trim();

        const bioResponse = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          {
            contents: [{
              parts: [{
                text: `Create a concise 3-paragraph artist biography for ${artistData.name}:
                
                1. Introduce the artist and their impact on their genre
                2. Describe their musical style and influences
                3. Highlight their achievements and what makes them unique

                Use the following information:
                Artist: ${artistData.name}
                Genre: ${genre}`
              }]
            }]
          },
          {
            params: { key: GEMINI_API_KEY },
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        setAiContent({
          biography: bioResponse.data.candidates[0].content.parts[0].text,
          genre: genre,
          isLoaded: true
        });
      } catch (error) {
        console.error('Error generating AI content:', error);
        setAiContent({
          biography: '',
          genre: 'Various genres',
          isLoaded: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    getArtistInfo();
  }, [artistData]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <ScrollView>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#ffffff' : '#007AFF'} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{artistData?.name}</Text>
          
          {artistData?.imageUrl && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: artistData.imageUrl }} 
                style={styles.artistImage}
              />
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={[styles.genreText, { color: isDarkMode ? '#fba904' : '#fba904' }]}>Genre: {aiContent.genre || 'Loading...'}</Text>
            <Text style={[styles.bioTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Biography</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={isDarkMode ? '#79ce54' : 'rgba(121, 206, 84, 0.7)'} />
              </View>
            ) : (
              <Text style={[styles.bioText, styles.centeredText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>{aiContent.biography}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff8f0', // Default light mode color
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff8f0', // Default light mode color
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
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  artistImage: {
    width: 180,
    height: 180,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
  },
  genreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  centeredText: {
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
});

export default ArtistDetailsPage;