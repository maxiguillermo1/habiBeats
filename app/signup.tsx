// sign up page (user registration)

import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from "react-native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter, Stack } from "expo-router";

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

export default function SignUp() {
  // State variables to store user input
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const router = useRouter();

  // Function to handle the sign-up process
  const handleSignUp = async () => {
    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const auth = getAuth(app);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Sign up successful:", user);
      Alert.alert("Success", "You have successfully signed up!");
      router.push("/login-signup");
    } catch (error) {
      // Handle sign-up errors
      if (error instanceof Error) {
        console.error("Sign up failed:", error.message);
        Alert.alert("Error", error.message);
      } else {
        console.error("An unknown error occurred");
        Alert.alert("Error", "An unknown error occurred");
      }
    }
  };

  // UI component
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* First Name input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name</Text>
            <CustomTextInput value={firstName} onChangeText={setFirstName} />
          </View>
          {/* Last Name input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <CustomTextInput value={lastName} onChangeText={setLastName} />
          </View>
          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <CustomTextInput 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {/* Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <CustomTextInput value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          {/* Confirm Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Re-enter Password</Text>
            <CustomTextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>
          {/* Sign Up button */}
          <TouchableOpacity 
            style={{
              backgroundColor: "#e07ab1", // Soft pink color
              padding: 10, // Reduced padding to keep it narrow
              borderRadius: 25, // Rounded corners
              width: "100%", // Full width to match other buttons
              alignItems: "center",
              marginTop: 20,
            }} 
            onPress={handleSignUp}
          >
            <Text style={{
              color: "white",
              fontSize: 12, // Slightly reduced font size
              fontWeight: "500",
              textTransform: 'lowercase',
            }}>
              sign up
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

// Updated styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    fontWeight: 'bold', // Add this line
  },
  content: {
    flex: 1,
    paddingHorizontal: 65,
    paddingTop: 100,
    paddingBottom: 20,
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
    height: 36, // Very slim height
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 18, // Half of the height for perfect roundness
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#000', // Add this line to ensure text is visible
  },
  inputWithAsterisks: {
    color: '#e66cab', // Changed to match the button color
  },
  button: {
    backgroundColor: "#e66cab",
    padding: 12,
    borderRadius: 18, // Matched with input borderRadius
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textTransform: 'lowercase',
  },
});