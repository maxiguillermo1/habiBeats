// disposable-camera.tsx
// Mariann Grace Dizon

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useContext, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import BottomNavBar from '../components/BottomNavBar'; // Import the BottomNavBar component
import { ThemeContext } from '../context/ThemeContext'; // Import ThemeContext

// Define the types for the navigation stack
type RootStackParamList = {
  'disposable-camera': undefined;
  'disposable-gallery': undefined;
};

export default function DisposableCamera() {
  const [type, setType] = useState<CameraType>('back'); // State to manage camera type (front/back)
  const [permission, requestPermission] = useCameraPermissions(); // State to manage camera permissions
  const [camera, setCamera] = useState<CameraView | null>(null); // State to manage camera reference
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // Navigation hook
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  // Update isDarkMode whenever theme changes
  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  // Debugging: Log the theme and isDarkMode values
  console.log('Current theme:', theme);
  console.log('Is dark mode:', isDarkMode);

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
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 60 }}>
          We need your permission to show the camera...
        </Text>
        <View style={styles.permissionButtons}>
          <Button 
            onPress={requestPermission} 
            title="Grant Permission"
            color="#007AFF"
          />
          <Button 
            onPress={() => navigation.goBack()} 
            title="Don't Allow" 
            color="#007AFF"
          />
        </View>
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
      <View style={[styles.borderTop, { backgroundColor: isDarkMode ? '#2d3235' : '#fff8f0' }]}>
        <View style={styles.topButtonContainer}>
        </View>
      </View>

      <CameraView 
        style={styles.camera} 
        facing={type}
        ref={(ref) => setCamera(ref)}
      />

      <View style={[styles.borderBottom, { backgroundColor: isDarkMode ? '#2d3235' : '#fff8f0' }]}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={() => navigation.navigate('disposable-gallery')}
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
    gap: 10,
    alignItems: 'center',
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
});
