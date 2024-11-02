import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { storage } from '../firebaseConfig.js';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig.js';
import { doc, updateDoc } from 'firebase/firestore';
import { RouteProp } from '@react-navigation/native';
import { auth } from '../firebaseConfig.js';

// Match the type definition with the camera component
type RootStackParamList = {
  'disposable-camera': undefined;
  'disposable-gallery': { selectMode?: boolean };
  'profile': undefined;
  'editprofile': undefined;
};

type PhotoItem = {
  url: string;
  timestamp: number;
};

type DisposableGalleryRouteProp = RouteProp<RootStackParamList, 'disposable-gallery'>;

export default function DisposableGallery() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const route = useRoute<DisposableGalleryRouteProp>();
  const selectMode = route.params?.selectMode;

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const userId = getAuth().currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Load from AsyncStorage first
        const savedPhotos = await AsyncStorage.getItem(`photos_${userId}`);
        let photosList: PhotoItem[] = [];
        
        if (savedPhotos) {
          photosList = JSON.parse(savedPhotos);
        }

        // Then load from Firebase Storage
        const storageRef = ref(storage, `disposableImages/${userId}`);
        const result = await listAll(storageRef);
        const firebaseUrls = await Promise.all(
          result.items.map(async (imageRef) => {
            const url = await getDownloadURL(imageRef);
            const timestamp = parseInt(imageRef.name.split('.')[0]);
            return { url, timestamp };
          })
        );

        // Merge and deduplicate photos
        const allPhotos = [...photosList, ...firebaseUrls];
        const uniquePhotos = Array.from(
          new Map(allPhotos.map(item => [item.timestamp, item])).values()
        );

        // Sort by timestamp, newest first
        uniquePhotos.sort((a, b) => b.timestamp - a.timestamp);
        setPhotos(uniquePhotos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error loading photos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

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
      <Image
        source={{ uri: item.url }}
        style={styles.photo}
      />
    </TouchableOpacity>
  );

  const handleDelete = async (photo: PhotoItem) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Create reference to the file in Firebase Storage
      const photoRef = ref(storage, `disposableImages/${userId}/${photo.timestamp}.jpg`);
      
      // Delete from Firebase Storage
      await deleteObject(photoRef);

      // Update local state
      setPhotos(prevPhotos => prevPhotos.filter(p => p.timestamp !== photo.timestamp));
      
      // Close modal
      setSelectedPhoto(null);

      // Update AsyncStorage
      const updatedPhotos = photos.filter(p => p.timestamp !== photo.timestamp);
      await AsyncStorage.setItem(`photos_${userId}`, JSON.stringify(updatedPhotos));
    } catch (err) {
      console.error('Error deleting photo:', err);
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  const handleSelectPhoto = async (photo: PhotoItem) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        selectedDisposable: JSON.stringify(photo)
      });

      // Navigate back to profile
      navigation.navigate('profile');
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handlePhotoSelect = async (photo: PhotoItem) => {
    if (!selectMode) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Navigate back to edit profile with the selected photo
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('editprofile');
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#fba904" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {selectMode ? 'Select Photo' : 'My Disposables'}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fba904" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : photos.length === 0 ? (
        <Text style={styles.noPhotosText}>No photos yet</Text>
      ) : (
        <FlatList
          data={photos}
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
            <>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(selectedPhoto)}
              >
                <Ionicons name="trash-outline" size={24} color="#fba904" />
              </TouchableOpacity>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.fullScreenPhoto}
                resizeMode="contain"
              />
            </>
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
    color: '#fba904',
    fontSize: 20,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: photoSize,
    height: photoSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderColor: '#37bdd5',
    borderWidth: 2,
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
  },
  fullScreenPhoto: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 2,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});
