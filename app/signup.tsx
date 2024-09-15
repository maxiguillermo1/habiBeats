// sign up page (user registration)

import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { getAuth, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { app } from "../firebaseConfig.js";
import { useRouter, Stack } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, Easing } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

// Custom TextInput component
const CustomTextInput = ({ value, onChangeText, placeholder, ...props }: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  [key: string]: any;
}) => {
  return (
    <TextInput
      {...props}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#C0C0C0"
      style={[styles.input, styles.smallerText]}
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
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const router = useRouter();

  // Animated values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const emailSubtitleOpacity = useSharedValue(0);
  const emailSubtitleTranslateY = useSharedValue(50);
  const emailInputOpacity = useSharedValue(0);
  const emailInputTranslateY = useSharedValue(50);
  const emailButtonOpacity = useSharedValue(0);
  const emailButtonTranslateY = useSharedValue(50);
  const dobSubtitleOpacity = useSharedValue(0);
  const dobSubtitleTranslateY = useSharedValue(50);
  const dobInputOpacity = useSharedValue(0);
  const dobInputTranslateY = useSharedValue(50);
  const dobButtonOpacity = useSharedValue(0);
  const dobButtonTranslateY = useSharedValue(50);
  const passwordSubtitleOpacity = useSharedValue(0);
  const passwordSubtitleTranslateY = useSharedValue(50);
  const passwordInputOpacity = useSharedValue(0);
  const passwordInputTranslateY = useSharedValue(50);
  const confirmPasswordInputOpacity = useSharedValue(0);
  const confirmPasswordInputTranslateY = useSharedValue(50);
  const passwordButtonOpacity = useSharedValue(0);
  const passwordButtonTranslateY = useSharedValue(50);
  const miniLogoOpacity = useSharedValue(0);
  const miniLogoScale = useSharedValue(0.5);

  useEffect(() => {
    titleOpacity.value = withSpring(1);
    titleTranslateY.value = withSpring(0);
    subtitleOpacity.value = withDelay(100, withSpring(1));
    subtitleTranslateY.value = withDelay(100, withSpring(0));
    formOpacity.value = withDelay(200, withSpring(1));
    formTranslateY.value = withDelay(200, withSpring(0));
    miniLogoOpacity.value = withDelay(750, withSpring(1));
    miniLogoScale.value = withDelay(750, withSpring(1));
  }, []);

  useEffect(() => {

    if (step === 2) {
      emailSubtitleOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      emailSubtitleTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      emailInputOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      emailInputTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
      emailButtonOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      emailButtonTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    } else if (step === 3) {
      dobSubtitleOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      dobSubtitleTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      dobInputOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      dobInputTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
      dobButtonOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      dobButtonTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    } else if (step === 4) {
      passwordSubtitleOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      passwordSubtitleTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      passwordInputOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      passwordInputTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
      confirmPasswordInputOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      confirmPasswordInputTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
      passwordButtonOpacity.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
      passwordButtonTranslateY.value = withDelay(600, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    }
  }, [step]);

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

  const animatedEmailSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: emailSubtitleOpacity.value,
      transform: [{ translateY: emailSubtitleTranslateY.value }],
    };
  });

  const animatedEmailInputStyle = useAnimatedStyle(() => {
    return {
      opacity: emailInputOpacity.value,
      transform: [{ translateY: emailInputTranslateY.value }],
    };
  });

  const animatedEmailButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: emailButtonOpacity.value,
      transform: [{ translateY: emailButtonTranslateY.value }],
    };
  });

  const animatedDobSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: dobSubtitleOpacity.value,
      transform: [{ translateY: dobSubtitleTranslateY.value }],
    };
  });

  const animatedDobInputStyle = useAnimatedStyle(() => {
    return {
      opacity: dobInputOpacity.value,
      transform: [{ translateY: dobInputTranslateY.value }],
    };
  });

  const animatedDobButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: dobButtonOpacity.value,
      transform: [{ translateY: dobButtonTranslateY.value }],
    };
  });

  const animatedPasswordSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: passwordSubtitleOpacity.value,
      transform: [{ translateY: passwordSubtitleTranslateY.value }],
    };
  });

  const animatedPasswordInputStyle = useAnimatedStyle(() => {
    return {
      opacity: passwordInputOpacity.value,
      transform: [{ translateY: passwordInputTranslateY.value }],
    };
  });

  const animatedConfirmPasswordInputStyle = useAnimatedStyle(() => {
    return {
      opacity: confirmPasswordInputOpacity.value,
      transform: [{ translateY: confirmPasswordInputTranslateY.value }],
    };
  });

  const animatedPasswordButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: passwordButtonOpacity.value,
      transform: [{ translateY: passwordButtonTranslateY.value }],
    };
  });

  const animatedMiniLogoStyle = useAnimatedStyle(() => ({
    opacity: miniLogoOpacity.value,
    transform: [{ scale: miniLogoScale.value }],
  }));

  // Function to handle the sign-up process
  const handleSignUp = async () => {
    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const displayName = `${firstName} ${lastName}`;
      await updateProfile(user, {
        displayName: displayName
      });

      const db = getFirestore(app);
      
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0], // Store as YYYY-MM-DD
        displayName: displayName,
        uid: user.uid
      });

      setSuccessMessage("Sign up successful!");
      // Navigate to the next screen or perform any other action after successful sign up
      router.push("/login-signup"); // Adjust this based on your app's navigation structure
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage("This email is already registered. Please use a different email or try logging in.");
      } else {
        setErrorMessage("An error occurred during sign up. Please try again.");
      }
      console.error("Sign up error:", error);
    }
  };

  // Function to clear error message when user re-enters form
  const clearErrorMessage = () => {
    setErrorMessage("");
  };

  // Function to handle next step
  const handleNextStep = () => {
    if (step === 1) {
      if (firstName && lastName) {
        setStep(2);
      } else {
        setErrorMessage("Please enter both first and last name.");
      }
    } else if (step === 2) {
      if (email) {
        setStep(3);
      } else {
        setErrorMessage("Please enter your email.");
      }
    } else if (step === 3) {
      if (dateOfBirth) {
        setStep(4);
      } else {
        setErrorMessage("Please enter your date of birth.");
      }
    } else if (step === 4) {
      if (password && confirmPassword) {
        if (password === confirmPassword) {
          Keyboard.dismiss();
          handleSignUp();
        } else {
          setErrorMessage("Passwords do not match.");
        }
      } else {
        setErrorMessage("Please enter and confirm your password.");
      }
    }
  };

  // UI component
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.push("/login-signup")}>
            <Text style={styles.backButtonText}>back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            {step === 1 && (
              <>
                <Animated.Text style={[styles.title, animatedTitleStyle]}>HabiBeats</Animated.Text>
                <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>what's your name ?</Animated.Text>
                <Animated.View style={[styles.formContainer, animatedFormStyle]}>
                  {/* First Name input */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={firstName} 
                      onChangeText={(text) => { setFirstName(text); clearErrorMessage(); }} 
                      placeholder="first name"
                    />
                  </View>
                  {/* Last Name input */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={lastName} 
                      onChangeText={(text) => { setLastName(text); clearErrorMessage(); }} 
                      placeholder="last name"
                    />
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.buttonText}>
                      continue
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
            {step === 2 && (
              <>
                <Animated.Text style={[styles.title, animatedTitleStyle]}>HabiBeats</Animated.Text>
                <Animated.Text style={[styles.subtitle, animatedEmailSubtitleStyle]}>what's your email ?</Animated.Text>
                <Animated.View style={[styles.formContainer, animatedFormStyle]}>
                  {/* Email input */}
                  <Animated.View style={[styles.inputContainer, animatedEmailInputStyle]}>
                    <CustomTextInput 
                      value={email} 
                      onChangeText={(text) => { setEmail(text); clearErrorMessage(); }} 
                      placeholder="email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </Animated.View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <Animated.View style={animatedEmailButtonStyle}>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.buttonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </>
            )}
            {step === 3 && (
              <>
                <Animated.Text style={[styles.title, animatedTitleStyle]}>HabiBeats</Animated.Text>
                <Animated.Text style={[styles.subtitle, animatedDobSubtitleStyle]}>what's your date of birth ?</Animated.Text>
                <Animated.View style={[styles.formContainer, animatedFormStyle]}>
                  {/* Date of Birth input */}
                  <Animated.View style={[styles.inputContainer, animatedDobInputStyle]}>
                    <DateTimePicker
                      value={dateOfBirth}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || dateOfBirth;
                        setDateOfBirth(currentDate);
                        clearErrorMessage();
                      }}
                    />
                  </Animated.View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <Animated.View style={animatedDobButtonStyle}>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.buttonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </>
            )}
            {step === 4 && (
              <>
                <Animated.Text style={[styles.title, animatedTitleStyle]}>HabiBeats</Animated.Text>
                <Animated.Text style={[styles.subtitle, animatedPasswordSubtitleStyle]}>Password Setup</Animated.Text>
                <Animated.View style={[styles.formContainer, animatedFormStyle]}>
                  {/* Password input */}
                  <Animated.View style={[styles.inputContainer, animatedPasswordInputStyle]}>
                    <CustomTextInput 
                      value={password} 
                      onChangeText={(text) => { setPassword(text); clearErrorMessage(); }} 
                      placeholder="new password"
                      secureTextEntry={true}
                    />
                  </Animated.View>
                  {/* Confirm Password input */}
                  <Animated.View style={[styles.inputContainer, animatedPasswordInputStyle]}>
                    <CustomTextInput 
                      value={confirmPassword} 
                      onChangeText={(text) => { setConfirmPassword(text); clearErrorMessage(); }} 
                      placeholder="re-enter new password"
                      secureTextEntry={true}
                    />
                  </Animated.View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <Animated.View style={animatedPasswordButtonStyle}>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.buttonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </>
            )}
          </View>
          <Animated.Image 
            source={require('../assets/images/transparent_mini_logo.png')} 
            style={[styles.miniLogo, animatedMiniLogoStyle]}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

// Updated styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
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
  content: {
    flex: 1,
    paddingHorizontal: 65,
    paddingTop: 120,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#fc6c85',
    textAlign: 'center',
    width: '100%',  // Ensure the text takes full width of its container
  },
  subtitle: {
    fontSize: 15,
    color: '#0e1514',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 10,
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
  button: {
    backgroundColor: 'rgba(121, 206, 84, 1)',
    paddingVertical: 12,
    paddingHorizontal: 3,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: 'red',
    fontSize: 10,
    marginTop: -5,
    marginBottom: 5,
    textAlign: 'left',
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  miniLogo: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    width: 80,
    height: 80,
  },
  workInProgress: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  }
});