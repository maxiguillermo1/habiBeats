// change-password.tsx
// Maxwell Guillermo

// START of Change Password UI/UX
// START of Maxwell Guillermo Contribution
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, Keyboard } from 'react-native';
import { getAuth, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Stack } from 'expo-router';

// This file handles the password change functionality in the HabiBeats app
// It provides a user interface for users to safely update their passwords
const ChangePassword = () => {
  // Store user input values securely
  const [currentPassword, setCurrentPassword] = useState(''); // Holds the user's current password
  const [newPassword, setNewPassword] = useState(''); // Holds the user's desired new password
  const [confirmNewPassword, setConfirmNewPassword] = useState(''); // Confirms the new password
  const [message, setMessage] = useState(''); // Stores feedback messages for the user
  const [showMessage, setShowMessage] = useState(false); // Controls when to show feedback messages
  
  // Setup navigation and authentication tools
  const navigation = useNavigation(); // Helps move between screens
  const auth = getAuth(); // Connects to Firebase authentication service

  // Animation variables to make the interface smooth and engaging
  const titleOpacity = useSharedValue(0); // Controls how visible the title is
  const titleTranslateY = useSharedValue(50); // Controls title's vertical position
  const subtitleOpacity = useSharedValue(0); // Controls subtitle visibility
  const subtitleTranslateY = useSharedValue(50); // Controls subtitle vertical position
  const backButtonOpacity = useSharedValue(0); // Controls back button visibility
  const backButtonTranslateY = useSharedValue(50); // Controls back button vertical position
  const inputsOpacity = useSharedValue(0); // Controls form inputs visibility
  const inputsTranslateY = useSharedValue(50); // Controls form inputs vertical position
  const buttonOpacity = useSharedValue(0); // Controls submit button visibility
  const buttonTranslateY = useSharedValue(50); // Controls submit button vertical position

  // When the screen loads, play entrance animations
  useEffect(() => {
    // Animate each element one after another for a smooth entrance
    titleOpacity.value = withSpring(1); // Fade in the title
    titleTranslateY.value = withSpring(0); // Move title up into position
    subtitleOpacity.value = withDelay(150, withSpring(1)); // Fade in subtitle after delay
    subtitleTranslateY.value = withDelay(150, withSpring(0)); // Move subtitle into position
    backButtonOpacity.value = withDelay(300, withSpring(1)); // Fade in back button
    backButtonTranslateY.value = withDelay(300, withSpring(0)); // Move back button into position
    inputsOpacity.value = withDelay(450, withSpring(1)); // Fade in input fields
    inputsTranslateY.value = withDelay(450, withSpring(0)); // Move input fields into position
    buttonOpacity.value = withDelay(600, withSpring(1)); // Fade in submit button
    buttonTranslateY.value = withDelay(600, withSpring(0)); // Move submit button into position
  }, []);

  // Function that handles the password change process
  const handleChangePassword = async () => {
    setMessage(''); // Clear any previous messages
    setShowMessage(false); // Hide any previous message displays
    
    // Make sure user is logged in
    if (!auth.currentUser) return;

    // Check if all fields are filled out
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setMessage('Please fill in all fields.');
      setShowMessage(true);
      return;
    }

    // Verify new passwords match
    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match.');
      setShowMessage(true);
      return;
    }

    try {
      // Verify current password is correct
      await signInWithEmailAndPassword(auth, auth.currentUser.email!, currentPassword);
      // Update to new password
      await updatePassword(auth.currentUser, newPassword);
      // Show success message and return to previous screen
      Alert.alert('Success', 'Your password has been changed successfully.');
      navigation.goBack();
    } catch (error: any) {
      // Handle any errors during the process
      console.error('Error changing password:', error);
      // Show appropriate error message to user
      if (error.code === 'auth/wrong-password') {
        setMessage('Current password is incorrect. Please try again.');
      } else {
        setMessage('Failed to change password. Please try again.');
      }
      setShowMessage(true);
    }
  };

  // Define how animations should look
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value, // Controls fade in/out
    transform: [{ translateY: titleTranslateY.value }], // Controls vertical movement
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value, // Controls subtitle fade in/out
    transform: [{ translateY: subtitleTranslateY.value }], // Controls subtitle movement
  }));

  const animatedBackButtonStyle = useAnimatedStyle(() => ({
    opacity: backButtonOpacity.value, // Controls back button fade in/out
    transform: [{ translateY: backButtonTranslateY.value }], // Controls back button movement
  }));

  const animatedInputsStyle = useAnimatedStyle(() => ({
    opacity: inputsOpacity.value, // Controls form inputs fade in/out
    transform: [{ translateY: inputsTranslateY.value }], // Controls form inputs movement
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value, // Controls submit button fade in/out
    transform: [{ translateY: buttonTranslateY.value }], // Controls submit button movement
  }));

  return (
    // The visual layout of the screen
    <>
      <Stack.Screen options={{ headerShown: false }} /> {/* Hide default header */}
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Back button with animation */}
          <Animated.View style={[styles.backButton, animatedBackButtonStyle]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>back</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* App title with animation */}
          <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
            <Text style={styles.title}>HabiBeats</Text>
          </Animated.View>
          
          {/* Subtitle with animation */}
          <Animated.View style={[styles.subtitleContainer, animatedSubtitleStyle]}>
            <Text style={[styles.subtitle, styles.boldText]}>Change Password</Text>
          </Animated.View>
          
          {/* Password change form with animations */}
          <Animated.View style={[styles.formContainer, animatedInputsStyle]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.smallerText]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="current password"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.smallerText]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="new password"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.smallerText]}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                placeholder="confirm new password"
                placeholderTextColor="#999"
              />
            </View>
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity style={styles.changeButton} onPress={handleChangePassword}>
                <Text style={styles.changeButtonText}>Change Password</Text>
              </TouchableOpacity>
            </Animated.View>
            {showMessage && message ? <Text style={[styles.message, styles.smallerText]}>{message}</Text> : null}
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 65,
    paddingTop: 150,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fba904',
    fontWeight: 'bold',
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fc6c85',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  subtitleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#0e1514',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 0,
    paddingHorizontal: 10,
    color: '#808080',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  smallerText: {
    fontSize: 12,
  },
  changeButton: {
    backgroundColor: 'rgba(121, 206, 84, 1)',
    padding: 15,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },
  changeButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  message: {
    color: '#0e1514',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChangePassword;

// END of Change Password UI/UX
// END of Maxwell Guillermo Contribution