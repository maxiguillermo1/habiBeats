import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { storage } from '../firebaseConfig.js';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Match the type definition with the camera component
type RootStackParamList = {
  'disposable-camera': undefined;
  'disposable-gallery': undefined;
};

type PhotoItem = {
  url: string;
  timestamp: number;
};

export default function DisposableGallery() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    <View style={styles.photoContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.photo}
        onLoadStart={() => {/* Optional: handle load start */}}
        onLoadEnd={() => {/* Optional: handle load end */}}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('disposable-camera')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>My Disposables</Text>
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
    backgroundColor: '#0e1514',
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: '#fba904',
    fontSize: 16,
    marginRight: 10,
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
});
