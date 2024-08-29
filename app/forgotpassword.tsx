import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter } from "expo-router";

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
        "Password reset email sent. Please check your inbox.",
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#E0E0E0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/login-signup")}>
          <Text style={styles.backToLogin}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#e66cab",
    padding: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  backToLogin: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 20,
  },
});
