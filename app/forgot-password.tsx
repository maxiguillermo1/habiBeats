// forgotpassword.tsx
// Maxwell Guillermo

  // START of Forgot Password Code
  // START of Maxwell Guillermo
import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Keyboard, Image } from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { Stack } from 'expo-router';
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

// This is the main component for handling password reset functionality
export default function ForgotPassword() {
  // These are like memory boxes that store different pieces of information we need
  const [email, setEmail] = useState("");        // Stores the user's email address
  const [otp, setOtp] = useState("");           // Stores the one-time password code user enters
  const [newPassword, setNewPassword] = useState(""); // Stores the new password user wants to set
  const [step, setStep] = useState("email");    // Keeps track of which screen we're on ("email" or "otp")
  const [message, setMessage] = useState("");    // Stores messages we want to show to the user
  const [showMessage, setShowMessage] = useState(true); // Controls whether to show or hide messages
  
  // This helps us navigate between different screens
  const router = useRouter();
  // This is our connection to the database
  const db = getFirestore(app);

  // These special values control animations for different elements on screen
  const titleOpacity = useSharedValue(0);       // Controls how visible the title is
  const titleTranslateY = useSharedValue(50);   // Controls how far down the title starts
  const subtitleOpacity = useSharedValue(0);    // Controls how visible the subtitle is
  const subtitleTranslateY = useSharedValue(50);// Controls how far down the subtitle starts
  const backButtonOpacity = useSharedValue(0);  // Controls how visible the back button is
  const backButtonTranslateY = useSharedValue(50); // Controls how far down the back button starts
  const emailInputOpacity = useSharedValue(0);  // Controls how visible the email input is
  const emailInputTranslateY = useSharedValue(50); // Controls how far down the email input starts
  const resetButtonOpacity = useSharedValue(0); // Controls how visible the reset button is
  const resetButtonTranslateY = useSharedValue(50); // Controls how far down the reset button starts
  const otpInputOpacity = useSharedValue(0);    // Controls how visible the OTP input is
  const otpInputTranslateY = useSharedValue(50);// Controls how far down the OTP input starts
  const newPasswordInputOpacity = useSharedValue(0); // Controls how visible the new password input is
  const newPasswordInputTranslateY = useSharedValue(50); // Controls how far down the new password input starts
  const miniLogoOpacity = useSharedValue(0);    // Controls how visible the mini logo is
  const miniLogoScale = useSharedValue(0.5);    // Controls how big the mini logo starts

  // This runs when the screen first loads to start all our animations
  useEffect(() => {
    // Each animation starts with a slight delay after the previous one
    titleOpacity.value = withSpring(1);         // Fade in the title
    titleTranslateY.value = withSpring(0);      // Move the title up
    subtitleOpacity.value = withDelay(150, withSpring(1));     // Fade in subtitle after delay
    subtitleTranslateY.value = withDelay(150, withSpring(0));  // Move subtitle up after delay
    backButtonOpacity.value = withDelay(300, withSpring(1));   // Fade in back button
    backButtonTranslateY.value = withDelay(300, withSpring(0)); // Move back button up
    emailInputOpacity.value = withDelay(450, withSpring(1));   // Fade in email input
    emailInputTranslateY.value = withDelay(450, withSpring(0)); // Move email input up
    resetButtonOpacity.value = withDelay(600, withSpring(1));  // Fade in reset button
    resetButtonTranslateY.value = withDelay(600, withSpring(0)); // Move reset button up
    otpInputOpacity.value = withDelay(450, withSpring(1));     // Fade in OTP input
    otpInputTranslateY.value = withDelay(450, withSpring(0));  // Move OTP input up
    newPasswordInputOpacity.value = withDelay(600, withSpring(1)); // Fade in new password input
    newPasswordInputTranslateY.value = withDelay(600, withSpring(0)); // Move new password input up
    miniLogoOpacity.value = withDelay(750, withSpring(1));     // Fade in mini logo
    miniLogoScale.value = withDelay(750, withSpring(1));       // Scale up mini logo
  }, []);

  // These create the animation styles for each element
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

  // Creates a random 6-digit code for password reset
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // This function handles sending the recovery code to the user's email
  const sendPasswordResetOTP = async (email: string) => {
    const otpCode = generateOTP();              // Generate a new code
    const timestamp = Timestamp.now();          // Record when this happened

    try {
      // Save the recovery code information to our database
      await addDoc(collection(db, "password_resets"), {
        email: email,
        otp: otpCode,
        timestamp: timestamp,
        used: false
      });

      // Send the code to the user's email using a special function
      const functions = getFunctions(app);
      const sendOTPFunc = httpsCallable(functions, 'sendOTP');
      await sendOTPFunc({ email, otp: otpCode });

      // Show success message and move to next screen
      setMessage(`Recovery code sent to ${email}.\n\nEnter code to reset password.`);
      setShowMessage(true);
      setStep("otp");
    } catch (error) {
      // If something goes wrong, show an error message
      console.error("Error sending OTP:", error);
      setMessage("Failed to send OTP. Please try again.");
      setShowMessage(true);
    }
  };

  // This function handles the initial step of sending the OTP
  const handleSendOTP = async () => {
    // Check if email is provided
    if (!email) {
      setMessage("Please enter your email address.");
      setShowMessage(true);
      return;
    }

    // Check if the email exists in our database
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      setMessage("Email not found. Please check your email address.");
      setShowMessage(true);
      return;
    }

    // Hide the keyboard
    Keyboard.dismiss();

    // Try to send the OTP
    try {
      await sendPasswordResetOTP(email);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      setMessage("Failed to send OTP. Please try again.");
      setShowMessage(true);
    }
  };

  // This function verifies the OTP and sets the new password
  const verifyOTPAndResetPassword = async () => {
    // Check if all required fields are filled
    if (!email || !otp || !newPassword) {
      setMessage("Please fill in all fields.");
      setShowMessage(true);
      return;
    }

    // Hide the keyboard
    Keyboard.dismiss();

    try {
      // Call the password reset function
      const functions = getFunctions(app);
      const resetPasswordFunc = httpsCallable(functions, 'resetPassword');
      const result = await resetPasswordFunc({ email, otp, newPassword });
      
      // Show success message and redirect to login
      setMessage("Your password has been reset successfully!");
      setShowMessage(true);
      setTimeout(() => router.replace("/login-signup"), 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("Failed to reset password. Please try again.");
      setShowMessage(true);
    }
  };

  // This is what shows up on the screen
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
// Maxwell Guillermo
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

  

// END of Forgot Password Code
// END of Maxwell Guillermo