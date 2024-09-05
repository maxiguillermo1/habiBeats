import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("email"); // "email" or "otp"
  const router = useRouter();
  const db = getFirestore(app);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  };

  const sendPasswordResetOTP = async (email: string) => {
    const otpCode = generateOTP();
    const timestamp = Timestamp.now();

    try {
      await addDoc(collection(db, "password_resets"), {
        email: email,
        otp: otpCode,
        timestamp: timestamp,
        used: false
      });

      const functions = getFunctions(app);
      const sendOTPFunc = httpsCallable(functions, 'sendOTP');
      await sendOTPFunc({ email, otp: otpCode });

      Alert.alert("OTP Sent", `An OTP has been sent to ${email}. Please check your email.`);
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetOTP(email);
      router.push({
        pathname: "/forgotpassword-confirmation",
        params: { email: email }
      });
    } catch (error) {
      console.error("Failed to send OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  const verifyOTPAndResetPassword = async () => {
    if (!email || !otp || !newPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const functions = getFunctions(app);
      const resetPasswordFunc = httpsCallable(functions, 'resetPassword');
      const result = await resetPasswordFunc({ email, otp, newPassword });
      
      Alert.alert(
        "Success", 
        "Your password has been reset successfully.",
        [{ text: "OK", onPress: () => router.replace("/login-signup") }]
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      Alert.alert("Error", "Failed to reset password. Please try again.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>back</Text>
          </TouchableOpacity>
          
          {step === "email" ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"  // Disable capitalization
                  style={styles.input}
                />
              </View>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={handleSendOTP}
              >
                <Text style={styles.resetButtonText}>
                  reset password
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                style={styles.input}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                style={styles.input}
              />
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={verifyOTPAndResetPassword}
              >
                <Text style={styles.resetButtonText}>
                  Reset Password
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    top: 20,
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
    paddingTop: 150,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 15,  // Increased margin to add more spacing
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
    marginTop: 10,
  },
  resetButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textTransform: 'lowercase',
  },
});


