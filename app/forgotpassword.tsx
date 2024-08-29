import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    const auth = getAuth(app);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Success",
        "Password reset email sent. Please check your inbox to reset your password.",
        [{ text: "OK", onPress: () => router.push("/login-signup") }]
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Password reset failed:", error.message);
        handleFirebaseErrors(error);
      } else {
        console.error("An unknown error occurred");
        Alert.alert("Error", "An unknown error occurred");
      }
    }
  };

  const handleFirebaseErrors = (error: Error) => {
    switch (error.message) {
      case "Firebase: Error (auth/invalid-email).":
        Alert.alert("Error", "The email address is badly formatted.");
        break;
      case "Firebase: Error (auth/user-not-found).":
        Alert.alert("Error", "No user found with this email.");
        break;
      default:
        Alert.alert("Error", error.message);
        break;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email"
              placeholderTextColor="#e66cab"
              style={styles.input}
            />
          </View>
          
          {/* Reset Password button */}
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={handleResetPassword}
          >
            <Text style={styles.resetButtonText}>
              reset password
            </Text>
          </TouchableOpacity>
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
    content: {
      flex: 1,
      paddingHorizontal: 65,
      paddingTop: 150,  // Reduced padding to move content closer to the top
      paddingBottom: 20,
      justifyContent: 'flex-start',  // Ensure content aligns at the top
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
    resetButton: {
      backgroundColor: "#e07ab1",
      padding: 10,
      borderRadius: 25,
      width: "100%",
      alignItems: "center",
      marginTop: 10,  // Reduced margin to bring button closer to the top
    },
    resetButtonText: {
      color: "white",
      fontSize: 12,
      fontWeight: "500",
      textTransform: 'lowercase',
    },
  });
