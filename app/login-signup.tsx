import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';

// Custom TextInput component
const CustomTextInput = ({ value, onChangeText, secureTextEntry = false, ...props }: {
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  [key: string]: any;
}) => {
  const placeholder = '******';
  return (
    <TextInput
      {...props}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      placeholder={placeholder}
      placeholderTextColor="#e66cab"
      style={[styles.input, value ? {} : styles.inputWithAsterisks]}
    />
  );
};

export default function LoginSignup() {
  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

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

  const handleFirebaseErrors = (error: Error) => {
    switch (error.message) {
      case "Firebase: Error (auth/invalid-email).":
        Alert.alert("Error", "The email address is badly formatted.");
        break;
      case "Firebase: Error (auth/user-not-found).":
        Alert.alert("Error", "No user found with this email.");
        break;
      case "Firebase: Error (auth/wrong-password).":
        Alert.alert("Error", "Incorrect password. Please try again.");
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

  // UI Render
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>HabiBeats</Text>
            <Image
              source={require('../assets/images/habibeats-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <CustomTextInput 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <CustomTextInput 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
              />
            </View>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={signIn}
            >
              <Text style={styles.signInButtonText}>
                sign in
              </Text>
            </TouchableOpacity>

            {/* Bottom Links */}
            <View style={styles.bottomLinks}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={[styles.forgotPassword, styles.boldText]}>forgot password</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={[styles.signUp, styles.boldText]}>sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 18,
    paddingHorizontal: 15,
    fontSize: 10,
    color: '#000',
  },
  inputWithAsterisks: {
    color: '#e66cab',
  },
  signInButton: {
    backgroundColor: "#e07ab1",
    padding: 10,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  signInButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textTransform: 'lowercase',
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  forgotPassword: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  signUp: {
    color: '#FFA500',
    fontSize: 12,
  },
  boldText: {
    fontWeight: 'bold',
  },
});
