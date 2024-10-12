// change-email.tsx
// Maxwell Guillermo

// START of Change Email UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, Image } from 'react-native';
import { getAuth, updateEmail, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Stack } from 'expo-router';

const ChangeEmail = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const navigation = useNavigation();
  const auth = getAuth();

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const backButtonOpacity = useSharedValue(0);
  const backButtonTranslateY = useSharedValue(50);
  const inputsOpacity = useSharedValue(0);
  const inputsTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);

  useEffect(() => {
    titleOpacity.value = withSpring(1);
    titleTranslateY.value = withSpring(0);
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));
    backButtonOpacity.value = withDelay(300, withSpring(1));
    backButtonTranslateY.value = withDelay(300, withSpring(0));
    inputsOpacity.value = withDelay(450, withSpring(1));
    inputsTranslateY.value = withDelay(450, withSpring(0));
    buttonOpacity.value = withDelay(600, withSpring(1));
    buttonTranslateY.value = withDelay(600, withSpring(0));
    logoOpacity.value = withDelay(750, withSpring(1));
    logoTranslateY.value = withDelay(750, withSpring(0));
  }, []);

  const handleChangeEmail = async () => {
    setMessage('');
    setShowMessage(false);
    if (!auth.currentUser) return;

    if (!currentPassword || !newEmail) {
      setMessage('Please fill in all fields.');
      setShowMessage(true);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email || '', // Add fallback empty string
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);
      Alert.alert('Success', 'Your email has been changed successfully.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error changing email:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage('Current password is incorrect. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('The new email address is invalid.');
      } else {
        setMessage('Failed to change email. Please try again.');
      }
      setShowMessage(true);
    }
  };

  // Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const animatedBackButtonStyle = useAnimatedStyle(() => ({
    opacity: backButtonOpacity.value,
    transform: [{ translateY: backButtonTranslateY.value }],
  }));

  const animatedInputsStyle = useAnimatedStyle(() => ({
    opacity: inputsOpacity.value,
    transform: [{ translateY: inputsTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.backButton, animatedBackButtonStyle]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>back</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
            <Text style={styles.title}>HabiBeats</Text>
          </Animated.View>
          
          <Animated.View style={[styles.subtitleContainer, animatedSubtitleStyle]}>
            <Text style={[styles.subtitle, styles.boldText]}>Change Email</Text>
          </Animated.View>
          
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
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="new email"
                placeholderTextColor="#999"
              />
            </View>
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity style={styles.changeButton} onPress={handleChangeEmail}>
                <Text style={styles.changeButtonText}>Change Email</Text>
              </TouchableOpacity>
            </Animated.View>
            {showMessage && message ? <Text style={[styles.message, styles.smallerText]}>{message}</Text> : null}
          </Animated.View>
          
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