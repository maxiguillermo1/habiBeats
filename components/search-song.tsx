// search-song.tsx
// Mariann Grace Dizon

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchSpotifyTracks } from '../api/spotify-api'; // Import the centralized function

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
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (initialSong) {
      setSelectedSong(initialSong);
    }
  }, [initialSong]);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;
    setSearchResults([]); // Clear previous results
    try {
      const tracks = await searchSpotifyTracks(searchQuery);
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
    fontSize: 15,
    color: '#0e1514',
    fontWeight: 'bold',
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
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 15,
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
