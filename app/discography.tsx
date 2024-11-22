// discography.tsx
// Mariann Grace Dizon

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getSpotifyRecommendations, getSpotifyRelatedArtists } from '@/api/spotify-api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { ThemeContext, ThemeProvider } from '../context/ThemeContext';
import { auth } from '../firebaseConfig';
import { DocumentSnapshot } from 'firebase/firestore';

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
  // Group all useState hooks together at the top
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>('light');

  // Auth hooks
  const { user, userData } = useAuth();
  const navigation = useNavigation();

    // Use theme context
    const { theme, toggleTheme } = useContext(ThemeContext);

    // Update themePreference state when theme changes
    useEffect(() => {
      if (theme === 'light' || theme === 'dark') {
        setThemePreference(theme);
      } else {
        console.warn(`Unexpected theme value: ${theme}`);
      }
    }, [theme]);

    // Fetch user's theme preference from Firebase
    useEffect(() => {
      if (!auth.currentUser) return;
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDoc, (docSnapshot: DocumentSnapshot) => {
        const userData = docSnapshot.data();
        
        // Ensure userData is defined before accessing themePreference
        const userTheme = userData?.themePreference || 'light';
        setThemePreference(userTheme); // Set themePreference based on user's preference
      });

      return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);

  // Define styles based on themePreference
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themePreference === 'dark' ? '#121212' : '#fff8f0',
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
      backgroundColor: themePreference === 'dark' ? '#121212' : '#fff8f0',
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
      color: themePreference === 'dark' ? '#ffffff' : '#333',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: themePreference === 'dark' ? '#bbbbbb' : '#666',
    },
    errorText: {
      color: '#dc3545',
      fontSize: 16,
      textAlign: 'center',
    },
    noDataText: {
      fontSize: 16,
      color: themePreference === 'dark' ? '#bbbbbb' : '#666',
      fontStyle: 'italic',
      textAlign: 'center',
      marginVertical: 10,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: 'center',
      color: themePreference === 'dark' ? '#37bdd5' : '#37bdd5',
    },
    itemSubtitle: {
      fontSize: 12,
      color: themePreference === 'dark' ? '#79ce54' : '#79ce54',
      marginBottom: 4,
      textAlign: 'center',
    },
    songTitle: { 
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: 'center',
      color: themePreference === 'dark' ? '#fc6c85' : '#fc6c85',
    },
    songArtist: {  
      fontSize: 12,
      color: themePreference === 'dark' ? '#fba904' : '#fba904',
      marginBottom: 4,
      textAlign: 'center',
    },
    header: {
      fontSize: 25,
      fontWeight: 'bold',
      textAlign: 'center',
      color: themePreference === 'dark' ? '#ffffff' : '#333',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      marginVertical: 10,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: 40,
    },
    spotifyButton: {
      backgroundColor: '#1DB954',
      padding: 8,
      marginLeft: 23,
      marginRight: 23,
      borderRadius: 15,
      marginTop: 8,
      alignItems: 'center',
    },
    spotifyButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

  // Define useCallback before useEffect
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const userDocRef = doc(db, 'users', user!.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      let artistId = null;
      let trackId = null;

      // Get random favorite artist
      if (userData?.favoriteArtists) {
        const parsedArtists = typeof userData.favoriteArtists === 'string' 
          ? JSON.parse(userData.favoriteArtists) 
          : userData.favoriteArtists;
        
        if (Array.isArray(parsedArtists) && parsedArtists.length > 0) {
          // Randomly select an artist from favorites
          const randomIndex = Math.floor(Math.random() * parsedArtists.length);
          artistId = parsedArtists[randomIndex].id;
        }
      }

      // Get random tune from saved tunes (if you have multiple)
      if (userData?.savedTunes && Array.isArray(userData.savedTunes) && userData.savedTunes.length > 0) {
        const randomTuneIndex = Math.floor(Math.random() * userData.savedTunes.length);
        const parsedTune = typeof userData.savedTunes[randomTuneIndex] === 'string'
          ? JSON.parse(userData.savedTunes[randomTuneIndex])
          : userData.savedTunes[randomTuneIndex];
        trackId = parsedTune.id;
      } else if (userData?.tuneOfMonth) {
        // Fallback to tune of month if no saved tunes
        const parsedTune = typeof userData.tuneOfMonth === 'string'
          ? JSON.parse(userData.tuneOfMonth)
          : userData.tuneOfMonth;
        trackId = parsedTune.id;
      }

      if (artistId && trackId) {
        const [newArtists, newSongs] = await Promise.all([
          getSpotifyRelatedArtists(artistId),
          getSpotifyRecommendations([artistId], [trackId],)
        ]);
        
        if (newArtists) {
          // Shuffle the artists array
          const shuffledArtists = [...newArtists].sort(() => Math.random() - 0.5);
          setSimilarArtists(shuffledArtists);
        }
        
        if (newSongs) {
          // Shuffle the songs array
          const shuffledSongs = [...newSongs].sort(() => Math.random() - 0.5);
          setSimilarSongs(shuffledSongs);
        }
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      setError('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // useEffect comes last
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
      <View style={[styles.centerContainer, { backgroundColor: themePreference === 'dark' ? '#121212' : '#fff8f0' }]}>
        <ActivityIndicator size="large" color={themePreference === 'dark' ? '#37bdd5' : '#0000ff'} />
        <Text style={[styles.loadingText, { color: themePreference === 'dark' ? '#bbbbbb' : '#666666' }]}>
          Loading recommendations...
        </Text>
      </View>
    );
  }

  // Authentication check UI
  if (!user || !userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themePreference === 'dark' ? '#121212' : '#fff8f0' }]}>
        <View style={[styles.headerContainer, { backgroundColor: themePreference === 'dark' ? '#121212' : '#fff8f0' }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={themePreference === 'dark' ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, {
            color: themePreference === 'dark' ? '#ff6b6b' : '#dc3545'
          }]}>
            Please log in to view recommendations
          </Text>
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
          <Ionicons name="chevron-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Discography</Text>
      </View>

      {/* Main content section */}
      <View style={styles.content}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#37bdd5"
              colors={['#37bdd5', '#fc6c85', '#fba904']}
            />
          }
        >
          {/* Similar Artists Section */}
          <Text style={styles.title}>Artists You Might Like</Text>
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
                    <TouchableOpacity 
                      style={styles.spotifyButton}
                      onPress={() => openSpotifyArtist(artist.id)}
                    >
                      <Text style={styles.spotifyButtonText}>Open in Spotify</Text>
                    </TouchableOpacity>
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
                    <Text style={styles.songTitle}>{song.name}</Text>
                    <Text style={styles.songArtist}>
                      by {song.artists.map((artist) => artist.name).join(', ')}
                    </Text>
                    <TouchableOpacity 
                      style={styles.spotifyButton}
                      onPress={() => openSpotifyTrack(song.id)}
                    >
                      <Text style={styles.spotifyButtonText}>Play on Spotify</Text>
                    </TouchableOpacity>
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

const openSpotifyArtist = (artistId: string) => {
  // Try to open in Spotify app first, fallback to web
  Linking.canOpenURL(`spotify:artist:${artistId}`)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(`spotify:artist:${artistId}`);
      } else {
        return Linking.openURL(`https://open.spotify.com/artist/${artistId}`);
      }
    })
    .catch((err) => console.error('Error opening Spotify:', err));
};

const openSpotifyTrack = (trackId: string) => {
  Linking.canOpenURL(`spotify:track:${trackId}`)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(`spotify:track:${trackId}`);
      } else {
        return Linking.openURL(`https://open.spotify.com/track/${trackId}`);
      }
    })
    .catch((err) => console.error('Error opening Spotify:', err));
};
