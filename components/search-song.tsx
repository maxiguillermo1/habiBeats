// search-song.tsx
// Maxwell Guillermo

// START of Search Song Component
// START of Maxwell Guillermo Contribution  

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { encode } from 'base-64';

const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface SearchSongProps {
  onSelectSong: (song: Song) => void;
  initialSong?: Song;
}

export default function SearchSong({ onSelectSong, initialSong }: SearchSongProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(initialSong || null);
  const [accessToken, setAccessToken] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getSpotifyAccessToken();
  }, []);

  useEffect(() => {
    if (initialSong) {
      setSelectedSong(initialSong);
    }
  }, [initialSong]);

  const getSpotifyAccessToken = async () => {
    try {
      const authString = encode(`${CLIENT_ID}:${CLIENT_SECRET}`);
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      setAccessToken(response.data.access_token);
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === '' || !accessToken) return;
    setSearchResults([]); // Clear previous results
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const tracks = response.data.tracks.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0].name,
        albumArt: item.album.images[0].url,
      }));
      setSearchResults(tracks);
    } catch (error) {
      console.error('Error searching Spotify:', error);
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    onSelectSong(song);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.songBox} onPress={() => setModalVisible(true)}>
        {selectedSong ? (
          <>
            <View style={styles.songContent}>
              <Image source={{ uri: selectedSong.albumArt }} style={styles.albumArt} />
              <View style={styles.songInfo}>
                <Text style={styles.songName} numberOfLines={2} ellipsizeMode="tail">{selectedSong.name}</Text>
                <Text style={styles.artistName} numberOfLines={1} ellipsizeMode="tail">{selectedSong.artist}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#999" style={styles.editIcon} />
          </>
        ) : (
          <Text style={styles.placeholderText}>Select a song</Text>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for a song"
              />
              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.songItem}
                  onPress={() => handleSelectSong(item)}
                >
                  <Image source={{ uri: item.albumArt }} style={styles.resultAlbumArt} />
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultSongName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                    <Text style={styles.resultArtistName} numberOfLines={1} ellipsizeMode="tail">{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
    padding: 20,
  },
  songBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArt: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 14,
    color: '#666',
  },
  editIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  placeholderText: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    padding: 8,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultAlbumArt: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultSongName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  resultArtistName: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

// END of Search Song Component
// END of Maxwell Guillermo Contribution    