// disposable-camera.tsx
// Mariann Grace Dizon

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useContext, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import BottomNavBar from '../components/BottomNavBar';
import { ThemeContext } from '../context/ThemeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export default function DisposableCamera() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [type, setType] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<CameraView | null>(null);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Single useEffect to handle theme
  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const userId = getAuth().currentUser?.uid;
        if (!userId) {
          console.error('User not authenticated');
          return;
        }

        const userDoc = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const storedTheme = userData.themePreference;

          console.log('Stored theme from Firestore:', storedTheme); // Debug log

          if (storedTheme === 'dark' && theme === 'light') {
            toggleTheme();
          } else if (storedTheme === 'light' && theme === 'dark') {
            toggleTheme();
          }

          setIsDarkMode(storedTheme === 'dark');
        } else {
          console.error('No user data found');
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);

  // If permission is not yet determined, show loading text
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  // If permission is not granted, show permission request buttons
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centeredContainer, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
        <Text style={[styles.permissionText, { color: isDarkMode ? '#fff8f0' : '#151718' }]}>
          Please give HabiBeats camera access to continue...
        </Text>
        <View style={styles.permissionButtons}>
          <Button 
            onPress={() => {
              requestPermission();
            }} 
            title="Grant Permission"
            color={isDarkMode ? '#37bdd5' : '#37bdd5'}
          />
          <Button 
            onPress={() => router.back()} 
            title="Don't Allow" 
            color={isDarkMode ? '#fc6c85' : '#fc6c85'}
          />
        </View>
        <BottomNavBar />
      </View>
    );
  }

  // Function to take a picture
  const takePicture = async () => {
    if (isProcessing || !camera) return;
    
    setIsProcessing(true);
    try {
      if (!camera) {
        console.error('Camera reference is null');
        return;
      }

      try {
        // Take picture with error handling
        const photo = await camera.takePictureAsync({
          quality: 0.5, // Further reduced quality for better performance
          exif: false, // Disable EXIF to reduce memory usage
        });

        if (!photo) {
          throw new Error('No photo captured');
        }

        const userId = getAuth().currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Create blob in a way that allows garbage collection
        let blob: Blob | null = null;
        try {
          const response = await fetch(photo.uri);
          blob = await response.blob();
          
          const timestamp = Date.now();
          const filename = `disposableImages/${userId}/${timestamp}.jpg`;
          const storageRef = ref(storage, filename);

          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);

          // Update AsyncStorage
          const savedPhotos = await AsyncStorage.getItem(`photos_${userId}`);
          const photosList = savedPhotos ? JSON.parse(savedPhotos) : [];
          photosList.push({ url: downloadURL, timestamp });
          await AsyncStorage.setItem(`photos_${userId}`, JSON.stringify(photosList));

        } finally {
          // Clean up blob
          if (blob) {
            blob = null;
          }
          // Revoke the temporary URL to free memory
          if (photo.uri) {
            URL.revokeObjectURL(photo.uri);
          }
        }

      } catch (error) {
        console.error('Camera operation failed:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to toggle camera type (front/back)
  const toggleCameraType = () => {
    setType((prevType) => (prevType === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: isDarkMode ? '#151718' : '#fff8f0' ,
      borderWidth: 1,
      borderColor: isDarkMode ? '#151718' : '#fff8f0' 
    }]}>
      <View style={[styles.borderTop, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
        <View style={styles.topButtonContainer}>
        </View>
      </View>

      <CameraView 
        style={styles.camera} 
        facing={type}
        ref={(ref) => setCamera(ref)}
      />

      <View style={[styles.borderBottom, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={() => router.push('/disposable-gallery')}
          >
            <Ionicons name="images" size={40} color={isDarkMode ? '#37bdd5' : '#37bdd5'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={takePicture}
          >
            <Ionicons name="camera" size={90} color={isDarkMode ? '#79ce54' : '#79ce54'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={50} color={isDarkMode ? '#fc6c85' : '#fc6c85'} />
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </View>
    </View>
  );
}
// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    aspectRatio: 1,
    width: '100%',
    marginTop: -100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 70,
  },
  button: {
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  galleryButton: {
    padding: 10,
    marginRight: 10,
  },
  permissionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  flipButton: {
    padding: 10,
    marginLeft: 10,
  },
  borderTop: {
    flex: 1,
    justifyContent: 'center',
  },
  topButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  borderBottom: {
    flex: 1,
    justifyContent: 'center',
  },
  permissionContainer: {
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 100,
    fontSize: 38,
    marginLeft: 30,
    marginRight: 30,
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
