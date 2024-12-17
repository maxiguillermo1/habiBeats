// disposable-gallery.tsx
// Mariann Grace Dizon

import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { storage } from '../firebaseConfig.js';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig.js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { auth } from '../firebaseConfig.js';

// Define the type for the navigation stack parameters
type RootStackParamList = {
  'disposable-camera': undefined;
  'disposable-gallery': { selectMode?: boolean };
  'profile': undefined;
  'editprofile': { photoUri?: string };
};

// Define the type for a photo item
type PhotoItem = {
  url: string;
  timestamp: number;
};

export default function DisposableGallery() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const { selectMode } = useLocalSearchParams<{ selectMode?: string }>();

  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const userId = getAuth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsDarkMode(userData.themePreference === 'dark');
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);

  const loadPhotos = async () => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Load photos from AsyncStorage first
      const savedPhotos = await AsyncStorage.getItem(`photos_${userId}`);
      let photosList: PhotoItem[] = [];
        
      if (savedPhotos) {
        photosList = JSON.parse(savedPhotos);
      }

      // Then load photos from Firebase Storage
      const storageRef = ref(storage, `disposableImages/${userId}`);
      const result = await listAll(storageRef);
      const firebaseUrls = await Promise.all(
        result.items.map(async (imageRef) => {
          const url = await getDownloadURL(imageRef);
          const timestamp = parseInt(imageRef.name.split('.')[0]);
          return { url, timestamp };
        })
      );

      // Merge and deduplicate photos from both sources
      const allPhotos = [...photosList, ...firebaseUrls];
      const uniquePhotos = Array.from(
        new Map(allPhotos.map(item => [item.timestamp, item])).values()
      );

      // Sort photos by timestamp, newest first
      uniquePhotos.sort((a, b) => b.timestamp - a.timestamp);
      setPhotos(uniquePhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Render each photo item in the FlatList
  const renderPhoto = ({ item }: { item: PhotoItem }) => (
    <TouchableOpacity 
      style={styles.photoContainer}
      onPress={() => {
        if (selectMode) {
          handlePhotoSelect(item);
        } else {
          setSelectedPhoto(item);
        }
      }}
    >
      <View style={styles.polaroidFrame}>
        <Image
          source={{ uri: item.url }}
          style={styles.photo}
        />
        <View style={styles.polaroidBottom} />
      </View>
    </TouchableOpacity>
  );

  // Handle the deletion of a photo
  const handleDelete = async (photo: PhotoItem) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Create reference to the file in Firebase Storage
      const photoRef = ref(storage, `disposableImages/${userId}/${photo.timestamp}.jpg`);
      
      // Delete the photo from Firebase Storage
      await deleteObject(photoRef);

      // Update local state to remove the deleted photo
      setPhotos(prevPhotos => prevPhotos.filter(p => p.timestamp !== photo.timestamp));
      
      // Close the modal
      setSelectedPhoto(null);

      // Update AsyncStorage to remove the deleted photo
      const updatedPhotos = photos.filter(p => p.timestamp !== photo.timestamp);
      await AsyncStorage.setItem(`photos_${userId}`, JSON.stringify(updatedPhotos));
    } catch (err) {
      console.error('Error deleting photo:', err);
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  // Handle the selection of a photo
  const handleSelectPhoto = async (photo: PhotoItem) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Update the user's document in Firestore with the selected photo
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        selectedDisposable: JSON.stringify(photo)
      });

      // Navigate back to the profile screen
      router.push('/profile');
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  // Handle the photo selection in select mode
  const handlePhotoSelect = async (photo: PhotoItem) => {
    if (!selectMode) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Navigate back to edit profile with the selected photo URI
      router.push(`/editprofile?photoUri=${encodeURIComponent(photo.url)}`);
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  // Add this helper function before the return statement
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back-outline" size={24} color={isDarkMode ? '#ffffff' : '#fba904'} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: isDarkMode ? '#ffffff' : '#fba904' }]}>
          {selectMode ? 'Select Photo' : 'My Disposables'}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#fba904'} />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#0e1514' }]}>Loading photos...</Text>
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : 'red' }]}>{error}</Text>
      ) : photos.length === 0 ? (
        <Text style={[styles.noPhotosText, { color: isDarkMode ? '#ffffff' : '#0e1514' }]}>No photos yet</Text>
      ) : (
        <FlatList
          data={photos.filter(photo => photo && photo.url && photo.timestamp)}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.timestamp.toString()}
          numColumns={3}
        />
      )}

      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          {selectedPhoto && (
            <View style={styles.fullScreenPolaroid}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(selectedPhoto)}
              >
                <Ionicons name="trash-outline" size={24} color="#fba904" />
              </TouchableOpacity>
              <View style={styles.photoWrapper}>
                <Image
                  source={{ uri: selectedPhoto.url }}
                  style={styles.fullScreenPhoto}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.fullScreenPolaroidBottom}>
                <Text style={styles.timestampText}>
                  {formatTimestamp(selectedPhoto.timestamp)}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
const photoSize = width / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    padding: 10,
    marginRight: 5,
    position: 'absolute',
    left: 0,
    zIndex: 1,
    top: 50,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: photoSize,
    height: photoSize + 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  polaroidFrame: {
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: {
    width: photoSize - 30,
    height: photoSize - 30,
  },
  polaroidBottom: {
    height: 30,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#0e1514',
  },
  noPhotosText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#0e1514',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenPolaroid: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
    width: '90%',
    aspectRatio: 0.8,
  },
  photoWrapper: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  fullScreenPhoto: {
    width: '100%',
    height: '100%',
  },
  fullScreenPolaroidBottom: {
    height: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  timestampText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'System',
  },
});
