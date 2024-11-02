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
import * as ImageManipulator from 'expo-image-manipulator';

type RootStackParamList = {
  'disposable-camera': undefined;
  'disposable-gallery': undefined;
};

const applyFilter = async (uri: string) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      // [
      //   { action: 'saturate', value: 1.5 },
      //   { action: 'brightness', value: 0.9 },
      //   { action: 'contrast', value: 1.2 }
      // ],
      // { compress: 1 }
    );
    return result.uri;
  } catch (error) {
    console.error('Error applying filter:', error);
    return uri;
  }
};

export default function DisposableCamera() {
  const [type, setType] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<CameraView | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

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

  const takePicture = async () => {
    try {
      if (!camera) return;
      const photo = await camera.takePictureAsync({
        quality: 1,
        exif: true,
      });
      
      if (!photo) return;
      
      // Apply filter to the photo
      const filteredUri = await applyFilter(photo.uri);

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      // Convert filtered photo URI to blob
      const filteredUriString = typeof filteredUri === 'string' ? filteredUri : photo.uri;
      const response = await fetch(filteredUriString);
      const blob = await response.blob();

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const filename = `disposableImages/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Store in AsyncStorage
      try {
        const savedPhotos = await AsyncStorage.getItem(`photos_${userId}`);
        const photosList = savedPhotos ? JSON.parse(savedPhotos) : [];
        photosList.push({ url: downloadURL, timestamp });
        await AsyncStorage.setItem(`photos_${userId}`, JSON.stringify(photosList));
      } catch (storageError) {
        console.error('Failed to save to AsyncStorage:', storageError);
      }

    } catch (error) {
      console.error('Failed to take and upload picture:', error);
    }
  };

  const toggleCameraType = () => {
    setType((prevType) => (prevType === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={type}
        ref={(ref) => setCamera(ref)}
      >
        <View style={styles.topButtonsContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={() => navigation.navigate('disposable-gallery')}
          >
            <Ionicons name="images" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={takePicture}
          >
            <Ionicons name="camera" size={65} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  button: {
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  topButtonsContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  galleryButton: {
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginRight: 20,
  },
  permissionButtons: {
    gap: 10,
    alignItems: 'center',
  },
  flipButton: {
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginLeft: 20,
  },
});
