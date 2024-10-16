// SpotifyAlbumSearch.tsx
// Mariann Grace Dizon

// START of Spotify Album Search Component
// START of Mariann Grace Dizon Contribution
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, StyleSheet } from 'react-native';
import axios from 'axios';
import { encode } from 'base-64';
import { Ionicons } from '@expo/vector-icons';

// Spotify API credentials
const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';

// Define the structure of an album object
interface Album {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

// Props for the SpotifyAlbumSearch component
interface SpotifyAlbumSearchProps {
  onSelectAlbum: (album: Album) => void;
}

const SpotifyAlbumSearch: React.FC<SpotifyAlbumSearchProps> = ({ onSelectAlbum }) => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Function to obtain Spotify access token
  const getSpotifyAccessToken = async () => {
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
  };

  // Function to search for albums on Spotify
  const searchSpotifyAlbums = async (query: string) => {
    try {
      if (!accessToken) await getSpotifyAccessToken();
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      // Map the response data to our Album interface
      const albums = response.data.albums.items.map((album: any) => ({
        id: album.id,
        name: album.name,
        artist: album.artists[0].name,
        albumArt: album.images[0]?.url || '',
      }));
      setSearchResults(albums);
    } catch (error) {
      console.error('Error searching Spotify albums:', error);
      // TODO: Handle the error appropriately, e.g., show an error message to the user
    }
  };

  // Handler for search button press
  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    searchSpotifyAlbums(searchQuery);
  };

  // Handler for selecting an album
  const handleSelectAlbum = (album: Album) => {
    onSelectAlbum(album);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search box that opens the modal when pressed */}
      <TouchableOpacity style={styles.searchBox} onPress={() => setModalVisible(true)}>
        <Text style={styles.placeholderText}>Search for an album</Text>
        <Ionicons name="search" size={24} color="#999" />
      </TouchableOpacity>

      {/* Modal for album search */}
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
                placeholder="Search for an album"
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
                  style={styles.albumItem}
                  onPress={() => handleSelectAlbum(item)}
                >
                  <Image source={{ uri: item.albumArt }} style={styles.albumImage} />
                  <View style={styles.albumInfo}>
                    <Text style={styles.albumName}>{item.name}</Text>
                    <Text style={styles.albumArtist}>{item.artist}</Text>
                  </View>
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
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  albumImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    color: '#333',
  },
  albumArtist: {
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

export default SpotifyAlbumSearch;

// END of Spotify Album Search Component
// END of Mariann Grace Dizon Contribution
