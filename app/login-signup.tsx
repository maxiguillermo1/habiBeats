import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

// Custom TextInput component
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
      placeholderTextColor="#A0A0A0"
      style={styles.input}
    />
  );
};

export default function LoginSignup() {
  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // START of Animated Flow
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const linksOpacity = useSharedValue(0);
  const linksTranslateY = useSharedValue(50);

  useEffect(() => {
    titleOpacity.value = withSpring(1);
    titleTranslateY.value = withSpring(0);
    formOpacity.value = withDelay(150, withSpring(1));
    formTranslateY.value = withDelay(150, withSpring(0));
    buttonOpacity.value = withDelay(300, withSpring(1));
    buttonTranslateY.value = withDelay(300, withSpring(0));
    linksOpacity.value = withDelay(450, withSpring(1));
    linksTranslateY.value = withDelay(450, withSpring(0));
  }, []);

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
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

  // END of Animated Flow

  // Authentication functions
  async function signIn() {
    const auth = getAuth(app);
    console.log("Attempting to sign in with email:", email);

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Sign in successful:", user);

      setErrorMessage(""); // Clear any existing error message

      Alert.alert("Success", "You have successfully signed in!", [
        { text: "OK", onPress: () => router.push("/profile") }
      ]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Sign in failed:", error.name, error.message);
        handleFirebaseErrors(error);
      } else {
        console.error("An unknown error occurred");
        Alert.alert("Error", "An unknown error occurred");
      }
    }
  }
  // Firebase Log Error Handlings
  const handleFirebaseErrors = (error: Error) => {
    switch (error.message) {
      case "Firebase: Error (auth/user-not-found).":
        Alert.alert("Error", "No user found with this email.");
        break;
      case "Firebase: Error (auth/invalid-credential).":
        setErrorMessage("Incorrect email or password. Please try again.");
        break;
      default:
        Alert.alert("Error", error.message);
        break;
    }
  };

  // Navigation functions
  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleForgotPassword = () => {
    router.push("/forgotpassword");
  };

  const handleBackPress = () => {
    router.push("/landing");
  };

  // UI Render
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          {/* Header */}
          <Animated.View style={[styles.headerContainer, animatedTitleStyle]}>
            <Text style={styles.title}>HabiBeats</Text>
            {/* <Image
              source={require('../assets/images/habibeats-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            /> */}
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, animatedFormStyle]}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <CustomTextInput 
                value={email} 
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="enter your email"
              />
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <CustomTextInput 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
                placeholder="enter your password"
              />
            </View>

            {/* Sign In Button */}
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity 
                style={styles.signInButton} 
                onPress={signIn}
              >
                <Text style={styles.signInButtonText}>
                  sign in
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom Links */}
            <Animated.View style={[styles.bottomLinks, animatedLinksStyle]}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={[styles.forgotPassword, styles.boldText]}>forgot password</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={[styles.signUp, styles.boldText]}>sign up</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 65,
    paddingTop: 70,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  logo: {
    width: 225,
    height: 225,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    width: "100%",
    height: 36,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 5,
    fontSize: 14,
    color: '#000',
  },
  signInButton: {
    backgroundColor: "#e07ab1",
    padding: 10,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  signInButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textTransform: 'lowercase',
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  forgotPassword: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  signUp: {
    color: '#FFA500',
    fontSize: 15,
  },
  boldText: {
    fontWeight: 'bold',
  },
  // error text styling
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'left',
    padding: 5,
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
    color: '#f4a261',
    fontWeight: 'bold',
  },
});
