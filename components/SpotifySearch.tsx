// SpotifySearch.tsx
// Mariann Grace Dizon

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, StyleSheet } from 'react-native';
import axios from 'axios';
import { encode } from 'base-64';
import { Ionicons } from '@expo/vector-icons';

const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';

interface Artist {
  id: string;
  name: string;
  picture: string;
}

interface SpotifySearchProps {
  onSelectArtist: (artist: Artist) => void;
  onRemoveArtist: (artistId: string) => void;
  selectedArtists: Artist[];
}

const SpotifySearch: React.FC<SpotifySearchProps> = ({ onSelectArtist, onRemoveArtist, selectedArtists }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [tokenExpirationTime, setTokenExpirationTime] = useState(0);

  const getSpotifyAccessToken = async () => {
    const currentTime = Date.now();
    if (accessToken && tokenExpirationTime > currentTime) {
      return accessToken;
    }

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
      const newAccessToken = response.data.access_token;
      const newExpirationTime = currentTime + (response.data.expires_in * 1000);
      setAccessToken(newAccessToken);
      setTokenExpirationTime(newExpirationTime);
      console.log('New access token obtained:', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', (error as Error).message);
      throw error;
    }
  };

  const searchSpotifyArtists = async (query: string) => {
    try {
      const token = await getSpotifyAccessToken();
      console.log('Access token obtained:', token);

      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`;
      console.log('Request URL:', url);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Spotify API response:', response.data);

      const artists = response.data.artists.items.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        picture: artist.images[0]?.url || '',
      }));
      setSearchResults(artists);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error searching Spotify artists:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Headers:', error.response?.headers);
      } else {
        console.error('Unexpected error:', error);
      }
      // Handle the error appropriately, e.g., show an error message to the user
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    searchSpotifyArtists(searchQuery);
  };

  const handleSelectArtist = (artist: Artist) => {
    onSelectArtist(artist);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchBox} onPress={() => setModalVisible(true)}>
        <Text style={styles.placeholderText}>Search for an artist</Text>
        <Ionicons name="search" size={24} color="#999" />
      </TouchableOpacity>

      <FlatList
        data={selectedArtists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.artistItem}>
            <Image source={{ uri: item.picture }} style={styles.artistImage} />
            <Text style={styles.artistName}>{item.name}</Text>
            <TouchableOpacity onPress={() => onRemoveArtist(item.id)}>
              <Ionicons name="close-circle" size={24} color="#f00" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for an artist"
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
                  style={styles.artistItem}
                  onPress={() => handleSelectArtist(item)}
                >
                  <Image source={{ uri: item.picture }} style={styles.artistImage} />
                  <Text style={styles.artistName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
    padding: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
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
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  artistImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  artistName: {
    fontSize: 16,
    color: '#333',
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

export default SpotifySearch;
