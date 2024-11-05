// disposable-camera.tsx
// Mariann Grace Dizon

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

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
    try {
      if (!camera) {
        console.error('Camera reference is null');
        return;
      }
      const photo = await camera.takePictureAsync({
        quality: 1,
        exif: true,
      });

      if (!photo) {
        console.error('Failed to capture photo');
        return;
      }

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      // Convert photo URI to blob
      const response = await fetch(photo.uri);
      const blob = await response.blob();

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const filename = `disposableImages/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Store in AsyncStorage
      const savedPhotos = await AsyncStorage.getItem(`photos_${userId}`);
      const photosList = savedPhotos ? JSON.parse(savedPhotos) : [];
      photosList.push({ url: downloadURL, timestamp });
      await AsyncStorage.setItem(`photos_${userId}`, JSON.stringify(photosList));

    } catch (error) {
      console.error('Failed to take and upload picture:', error);
    }
  };

  // Function to toggle camera type (front/back)
  const toggleCameraType = () => {
    setType((prevType) => (prevType === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.borderTop}>
        <View style={styles.topButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color="#fba904" />
          </TouchableOpacity>
        </View>
      </View>

      <CameraView 
        style={styles.camera} 
        facing={type}
        ref={(ref) => setCamera(ref)}
      />

      <View style={styles.borderBottom}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={() => navigation.navigate('disposable-gallery')}
          >
            <Ionicons name="images" size={40} color="#37bdd5" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={takePicture}
          >
            <Ionicons name="camera" size={90} color="#79ce54" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={40} color="#fc6c85" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    aspectRatio: 1,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    padding: 8,
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
    backgroundColor: '#fff8f0',
    justifyContent: 'center',
  },
  topButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  borderBottom: {
    flex: 1,
    backgroundColor: '#fff8f0',
    justifyContent: 'center',
  },
});
