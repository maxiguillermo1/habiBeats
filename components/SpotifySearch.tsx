// SpotifySearch.tsx
// Mariann Grace Dizon

// START of Spotify Artist Search Component
// START of Mariann Grace Dizon Contribution
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, StyleSheet } from 'react-native';
import axios from 'axios';
import { encode } from 'base-64';
import { Ionicons } from '@expo/vector-icons';

// Spotify API credentials
// Note: In a production environment, these should be stored securely and not exposed in the client-side code
const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';

// Define the structure for an artist object
interface Artist {
  id: string;
  name: string;
  picture: string;
}

// Props for the SpotifySearch component
interface SpotifySearchProps {
  onSelectArtist: (artist: Artist) => void;
  onRemoveArtist: (artistId: string) => void;
  selectedArtists: Artist[];
}

// SpotifySearch component for searching and selecting artists
const SpotifySearch: React.FC<SpotifySearchProps> = ({ onSelectArtist, onRemoveArtist, selectedArtists }) => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [tokenExpirationTime, setTokenExpirationTime] = useState(0);

  // Function to obtain or refresh the Spotify access token
  const getSpotifyAccessToken = async () => {
    const currentTime = Date.now();
    // Check if the current token is still valid
    if (accessToken && tokenExpirationTime > currentTime) {
      return accessToken;
    }

    try {
      // Encode client credentials for authorization
      const authString = encode(`${CLIENT_ID}:${CLIENT_SECRET}`);
      // Request a new access token
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
      // Update state with new token and expiration time
      setAccessToken(newAccessToken);
      setTokenExpirationTime(newExpirationTime);
      console.log('New access token obtained:', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', (error as Error).message);
      throw error;
    }
  };

  // Function to search for artists on Spotify
  const searchSpotifyArtists = async (query: string) => {
    try {
      const token = await getSpotifyAccessToken();
      console.log('Access token obtained:', token);

      // Construct the search URL
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`;
      console.log('Request URL:', url);

      // Make the API request to Spotify
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Spotify API response:', response.data);

      // Transform the API response into our Artist interface
      const artists = response.data.artists.items.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        picture: artist.images[0]?.url || '',
      }));
      setSearchResults(artists);
    } catch (error) {
      // Detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Error searching Spotify artists:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Headers:', error.response?.headers);
      } else {
        console.error('Unexpected error:', error);
      }
      // TODO: Handle the error appropriately, e.g., show an error message to the user
    }
  };

  // Function to handle the search button press
  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    searchSpotifyArtists(searchQuery);
  };

  // Function to handle artist selection
  const handleSelectArtist = (artist: Artist) => {
    onSelectArtist(artist);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search box that opens the modal when pressed */}
      <TouchableOpacity style={styles.searchBox} onPress={() => setModalVisible(true)}>
        <Text style={styles.placeholderText}>Search for an artist</Text>
        <Ionicons name="search" size={24} color="#999" />
      </TouchableOpacity>

      {/* List of selected artists */}
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

      {/* Modal for artist search */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Search input and button */}
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
            {/* List of search results */}
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
            {/* Close button for the modal */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles for the component
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

// END of Spotify Artist Search Component
// END of Mariann Grace Dizon Contribution
