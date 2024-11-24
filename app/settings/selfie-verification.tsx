// selfie-verification.tsx
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage, auth, db } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../../context/ThemeContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useLocalSearchParams } from 'expo-router';
const SelfieVerification = () => {
  const params = useLocalSearchParams<{mode?: string}>();
  const isResetMode = params.mode === 'reset';
  const { theme } = useContext(ThemeContext);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('front');
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [firstImage, setFirstImage] = useState<string | null>(null);
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  // Theme effect
  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  // Camera permission effect
  useEffect(() => {
    requestPermission();
  }, []);

  // Reset mode effect
  useEffect(() => {
    if (isResetMode) {
      setIsVerified(false);
      setStep(1);
    }
  }, [isResetMode]);

  // Verification status effect
  useEffect(() => {
    if (!auth.currentUser) return;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        setIsVerified(userData.isVerified || false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Request camera permissions on component mount
  useEffect(() => {
    requestPermission();
  }, []);

  // Handles uploading images to Firebase Storage
  const uploadImageToFirebase = async (uri: string, imageName: string): Promise<string> => {
    if (!auth.currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // Convert image URI to blob format for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique path for each user's verification images
      const filename = `verification/${auth.currentUser.uid}/${imageName}`;
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
    if (!firstImage) {
      console.error('First image is missing');
      Alert.alert('Error', 'Please take the first selfie again');
      return;
    }

    setIsLoading(true);
    try {
      // Upload images with type assertion
      const firstImageUrl = await uploadImageToFirebase(firstImage as string, 'selfie1.jpg');
      const secondImageUrl = await uploadImageToFirebase(secondImageUri, 'selfie2.jpg');
      
      console.log('Uploaded images:', { firstImageUrl, secondImageUrl });

      const functions = getFunctions();
      const verifyFaces = httpsCallable(functions, 'verifyFaces');
      
      setStep(4);
      
      const result = await verifyFaces({
        firstImageUrl,
        secondImageUrl,
        userId: auth.currentUser?.uid
      });

      console.log('Verification result:', result.data);

      const verificationResult = result.data as { 
        success: boolean;
        message: string;
        similarity?: number;
      };
      
      if (verificationResult.success) {
        Alert.alert(
          'Success', 
          `Verification successful!${
            verificationResult.similarity 
              ? ` Similarity score: ${(verificationResult.similarity * 100).toFixed(1)}%`
              : ''
          }`
        );
        router.back();
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      const errorMessage = error.message || 'Please try again with clearer photos';
      Alert.alert(
        'Verification Failed',
        errorMessage.includes('similarity score') ? 
          'The selfies don\'t appear to be of the same person. Please try again.' :
          errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Renders different UI components based on current step
  const renderContent = () => {
    if (isVerified) {
      return (
        <View style={styles.introContainer}>
          <Ionicons 
            name="checkmark-circle" 
            size={60} 
            color="#fba904" 
          />
          <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
            Already Verified
          </Text>
          <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
            Your profile has already been verified. You can close this page.
          </Text>
          <TouchableOpacity 
            style={[styles.button, isDarkMode && styles.darkButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    try {
      switch (step) {
        case 1:  // Intro screen with instructions
          return (
            <View style={styles.introContainer}>
              <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
                Verify Your Profile
              </Text>
              <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
                Take two selfies to verify your identity and get a verified badge on your profile.
              </Text>
              <TouchableOpacity 
                style={[styles.button, isDarkMode && styles.darkButton]}
                onPress={() => {
                  try {
                    setStep(2);
                    console.log('Moving to step 2');
                  } catch (err) {
                    console.error('Error setting step:', err);
                    setError('Failed to start verification process');
                  }
                }}
              >
                <Text style={styles.buttonText}>Start Verification</Text>
              </TouchableOpacity>
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
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
              <Text style={[styles.processingText, isDarkMode && styles.darkProcessingText]}>
                Processing verification...
              </Text>
            </View>
          );

        default:
          console.error('Invalid step:', step);
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Something went wrong</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setStep(1)}
              >
                <Text style={styles.buttonText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          );
      }
    } catch (err) {
      console.error('Error in renderContent:', err);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>An error occurred</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setStep(1)}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
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
        onPress={() => {
          console.log('Verification status:', isVerified);
          router.back();
        }}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  verifiedIcon: {
    marginBottom: 20,
  },
  alreadyVerifiedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  alreadyVerifiedDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  }
});

export default SelfieVerification;

// END of Maxwell Guillermo Contribution