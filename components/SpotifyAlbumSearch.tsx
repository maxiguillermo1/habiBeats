// SpotifyAlbumSearch.tsx
// Mariann Grace Dizon

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchSpotifyAlbums } from '../api/spotify-api'; // Import the centralized function

interface Album {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface SpotifyAlbumSearchProps {
  onSelectAlbum: (album: Album) => void;
}

const SpotifyAlbumSearch: React.FC<SpotifyAlbumSearchProps> = ({ onSelectAlbum }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;
    try {
      const albums = await searchSpotifyAlbums(searchQuery);
      setSearchResults(albums);
    } catch (error) {
      console.error('Error searching Spotify albums:', error);
    }
  };

  const handleSelectAlbum = (album: Album) => {
    onSelectAlbum(album);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchBox} onPress={() => setModalVisible(true)}>
        <Text style={styles.placeholderText}>Search for an album</Text>
        <Ionicons name="search" size={24} color="#999" />
      </TouchableOpacity>

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
                placeholder="Search for an album"
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
