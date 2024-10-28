// login-signup.tsx
// Author: Reyna Aguirre
// This file handles the login functionality for the HabiBeats app, including form validation,
// Firebase authentication, and animated UI elements.

// Import necessary React and React Native components
import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, ActivityIndicator, Keyboard } from "react-native";
// Import Firebase authentication functions
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig.js";
// Import routing components
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';
// Import animation utilities from Reanimated
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

// Custom TextInput component that wraps React Native's TextInput with consistent styling
const CustomTextInput = ({ value, onChangeText, secureTextEntry = false, placeholder, ...props }: {
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  placeholder: string;
  [key: string]: any;
}) => {
  return (
    <TextInput
      {...props}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      placeholder={placeholder}
      placeholderTextColor="#C0C0C0"
      style={[styles.input, styles.smallerText]}
    />
  );
};

export default function LoginSignup() {
  // State management for form inputs and UI states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emptyFieldsError, setEmptyFieldsError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Animation values for various UI elements using Reanimated
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const linksOpacity = useSharedValue(0);
  const linksTranslateY = useSharedValue(50);
  const miniLogoOpacity = useSharedValue(0);
  const miniLogoScale = useSharedValue(0.5);

  // Initialize animations on component mount
  useEffect(() => {
    // Sequence of animations with delays for a staggered effect
    titleOpacity.value = withSpring(1);
    titleTranslateY.value = withSpring(0);
    subtitleOpacity.value = withDelay(100, withSpring(1));
    subtitleTranslateY.value = withDelay(100, withSpring(0));
    formOpacity.value = withDelay(200, withSpring(1));
    formTranslateY.value = withDelay(200, withSpring(0));
    buttonOpacity.value = withDelay(350, withSpring(1));
    buttonTranslateY.value = withDelay(350, withSpring(0));
    linksOpacity.value = withDelay(500, withSpring(1));
    linksTranslateY.value = withDelay(500, withSpring(0));
    miniLogoOpacity.value = withDelay(750, withSpring(1));
    miniLogoScale.value = withDelay(750, withSpring(1));
  }, []);

  // Define animated styles for UI elements
  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    };
  });

  const animatedSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateY.value }],
    };
  });

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    };
  });

  const animatedLinksStyle = useAnimatedStyle(() => {
    return {
      opacity: linksOpacity.value,
      transform: [{ translateY: linksTranslateY.value }],
    };
  });

  const animatedMiniLogoStyle = useAnimatedStyle(() => ({
    opacity: miniLogoOpacity.value,
    transform: [{ scale: miniLogoScale.value }],
  }));

  // Handle user sign in with Firebase authentication
  async function signIn() {
    Keyboard.dismiss();  // Dismiss keyboard when sign in is attempted
    const auth = getAuth(app);
    console.log("Attempting to sign in with email:", email);

    // Validate form inputs
    if (!email || !password) {
      setEmptyFieldsError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Attempt Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Sign in successful:", user);

      // Clear any existing error messages
      setErrorMessage(""); 
      setEmptyFieldsError(""); 

      // Add delay before navigation for loading indicator
      setTimeout(() => {
        setIsLoading(false);
        router.push("/profile");
      }, 2000);

    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof Error) {
        console.error("Sign in failed:", error.name, error.message);
        handleFirebaseErrors(error);
      } else {
        console.error("An unknown error occurred");
        Alert.alert("Error", "An unknown error occurred");
      }
    }
  }

  // Handle different Firebase authentication errors
  const handleFirebaseErrors = (error: Error) => {
    switch (error.message) {
      case "Firebase: Error (auth/user-not-found).":
        Alert.alert("Error", "No user found with this email.");
        break;
      case "Firebase: Error (auth/invalid-credential).":
        setErrorMessage("Incorrect email or password. Please try again.");
        break;
      case "Firebase: Error (auth/invalid-email).":
        setErrorMessage("Invalid email address. Please enter a valid email.");
        break;
      default:
        Alert.alert("Error", error.message);
        break;
    }
  };

  // Navigation handlers
  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  const handleBackPress = () => {
    router.push("/landing");
  };

  // Render the UI
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          {/* Header */}
          <Animated.View style={[styles.headerContainer, animatedTitleStyle]}>
            <Text style={styles.title}>HabiBeats</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, animatedFormStyle]}>
            <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>
              <Text style={styles.boldText}>Sign In</Text>{'\n'}
            </Animated.Text>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <CustomTextInput 
                value={email} 
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage("");
                  setEmptyFieldsError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email"
              />
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <CustomTextInput 
                value={password} 
                onChangeText={(text) => {
                  setPassword(text);
                  setEmptyFieldsError("");
                }} 
                secureTextEntry 
                placeholder="password"
              />
            </View>

            {emptyFieldsError ? <Text style={styles.emptyFieldsErrorText}>{emptyFieldsError}</Text> : null}

            {/* Sign In Button */}
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity 
                style={styles.signInButton} 
                onPress={signIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.signInButtonText}>
                    sign in
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom Links */}
            <Animated.View style={[styles.bottomLinks, animatedLinksStyle]}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={[styles.forgotPassword, styles.boldText]}>forgot password</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
        
        {/* Sign Up Button */}
        <Animated.View style={[styles.signUpButtonContainer, animatedLinksStyle]}>
          <Text style={styles.newHereText}>new here?</Text>
          <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
            <Text style={[styles.signUpButtonText, styles.boldText]}>Sign Up Now</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Image 
          source={require('../assets/images/transparent_mini_logo.png')} 
          style={[styles.miniLogo, animatedMiniLogoStyle]}
        />
      </SafeAreaView>
    </>
  );
}

// Styles for the UI components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 55,
    paddingTop: 70,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',  // Ensure the container takes full width
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#fc6c85',
    textAlign: 'center',
    width: '100%',  // Ensure the text takes full width of its container
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#0e1514',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  normalText: {
    fontWeight: 'normal',
  },
  logo: {
    width: 225,
    height: 225,
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
  signInButton: {
    backgroundColor: 'rgba(121, 206, 84, 1)',
    paddingVertical: 12,
    paddingHorizontal: 3,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  signInButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  forgotPassword: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  signUpButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 230,
    left: 0,
    right: 0,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    marginLeft: 10,
  },
  signUpButtonText: {
    color: '#79ce54',
    fontSize: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'left',
    padding: 5,
    borderRadius: 5,
  },
  emptyFieldsErrorText: {
    color: 'red',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'left',
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  backButton: {
    position: 'absolute',
    top: 80,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fba904',
    fontWeight: 'bold',
  },
  newHereText: {
    color: '#0e1514',
    fontSize: 15,
  },
  miniLogo: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    width: 80,
    height: 80,
  },
});
