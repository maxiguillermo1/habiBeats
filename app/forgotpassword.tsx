// forgotpassword.tsx
// Reyna Aguirre and Maxwell Guillermo

import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Keyboard, Image } from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app, checkEmailInFirestore } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [message, setMessage] = useState(""); // New state for the message
  const [showMessage, setShowMessage] = useState(true); // New state to control message visibility
  const router = useRouter();
  const db = getFirestore(app);

  // START of Animation Code
  // START of Reyna Aguirre Contribution
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const backButtonOpacity = useSharedValue(0);
  const backButtonTranslateY = useSharedValue(50);
  const emailInputOpacity = useSharedValue(0);
  const emailInputTranslateY = useSharedValue(50);
  const resetButtonOpacity = useSharedValue(0);
  const resetButtonTranslateY = useSharedValue(50);
  const otpInputOpacity = useSharedValue(0);
  const otpInputTranslateY = useSharedValue(50);
  const newPasswordInputOpacity = useSharedValue(0);
  const newPasswordInputTranslateY = useSharedValue(50);
  const miniLogoOpacity = useSharedValue(0);
  const miniLogoScale = useSharedValue(0.5);

  useEffect(() => {
    titleOpacity.value = withSpring(1);
    titleTranslateY.value = withSpring(0);
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));
    backButtonOpacity.value = withDelay(300, withSpring(1));
    backButtonTranslateY.value = withDelay(300, withSpring(0));
    emailInputOpacity.value = withDelay(450, withSpring(1));
    emailInputTranslateY.value = withDelay(450, withSpring(0));
    resetButtonOpacity.value = withDelay(600, withSpring(1));
    resetButtonTranslateY.value = withDelay(600, withSpring(0));
    otpInputOpacity.value = withDelay(450, withSpring(1));
    otpInputTranslateY.value = withDelay(450, withSpring(0));
    newPasswordInputOpacity.value = withDelay(600, withSpring(1));
    newPasswordInputTranslateY.value = withDelay(600, withSpring(0));
    miniLogoOpacity.value = withDelay(750, withSpring(1));
    miniLogoScale.value = withDelay(750, withSpring(1));
  }, []);

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

  const animatedEmailInputStyle = useAnimatedStyle(() => ({
    opacity: emailInputOpacity.value,
    transform: [{ translateY: emailInputTranslateY.value }],
  }));

  const animatedResetButtonStyle = useAnimatedStyle(() => ({
    opacity: resetButtonOpacity.value,
    transform: [{ translateY: resetButtonTranslateY.value }],
  }));

  const animatedOtpInputStyle = useAnimatedStyle(() => ({
    opacity: otpInputOpacity.value,
    transform: [{ translateY: otpInputTranslateY.value }],
  }));

  const animatedNewPasswordInputStyle = useAnimatedStyle(() => ({
    opacity: newPasswordInputOpacity.value,
    transform: [{ translateY: newPasswordInputTranslateY.value }],
  }));

  const animatedMiniLogoStyle = useAnimatedStyle(() => ({
    opacity: miniLogoOpacity.value,
    transform: [{ scale: miniLogoScale.value }],
  }));
  // END of Animation Code
  // END of Reyna Aguirre Contribution

  // START of Recovery Code Functions
  // START of Maxwell Guillermo Contribution
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

      setMessage(`Recovery code sent to ${email}.\n\nEnter code to reset password.`);
      setShowMessage(true);
      setStep("otp");
    } catch (error) {
      console.error("Error sending OTP:", error);
      setMessage("Failed to send OTP. Please try again.");
      setShowMessage(true);
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      setMessage("Please enter your email address.");
      setShowMessage(true);
      return;
    }

    // Check if the email is in firestore
    if (await checkEmailInFirestore(email)) {
      setMessage("Email not found. Please check your email address.");
      setShowMessage(true);
      return;
    }


    Keyboard.dismiss();  // Dismiss the keyboard

    try {
      await sendPasswordResetOTP(email);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      setMessage("Failed to send OTP. Please try again.");
      setShowMessage(true);
    }
  };

  const verifyOTPAndResetPassword = async () => {
    if (!email || !otp || !newPassword) {
      setMessage("Please fill in all fields.");
      setShowMessage(true);
      return;
    }

    Keyboard.dismiss();  // Dismiss the keyboard

    try {
      const functions = getFunctions(app);
      const resetPasswordFunc = httpsCallable(functions, 'resetPassword');
      const result = await resetPasswordFunc({ email, otp, newPassword });
      
      setMessage("Your password has been reset successfully!");
      setShowMessage(true);
      setTimeout(() => router.replace("/login-signup"), 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("Failed to reset password. Please try again.");
      setShowMessage(true);
    }
  };
  // END of Recovery Code Functions
  // END of Maxwell Guillermo Contribution

  // START of UI Render
  // Reyna Aguirre and Maxwell Guillermo
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.backButton, animatedBackButtonStyle]}>
            <TouchableOpacity onPress={() => router.push("/login-signup")}>
              <Text style={styles.backButtonText}>back</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
            <Text style={styles.title}>HabiBeats</Text>
          </Animated.View>
          
          <Animated.View style={[styles.subtitleContainer, animatedSubtitleStyle]}>
            <Text style={[styles.subtitle, styles.boldText]}>Account Recovery</Text>
          </Animated.View>
          
          {step === "email" ? (
            <>
              <Animated.View style={[styles.formContainer, animatedEmailInputStyle]}>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, styles.smallerText]}
                  />
                </View>
                <Animated.View style={animatedResetButtonStyle}>
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={handleSendOTP}
                  >
                    <Text style={styles.resetButtonText}>
                      Send Recovery OTP Code
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                {showMessage && message ? <Text style={[styles.message, styles.smallerText]}>{message}</Text> : null}
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View style={animatedOtpInputStyle}>
                <TextInput
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    setShowMessage(false);
                  }}
                  placeholder="enter OTP code"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Animated.View>
              <View style={styles.smallSpacer} />
              <Animated.View style={animatedNewPasswordInputStyle}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="enter new password"
                  secureTextEntry
                  style={styles.input}
                />
              </Animated.View>
              <View style={styles.spacer} />
              <Animated.View style={animatedResetButtonStyle}>
                <TouchableOpacity 
                  style={styles.resetButton} 
                  onPress={verifyOTPAndResetPassword}
                >
                  <Text style={styles.resetButtonText}>
                    Reset Password
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              {showMessage && message ? <Text style={[styles.message, styles.smallerText]}>{message}</Text> : null}
            </>
          )}
        </View>
        <Animated.Image 
          source={require('../assets/images/transparent_mini_logo.png')} 
          style={[styles.miniLogo, animatedMiniLogoStyle]}
        />
      </SafeAreaView>
    </>
  );
}
// END of UI Render

// START of Style Codes
// Reyna Aguirre and Maxwell Guillermo
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
    color: '#fba904',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 65,
    paddingTop: 150,
    paddingBottom: 20,
    justifyContent: 'flex-start',
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
  resetButton: {
    backgroundColor:'rgba(121, 206, 84, 1)',
    padding: 15,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop:5,
    marginBottom: 20,
  },
  resetButtonText: {
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
  spacer: {
    height: 20,
  },
  smallSpacer: {
    height: 10,
  },
  miniLogo: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    width: 80,
    height: 80,
  },
});
