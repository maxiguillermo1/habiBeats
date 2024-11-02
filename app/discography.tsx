// discography.tsx
// Mariann Grace Dizon

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getSpotifyRecommendations, getSpotifyRelatedArtists } from '@/api/spotify-api';
import { Ionicons } from '@expo/vector-icons'; // Import icons for the back button
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// Define types for our data structures
interface Artist {
  id: string;
  name: string;
  popularity: number;
  imageUrl: string;
}

interface Artist {
  id: string;
  name: string;
}

interface Song {
  id: string;
  name: string;
  artists: Artist[];
  albumArt: string;
}

export default function Discography() {
  const { user, userData } = useAuth();
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation(); // Initialize navigation

  useEffect(() => {
    let isMounted = true;

    const fetchUserDataAndRecommendations = async () => {
      try {
        if (!user) return;
        
        setError(null);
        setLoading(true);

        // Fetch user data from Firebase
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          throw new Error('User data not found');
        }

        const userData = userDocSnap.data();
        console.log('Raw userData:', userData); // Debug log

        let firstArtistId: string | null = null;
        let tuneOfMonthId;

        // Parse favoriteArtists with better error handling
        try {
          // Check if the data exists and is not empty
          if (userData.favoriteArtists) {
            let parsedArtists;
            // Handle case where data might already be an object/array
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

        // Parse tuneOfMonth with better error handling
        try {
          if (userData.tuneOfMonth) {
            let parsedTune;
            // Handle case where data might already be an object
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

        if (!firstArtistId || !tuneOfMonthId) {
          console.error('Missing data - firstArtistId:', firstArtistId, 'tuneOfMonthId:', tuneOfMonthId);
          throw new Error('Please set at least one favorite artist and tune of the month in your profile');
        }

        console.log('Using first artist ID:', firstArtistId);
        console.log('Using track ID:', tuneOfMonthId);

        // Get both similar artists and song recommendations
        const [artistRecommendations, songRecommendations] = await Promise.all([
          getSpotifyRelatedArtists(firstArtistId),  // New function call
          getSpotifyRecommendations([firstArtistId], [tuneOfMonthId])
        ]);

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

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  if (!user || !userData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please log in to view recommendations</Text>
      </View>
    );
  }

  if (!userData.favoriteArtists || !userData.tuneOfMonth) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Please set your favorite artists and tune of the month by editing your profile.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Discography</Text>
      </View>
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Similar Artists You Might Like</Text>
          {similarArtists.length === 0 ? (
            <Text style={styles.noDataText}>No similar artists found</Text>
          ) : (
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

          <Text style={styles.title}>Songs You Might Like</Text>
          {similarSongs.length === 0 ? (
            <Text style={styles.noDataText}>No similar songs found</Text>
          ) : (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
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
    alignSelf: 'center', // Center the image horizontally
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
    textAlign: 'center', // Center the text
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
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center', // Center the text
  },
  itemSubtitle: {
    fontSize: 13, // Adjust the font size as needed
    color: '#666', // Adjust the color as needed
    marginBottom: 4, // Optional: add margin if needed
    textAlign: 'center', // Center the text
  },
  header: {
    fontSize: 25, // Adjust the font size as needed
    fontWeight: 'bold',
    textAlign: 'center', // Center the text
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the header text
    paddingHorizontal: 20, // Add padding to the left and right
    marginVertical: 20,
    position: 'relative', // Allow absolute positioning of the back button
  },
  backButton: {
    position: 'absolute',
    left: 10, // Position the back button on the left
  },
});
