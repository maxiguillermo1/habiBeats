// selfie-verification.tsx
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { storage, auth, db } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../../context/ThemeContext';

const SelfieVerification = () => {
  // State variables to manage the verification flow
  const [permission, requestPermission] = useCameraPermissions();  // Handle camera permissions
  const [type, setType] = useState<CameraType>('front');          // Camera type (front/back)
  const [camera, setCamera] = useState<CameraView | null>(null);  // Reference to camera component
  const [isLoading, setIsLoading] = useState(false);              // Loading state for API calls
  const [firstImage, setFirstImage] = useState<string | null>(null);  // URI of first selfie
  const [secondImage, setSecondImage] = useState<string | null>(null); // URI of second selfie
  const [step, setStep] = useState(1);  // Controls the verification flow: 
                                       // 1: intro screen
                                       // 2: first selfie capture
                                       // 3: second selfie capture
                                       // 4: processing verification
  const navigation = useNavigation();

    // START of Mariann Grace Dizon Contribution
    // Use theme context
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

    // Update dark mode state when theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark');
    }, [theme]);

    // Fetch user's theme preference from Firebase
    useEffect(() => {
        if (!auth.currentUser) return;
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            const userData = docSnapshot.data();
            
            // Ensure userData is defined before accessing themePreference
            const userTheme = userData?.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

  // Request camera permissions on component mount
  useEffect(() => {
    requestPermission();
  }, []);

  // Handles uploading images to Firebase Storage
  const uploadImageToFirebase = async (uri: string, imageName: string) => {
    try {
      // Convert image URI to blob format for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique path for each user's verification images
      const filename = `verification/${auth.currentUser?.uid}/${imageName}`;
      const storageRef = ref(storage, filename);
      
      // Upload image and get download URL
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handles the camera capture process
  const takePicture = async () => {
    if (!camera) return;
    try {
      const photo = await camera.takePictureAsync();
      if (!photo) return;
      
      // Store images based on current step
      if (step === 2) {
        setFirstImage(photo.uri);
        setStep(3);  // Move to second selfie capture
      } else if (step === 3) {
        setSecondImage(photo.uri);
        handleVerification(photo.uri);  // Start verification process
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  // Processes both selfies for verification
  const handleVerification = async (secondImageUri: string) => {
    if (!firstImage || !auth.currentUser) return;
    
    setIsLoading(true);
    try {
      // Upload both selfies to Firebase Storage
      const firstImageUrl = await uploadImageToFirebase(firstImage, 'selfie1.jpg');
      const secondImageUrl = await uploadImageToFirebase(secondImageUri, 'selfie2.jpg');

      // Placeholder for future verification logic using Firebase Cloud Functions
      
      setStep(4);  // Move to processing screen
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renders different UI components based on current step
  const renderContent = () => {
    switch (step) {
      case 1:  // Intro screen with instructions
        return (
          <View style={styles.introContainer}>
            <Text style={[styles.title, isDarkMode && styles.darkTitle]}>Verify Your Profile</Text>
            <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
              Take two selfies to verify your identity and get a verified badge on your profile.
            </Text>
            <TouchableOpacity 
              style={[styles.button, isDarkMode && styles.darkButton]}
              onPress={() => setStep(2)}
            >
              <Text style={styles.buttonText}>Start Verification</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:  // First selfie capture screen
      case 3:  // Second selfie capture screen
        return (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing={type}
              ref={(ref) => setCamera(ref)}
            >
              <View style={styles.cameraContent}>
                <Text style={[styles.cameraText, isDarkMode && styles.darkCameraText]}>
                  {step === 2 ? 'Take your first selfie' : 'Take your second selfie'}
                </Text>
                <TouchableOpacity 
                  style={[styles.captureButton, isDarkMode && styles.darkCaptureButton]}
                  onPress={takePicture}
                >
                  <Ionicons name="camera" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        );

      case 4:  // Processing screen
        return (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? '#bb86fc' : '#fba904'} />
            <Text style={[styles.processingText, isDarkMode && styles.darkProcessingText]}>Processing verification...</Text>
          </View>
        );
    }
  };

  // Permission handling screens
  if (!permission) {
    // Show loading while checking permissions
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Show permission request screen
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity 
          style={[styles.button, isDarkMode && styles.darkButton]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, isDarkMode && styles.darkBackButtonText]}>back</Text>
      </TouchableOpacity>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fba904',
    fontWeight: 'bold',
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0e1514',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#fba904',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    marginTop: 100,
  },
  camera: {
    flex: 1,
  },
  cameraContent: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fba904',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fba904',
    padding: 10,
    borderRadius: 5,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  darkBackButtonText: {
    color: '#fba904',
  },
  darkTitle: {
    color: '#fff',
  },
  darkDescription: {
    color: '#ccc',
  },
  darkProcessingText: {
    color: '#ccc'
  },
  darkButton: {
    backgroundColor: '#fba904'
  },
  darkCaptureButton: {
    backgroundColor: '#fba904'
  },
  darkCameraText: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  }
});

export default SelfieVerification;

// END of Maxwell Guillermo Contribution