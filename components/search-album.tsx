// search-album.tsx
// Mariann Grace Dizon

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchSpotifyAlbums } from '../api/spotify-api'; // Import function to search albums from Spotify API

// Define the Album interface to type the album data
interface Album {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

// Define the props for the SearchAlbum component
interface SearchAlbumProps {
  onSelectAlbum: (album: Album) => void; // Callback function when an album is selected
}

const SearchAlbum: React.FC<SearchAlbumProps> = ({ onSelectAlbum }) => {
  // State to manage the search query input by the user
  const [searchQuery, setSearchQuery] = useState('');
  // State to store the search results from Spotify
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  // State to control the visibility of the search modal
  const [modalVisible, setModalVisible] = useState(false);

  // Function to handle the search operation
  const handleSearch = async () => {
    if (searchQuery.trim() === '') return; // Do nothing if the search query is empty
    try {
      const albums = await searchSpotifyAlbums(searchQuery); // Fetch albums from Spotify API
      setSearchResults(albums); // Update the search results state
    } catch (error) {
      console.error('Error searching Spotify albums:', error); // Log any errors
    }
  };

  // Function to handle the selection of an album
  const handleSelectAlbum = (album: Album) => {
    onSelectAlbum(album); // Call the parent component's callback with the selected album
    setModalVisible(false); // Close the modal
  };

  return (
    <View style={styles.container}>
      {/* Touchable area to open the search modal */}
      <TouchableOpacity style={styles.searchBox} onPress={() => setModalVisible(true)}>
        <Text style={styles.placeholderText}>Search for an album</Text>
        <Ionicons name="search" size={24} color="#999" />
      </TouchableOpacity>

      {/* Modal to display the search input and results */}
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
                  {item.albumArt ? (
                    <Image source={{ uri: item.albumArt }} style={styles.albumImage} />
                  ) : (
                    <View style={[styles.albumImage, styles.placeholderImage]}>
                      <Ionicons name="disc" size={30} color="#999" />
                    </View>
                  )}
                  <View style={styles.albumInfo}>
                    <Text style={styles.albumName}>{item.name}</Text>
                    <Text style={styles.albumArtist}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            {/* Button to close the modal */}
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
    backgroundColor: '#fff8f0',
    marginTop: 47,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 25,
    borderRadius: 30,
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
    marginRight: 20,
    marginLeft: 10,
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 15,
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
    fontSize: 15,
    color: '#0e1514',
    fontWeight: 'bold',
  },
  albumArtist: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    padding: 13,
    alignItems: 'center',
    marginTop: 20,
    marginLeft: 50,
    marginRight: 50,
  },
  closeButtonText: {
    color: '#fff8f0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchAlbum;
