// search-artist.tsx
// Mariann Grace Dizon

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchSpotifyArtists } from '../api/spotify-api'; // Import the centralized function

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

const SearchArtist: React.FC<SpotifySearchProps> = ({ onSelectArtist, onRemoveArtist, selectedArtists }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;
    try {
      const artists = await searchSpotifyArtists(searchQuery);
      setSearchResults(artists);
    } catch (error) {
      console.error('Error searching Spotify artists:', error);
    }
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
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 15,
  },
  artistImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  artistName: {
    fontSize: 15,
    color: '#0e1514',
    fontWeight: 'bold'
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
});

export default SearchArtist;
