// forgotpassword-confirmation.tsx
// Reyna Aguirre and Maxwell Guillermo

// Forgot Password Confirmation

  // START of Forgot Password Confirmation Code
  // START of Maxwell Guillermo
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { getAuth, signInWithCustomToken, updatePassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from "../firebaseConfig.js";

export default function ForgotPasswordConfirm() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);

  const verifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP from your email.");
      return;
    }

    const q = query(
      collection(db, "password_resets"),
      where("email", "==", email),
      where("otp", "==", otp),
      where("used", "==", false)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();

      const now = Timestamp.now();
      const expirationTime = 15 * 60 * 1000; // 15 minutes
      const isExpired = now.toMillis() - data.timestamp.toMillis() > expirationTime;

      if (!isExpired) {
        setOtpVerified(true);
        Alert.alert("Success", "OTP verified. Please enter your new password.");
      } else {
        Alert.alert("Error", "OTP has expired.");
      }
    } else {
      Alert.alert("Error", "Invalid OTP.");
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters long.");
      return;
    }

    try {
      const resetPasswordFunc = httpsCallable(functions, 'resetPassword');
      const result = await resetPasswordFunc({ email, otp, newPassword });
      
      Alert.alert(
        "Success", 
        "Your password has been reset successfully.",
        [{ text: "OK", onPress: () => router.replace("/login-signup") }]
      );
    } catch (error: any) {
      console.error("Error resetting password:", error);
      if (error.code === 'not-found') {
        Alert.alert("Error", "No user found with this email address. Please check your email and try again.");
      } else {
        Alert.alert("Error", "Failed to reset password. Please try again.");
      }
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
          <Text style={styles.emailText}>reset password for: {email}</Text>
          
          {!otpVerified ? (
            <>
              <View style={styles.inputContainer}>
               
                <TextInput 
                  value={otp} 
                  onChangeText={setOtp}
                  placeholder="Enter OTP from email"
                  style={styles.input}
                  keyboardType="number-pad"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={verifyOTP}
              >
                <Text style={styles.buttonText}>
                  Verify OTP
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.spacer} />
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput 
                  value={newPassword} 
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  style={styles.input}
                  secureTextEntry
                />
              </View>

              <View style={styles.spacer} />

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  style={styles.input}
                  secureTextEntry
                />
              </View>
              
              <View style={styles.spacer} />

              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetPassword}
              >
                <Text style={styles.buttonText}>
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
    backgroundColor: '#fff8f0',
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
  emailText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 10,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: "#e07ab1",
    padding: 10,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textTransform: 'lowercase',
  },
  verifyButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  
  // Add this new style for spacing
  spacer: {
    height: 20, // Reduced from 40 to 20 to add more consistent spacing
  },
  
});

  // END of Forgot Password Confirmation Code
  // END of Maxwell Guillermo
