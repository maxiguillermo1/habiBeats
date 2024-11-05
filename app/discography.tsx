// discography.tsx
// Mariann Grace Dizon

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getSpotifyRecommendations, getSpotifyRelatedArtists } from '@/api/spotify-api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Type definitions for data structures
interface Artist {
  id: string;
  name: string;
  popularity: number;
  imageUrl: string;
}

// Simplified Artist interface used in Song interface
interface Artist {
  id: string;
  name: string;
}

// Interface defining the structure of a song recommendation
interface Song {
  id: string;
  name: string;
  artists: Artist[];
  albumArt: string;
}

export default function Discography() {
  // Authentication and user data hooks
  const { user, userData } = useAuth();
  
  // State management for recommendations and UI states
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Cleanup flag to prevent state updates after unmount
    let isMounted = true;

    // Main async function to fetch user data and get recommendations
    const fetchUserDataAndRecommendations = async () => {
      try {
        if (!user) return;
        
        setError(null);
        setLoading(true);

        // Fetch user's profile data from Firebase
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          throw new Error('User data not found');
        }

        const userData = userDocSnap.data();
        console.log('Raw userData:', userData);

        // Variables to store IDs for recommendations
        let firstArtistId: string | null = null;
        let tuneOfMonthId;

        // Parse favorite artists data with error handling
        try {
          if (userData.favoriteArtists) {
            let parsedArtists;
            // Handle both string and object/array data formats
            if (typeof userData.favoriteArtists === 'string') {
              parsedArtists = JSON.parse(userData.favoriteArtists);
            } else {
              parsedArtists = userData.favoriteArtists;
            }
            
            console.log('Parsed artists:', parsedArtists);
            
            if (Array.isArray(parsedArtists) && parsedArtists.length > 0) {
              firstArtistId = parsedArtists[0].id;
            }
          }
        } catch (e) {
          console.error('Error parsing favoriteArtists:', e);
          console.log('Raw favoriteArtists value:', userData.favoriteArtists);
        }

        // Parse tune of month data with error handling
        try {
          if (userData.tuneOfMonth) {
            let parsedTune;
            // Handle both string and object data formats
            if (typeof userData.tuneOfMonth === 'string') {
              parsedTune = JSON.parse(userData.tuneOfMonth);
            } else {
              parsedTune = userData.tuneOfMonth;
            }
            
            console.log('Parsed tune:', parsedTune);
            tuneOfMonthId = parsedTune.id;
          }
        } catch (e) {
          console.error('Error parsing tuneOfMonth:', e);
          console.log('Raw tuneOfMonth value:', userData.tuneOfMonth);
        }

        // Validate required data exists
        if (!firstArtistId || !tuneOfMonthId) {
          console.error('Missing data - firstArtistId:', firstArtistId, 'tuneOfMonthId:', tuneOfMonthId);
          throw new Error('Please set at least one favorite artist and tune of the month in your profile');
        }

        console.log('Using first artist ID:', firstArtistId);
        console.log('Using track ID:', tuneOfMonthId);

        // Fetch recommendations in parallel for better performance
        const [artistRecommendations, songRecommendations] = await Promise.all([
          getSpotifyRelatedArtists(firstArtistId),
          getSpotifyRecommendations([firstArtistId], [tuneOfMonthId])
        ]);

        // Update state only if component is still mounted
        if (isMounted) {
          setSimilarArtists(artistRecommendations || []);
          setSimilarSongs(songRecommendations || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          console.error('Error fetching recommendations:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserDataAndRecommendations();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [user]); // Re-run effect when user changes

  // Navigation handler for back button
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Loading state UI
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  // Authentication check UI
  if (!user || !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to view recommendations</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Required data check UI
  if (!userData.favoriteArtists || !userData.tuneOfMonth) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Please set your favorite artists and tune of the month by editing your profile.
        </Text>
      </View>
    );
  }

  // Main UI render
  return (
    <SafeAreaView style={styles.container}>
      {/* Header section with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Discography</Text>
      </View>

      {/* Main content section */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Similar Artists Section */}
          <Text style={styles.title}>Similar Artists You Might Like</Text>
          {similarArtists.length === 0 ? (
            <Text style={styles.noDataText}>No similar artists found</Text>
          ) : (
            // Create rows of 2 artists each
            similarArtists.reduce<Artist[][]>((rows, artist, index) => {
              if (index % 2 === 0) {
                rows.push([artist]);
              } else {
                rows[rows.length - 1].push(artist);
              }
              return rows;
            }, []).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((artist) => (
                  <View key={artist.id} style={styles.item}>
                    <Image source={{ uri: artist.imageUrl }} style={styles.image} />
                    <Text style={styles.itemTitle}>{artist.name}</Text>
                    <Text style={styles.itemSubtitle}>Popularity: {artist.popularity}</Text>
                  </View>
                ))}
              </View>
            ))
          )}

          {/* Similar Songs Section */}
          <Text style={styles.title}>Songs You Might Like</Text>
          {similarSongs.length === 0 ? (
            <Text style={styles.noDataText}>No similar songs found</Text>
          ) : (
            // Create rows of 2 songs each
            similarSongs.reduce<Song[][]>((rows, song, index) => {
              if (index % 2 === 0) {
                rows.push([song]);
              } else {
                rows[rows.length - 1].push(song);
              }
              return rows;
            }, []).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((song) => (
                  <View key={song.id} style={styles.item}>
                    <Image source={{ uri: song.albumArt }} style={styles.image} />
                    <Text style={styles.itemTitle}>{song.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      by {song.artists.map((artist) => artist.name).join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Styles for component layout and appearance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0', // Light cream background
  },
  content: {
    flex: 1,
    paddingRight: 20,
    paddingLeft: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  item: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff8f0',
    marginHorizontal: 4,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  header: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0e1514',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
  },
});
