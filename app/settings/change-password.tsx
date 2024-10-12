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

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
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
  }, []);

  const handleChangePassword = async () => {
    setMessage('');
    setShowMessage(false);
    if (!auth.currentUser) return;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setMessage('Please fill in all fields.');
      setShowMessage(true);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match.');
      setShowMessage(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, auth.currentUser.email!, currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Success', 'Your password has been changed successfully.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage('Current password is incorrect. Please try again.');
      } else {
        setMessage('Failed to change password. Please try again.');
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
            <Text style={[styles.subtitle, styles.boldText]}>Change Password</Text>
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