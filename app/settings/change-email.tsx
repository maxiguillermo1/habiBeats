// change-email.tsx
// Maxwell Guillermo

// START of Change Email UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, Image } from 'react-native';
import { getAuth, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Main component for changing email functionality
const ChangeEmail = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState(''); // Holds the user's current password
  const [newEmail, setNewEmail] = useState(''); // Holds the new email address
  const [message, setMessage] = useState(''); // Stores feedback messages to show to the user
  const [showMessage, setShowMessage] = useState(false); // Controls whether to display the feedback message
  const navigation = useNavigation(); // Navigation object for screen transitions
  const auth = getAuth(); // Firebase authentication instance

  // Create animation values for smooth transitions
  // Each element has two properties: opacity (fade in/out) and translateY (slide up/down)
  const titleOpacity = useSharedValue(0); // Controls title fade in
  const titleTranslateY = useSharedValue(50); // Controls title sliding up
  const subtitleOpacity = useSharedValue(0); // Controls subtitle fade in
  const subtitleTranslateY = useSharedValue(50); // Controls subtitle sliding up
  const backButtonOpacity = useSharedValue(0); // Controls back button fade in
  const backButtonTranslateY = useSharedValue(50); // Controls back button sliding up
  const inputsOpacity = useSharedValue(0); // Controls form inputs fade in
  const inputsTranslateY = useSharedValue(50); // Controls form inputs sliding up
  const buttonOpacity = useSharedValue(0); // Controls submit button fade in
  const buttonTranslateY = useSharedValue(50); // Controls submit button sliding up
  const logoOpacity = useSharedValue(0); // Controls logo fade in
  const logoTranslateY = useSharedValue(50); // Controls logo sliding up

  // When the component loads, start the animations in sequence
  useEffect(() => {
    // Animate title immediately
    titleOpacity.value = withSpring(1); // Fade in the title
    titleTranslateY.value = withSpring(0); // Slide up the title

    // Animate subtitle after a small delay (150ms)
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));

    // Animate back button after 300ms
    backButtonOpacity.value = withDelay(300, withSpring(1));
    backButtonTranslateY.value = withDelay(300, withSpring(0));

    // Animate form inputs after 450ms
    inputsOpacity.value = withDelay(450, withSpring(1));
    inputsTranslateY.value = withDelay(450, withSpring(0));

    // Animate submit button after 600ms
    buttonOpacity.value = withDelay(600, withSpring(1));
    buttonTranslateY.value = withDelay(600, withSpring(0));

    // Animate logo after 750ms
    logoOpacity.value = withDelay(750, withSpring(1));
    logoTranslateY.value = withDelay(750, withSpring(0));
  }, []);

  // Function that handles the email change process
  const handleChangeEmail = async () => {
    setMessage(''); // Clear any previous messages
    setShowMessage(false); // Hide the message display

    // Check if user is logged in
    if (!auth.currentUser) return;

    // Validate that all fields are filled
    if (!currentPassword || !newEmail) {
      setMessage(t('alerts.error_required_fields'));
      setShowMessage(true);
      return;
    }

    try {
      // Create authentication credential using current email and password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email || '', // Use current email or empty string if null
        currentPassword
      );

      // Re-authenticate user to ensure they have permission to make changes
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update the email address
      await updateEmail(auth.currentUser, newEmail);

      // Show success message and return to previous screen
      Alert.alert(t('common.success'), t('alerts.success_email'));
      navigation.goBack();
    } catch (error: any) {
      // Handle different types of errors with specific messages
      console.error('Error changing email:', error);
      let errorMessage = t('alerts.error_generic');
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('alerts.error_wrong_password');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('alerts.error_invalid_email');
      }
      
      setMessage(errorMessage);
      setShowMessage(true);
    }
  };

  // Create animation styles for each animated component
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value, // Control fade in/out
    transform: [{ translateY: titleTranslateY.value }], // Control sliding up/down
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value, // Control subtitle fade in/out
    transform: [{ translateY: subtitleTranslateY.value }], // Control subtitle sliding
  }));

  const animatedBackButtonStyle = useAnimatedStyle(() => ({
    opacity: backButtonOpacity.value, // Control back button fade in/out
    transform: [{ translateY: backButtonTranslateY.value }], // Control back button sliding
  }));

  const animatedInputsStyle = useAnimatedStyle(() => ({
    opacity: inputsOpacity.value, // Control inputs fade in/out
    transform: [{ translateY: inputsTranslateY.value }], // Control inputs sliding
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value, // Control button fade in/out
    transform: [{ translateY: buttonTranslateY.value }], // Control button sliding
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value, // Control logo fade in/out
    transform: [{ translateY: logoTranslateY.value }], // Control logo sliding
  }));

  // Render the component's UI
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} /> {/* Hide the default header */}
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Back button with animation */}
          <Animated.View style={[styles.backButton, animatedBackButtonStyle]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Title section with animation */}
          <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
            <Text style={styles.title}>{t('settings.account.change_email')}</Text>
          </Animated.View>
          
          {/* Form section with animations */}
          <Animated.View style={[styles.formContainer, animatedInputsStyle]}>
            {/* Password input field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.smallerText]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder={t('settings.account.current_password')}
                placeholderTextColor="#999"
              />
            </View>
            {/* New email input field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.smallerText]}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t('settings.account.new_email')}
                placeholderTextColor="#999"
              />
            </View>
            {/* Submit button with animation */}
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity style={styles.changeButton} onPress={handleChangeEmail}>
                <Text style={styles.changeButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </Animated.View>
            {/* Error/success message display */}
            {showMessage && message ? <Text style={[styles.message, styles.smallerText]}>{message}</Text> : null}
          </Animated.View>
          
          {/* Logo section with animation */}
          <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
            {/* Comment out or remove the Image component for now */}
            {/* <Image
              source={require('../assets/images/transparent_mini_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            /> */}
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
  logoContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  logo: {
    width: 50,
    height: 50,
  },
});

export default ChangeEmail;

// END of Change Email UI/UX
// END of Maxwell Guillermo Contribution