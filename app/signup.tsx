// signup.tsx
// Reyna Aguirre, Jesus Donate, Maxwell Guillermo, and Mariann Grace Dizon

import React, { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { getAuth, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { app } from "../firebaseConfig.js";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Font from 'expo-font'; // Sora SemiBold Font
import { Checkbox } from 'react-native-paper'; // Import Checkbox for Profile Visibility
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated'; // Animation Library

// Loading Sora SemiBold Font
async function loadFonts() {
  await Font.loadAsync({
    'Sora-SemiBold': require('../assets/fonts/Sora-SemiBold.ttf'),
  });
}

// START Custom TextInput component
// START of Maxwell Guillermo Contribution
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
// END Custom TextInput component
// END of Maxwell Guillermo Contribution

// START of Sign Up Process
// START of Reyna Aguirre Contribution 
export default function SignUp() {
  
  // START of Sora SemiBold Font Loading
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadFonts().then(() => {
      if (isMounted) {
        setFontsLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  // END of Sora SemiBold Font Loading

  // State variables to Store User Input
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
  const [age, setAge] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [lastNameVisible, setLastNameVisible] = useState<boolean>(true); // Last Name Visibility Variable
  const [gender, setGender] = useState<string>(""); 
  const [genderPreference, setGenderPreference] = useState<string>(""); // Gender Preference Variable
  const [pronouns, setPronouns] = useState<string[]>([]);
  const [pronounVisible, setPronounVisible] = useState<boolean>(true); // Pronoun Visibility Variable
  const [matchIntention, setMatchIntention] = useState<string>(""); // Match Intention Variable [Friends, Dating, Both]
  const [musicPreference, setMusicPreference] = useState<string[]>([]); // Music Preference Variable [Pop, Rock, Hip-Hop, R&B, Country, Electronic, Jazz, Classical, Latin, Other]
  const [agePreference, setAgePreference] = useState<number>(0); // Age Preference Variable
  const router = useRouter();

  // State variables to Store User Input for Animation 
  const landingSubtitleOpacity = useSharedValue(0);
  const landingSubtitleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);

  useEffect(() => {


    landingSubtitleOpacity.value = withDelay(150, withSpring(1));
    landingSubtitleTranslateY.value = withDelay(150, withSpring(0));
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));

    if (step === 10) {
      const timer = setTimeout(() => {
        router.push("/login-signup");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  // START of Animated Styles
  // START of Reyna Aguirre Contribution
  const animatedLandingSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: landingSubtitleOpacity.value,
      transform: [{ translateY: landingSubtitleTranslateY.value }],
    };
  });

  const animatedSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateY.value }],
    };
  });



  // END of Sign Up Process

  // END of Reyna Aguirre Contribution 

  // START of Firebase Storing of User Data
  // START of Jesus Donate Contribution 
  const handleSignUp = useCallback(async () => {
    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const displayName = lastNameVisible ? `${firstName} ${lastName}` : firstName; // Checks for Last Name Visibility Boolean
      await updateProfile(user, {
        displayName: displayName
      });

      const db = getFirestore(app);
      
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0], // Store as YYYY-MM-DD
        age: age,
        displayName: displayName,
        lastNameVisible: lastNameVisible,
        pronounsVisible: pronounVisible,
        gender: gender, 
        genderPreference: genderPreference,
        agePreference: { min: 21, max: 80 }, // automatically set age preference
        pronouns: pronouns,
        musicPreference: musicPreference,
        matchIntention: matchIntention,
        uid: user.uid
      });

      // Firebase Error Handling
      setSuccessMessage("Sign up successful!");
      
      // Update the database
      await updateUserProfile(user.uid);
      
      router.push("/login-signup"); 
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage("This email is already registered. Please use a different email or try logging in.");
      } else {
        setErrorMessage("An error occurred during sign up. Please try again.");
      }
      console.error("Sign up error:", error);
    }
  }, [firstName, lastName, email, password, dateOfBirth, age, lastNameVisible, gender, pronouns, matchIntention, musicPreference, router]);

  // Function to update user profile in the database
  const updateUserProfile = async (userId: string) => {
    const db = getFirestore(app);
    const userRef = doc(db, "users", userId);
    
    try {
      await setDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        email: email,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        age: age,
        displayName: lastNameVisible ? `${firstName} ${lastName}` : firstName,
        lastNameVisible: lastNameVisible,
        pronounsVisible: pronounVisible,
        gender: gender,
        genderPreference: genderPreference,
        agePreference: { min: 21, max: 80 }, // automatically set age preference
        pronouns: pronouns,
        musicPreference: musicPreference,
        matchIntention: matchIntention,
        uid: userId
      }, { merge: true });
      
      console.log("User profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      setErrorMessage("Failed to update user profile. Please try again.");
    }
  };
  // END of Firebase Storing of User Data
  // END of Jesus Donate Contribution 

  // START Function to clear error message when user re-enters form
  // START of Mariann Grace Dizon Contribution
  const clearErrorMessage = useCallback(() => {
    setErrorMessage("");
  }, []);

  // Function to handle next step
  const handleNextStep = useCallback(async () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
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
          setStep(5);
        } else {
          setErrorMessage("Passwords do not match.");
        }
      } else {
        setErrorMessage("Please enter and confirm your password.");
      }
    }
    else if (step === 5) {
      setStep(6);
    }
    else if (step === 6) {
      if (gender) {
        setStep(7);
      } else {
        setErrorMessage("Please select your gender.");
      }
    }
    else if (step === 7) {
      if (pronouns.length > 0) {
        setStep(8);
      } else {
        setErrorMessage("Please select at least one pronoun.");
      }
    }
    else if (step === 8) {
      if (matchIntention) {
        setStep(9);
      } else {
        setErrorMessage("Please select your match intention.");
      }
    }
    else if (step === 9) {
      if (genderPreference) {
        setStep(10);
      } else {
        setErrorMessage("Please select your gender preference.");
      }
    }
    else if (step === 10) {
      if (musicPreference.length > 0) {
        // Instead of just setting the step to 11, call handleSignUp
        await handleSignUp();
        setStep(11);
      } else {
        setErrorMessage("Please select your music preference.");
      }
    }
  }, [step, firstName, lastName, email, dateOfBirth, password, confirmPassword, gender, pronouns, matchIntention, genderPreference, musicPreference, handleSignUp]);
  // END of Mariann Grace Dizon Contribution

  // START of UI Render
  // Reyna Aguirre and Maxwell Guillermo
  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          {/* START Back Button: Reyna Aguirre 09/18/2024 */}
          <TouchableOpacity style={styles.backButton} onPress={() => {
            Alert.alert(
              "Exit Profile Setup",
              "\nAre you sure you want to exit the profile setup process?\n\nChanges will be unsaved.",
              [
                {
                  text: "Yes", 
                  onPress: () => router.push("/login-signup")
                },
                { 
                  text: "Cancel", 
                  style: "cancel"
                }
              ]
            );
          }}>
            <Text style={styles.backButtonText}>back</Text>
          </TouchableOpacity>
          {/* END Back Button: Reyna Aguirre 09/18/2024 */}

          <View style={styles.content}>
            {/* START of Profile Landing Page */}
            {step === 0 && (
              <>
                <Animated.Text style={[styles.landingsubtitle, animatedLandingSubtitleStyle]}>Let's get started with creating your unique music profile.</Animated.Text>
                <Image 
                  source={require('../assets/images/Profile_Landing_Graphic.png')}
                  style={styles.landingImage}
                  resizeMode="contain"
                />
                <View style={styles.formContainer}>
                  <TouchableOpacity 
                    style={styles.landingbutton}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.buttonText}>
                      enter info
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {/* END of Profile Landing Page */}
            {step === 1 && (
              <>
                <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>What's your name?</Animated.Text>
                <View style={styles.formContainer}>
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
                </View>
                {/* Checkbox for last name visibility */}
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setLastNameVisible(!lastNameVisible)}
                  >
                    <Checkbox
                      status={lastNameVisible ? 'checked' : 'unchecked'}
                      onPress={() => setLastNameVisible(!lastNameVisible)}
                      color="#fba904"
                    />
                    {lastNameVisible && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>last name visible on profile</Text>
                </View>
              </>
            )}
            {step === 2 && (
              <>
                <Text style={styles.subtitle}>What's your email?</Text>
                <Text style={styles.subtitleDescription}>your email is required for account recovery and security purposes.</Text>
                <View style={styles.formContainer}>
                  {/* Email input */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={email} 
                      onChangeText={(text) => setEmail(text)} 
                      placeholder="email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.buttonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            {step === 3 && (
              <>
                <Text style={styles.subtitle}>What's your birthday?</Text>
                <View style={styles.formContainer}>
                  {/* Date of Birth input */}
                  <View style={styles.inputContainer}>
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
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={() => {
                        // Calculate Age
                        const today = new Date();
                        let calculatedAge = today.getFullYear() - dateOfBirth.getFullYear();
                        const m = today.getMonth() - dateOfBirth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
                          calculatedAge--;
                        }
                        setAge(calculatedAge); // save age to firestor
                        
                        // Show Pop-Up to Confirm Age
                        Alert.alert(
                          `Confirm you're ${calculatedAge}.`,
                          `\nIs this correct?`,
                          [
                            {
                              text: "No",
                              onPress: () => console.log("Age is incorrect"),
                              style: "cancel"
                            },
                            { 
                              text: "Yes", 
                              onPress: () => {
                                setStep(4);
                                handleNextStep();
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.buttonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            {step === 4 && (
              <>
                <Text style={styles.subtitle}>Password Setup</Text>
                <View style={styles.formContainer}>
                  {/* Password input */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={password} 
                      onChangeText={(text) => { setPassword(text); clearErrorMessage(); }} 
                      placeholder="enter password"
                      secureTextEntry={true}
                    />
                  </View>
                  {/* Confirm Password input */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={confirmPassword} 
                      onChangeText={(text) => { setConfirmPassword(text); clearErrorMessage(); }} 
                      placeholder="re-enter new password"
                      secureTextEntry={true}
                    />
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.buttonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            {step === 5 && (
              <>
               <Animated.Text style={[styles.landingsubtitle, animatedLandingSubtitleStyle]}>Now, let's add more info to refine your music connections.</Animated.Text>
              <Image 
                source={require('../assets/images/Profile_Information_Graphic.png')}
                style={styles.landingProfileImage}
                resizeMode="contain"
              />
              <View style={styles.formContainer}>
                <TouchableOpacity 
                  style={styles.landingProfileButton}
                  onPress={handleNextStep}
                >
                  <Text style={styles.profileButtonText}>
                    enter profile info
                  </Text>
                </TouchableOpacity>
              </View>
            </>
            )}
            {step === 6 && (
              <>
                <Text style={styles.subtitle}>What gender best describes you?</Text>
                <View style={styles.formContainer}>
                  {/* Gender selection buttons */}
                  <View style={styles.genderButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'Male' && styles.selectedGenderButton]}
                      onPress={() => setGender('Male')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'Male' && styles.selectedGenderButtonText]}>male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'Female' && styles.selectedGenderButton]}
                      onPress={() => setGender('Female')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'Female' && styles.selectedGenderButtonText]}>female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'Other' && styles.selectedGenderButton]}
                      onPress={() => setGender('Other')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'Other' && styles.selectedGenderButtonText]}>other</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.profileButton}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.profileButtonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            {step === 7 && (
              <>
                <Text style={styles.subtitle}>What are your pronouns?</Text>
                <Text style={styles.subtitleDescription}>select up to (2) pronouns that apply.</Text>
                <View style={styles.formContainer}>
                  {/* Pronoun selection checkboxes */}
                  <View style={styles.pronounCheckboxContainer}>
                    {['she', 'her', 'he', 'him', 'they', 'them'].map((pronoun) => (
                      <TouchableOpacity 
                        key={pronoun}
                        style={styles.pronounCheckbox}
                        onPress={() => {
                          if (pronouns.includes(pronoun)) {
                            setPronouns(pronouns.filter(p => p !== pronoun));
                          } else if (pronouns.length < 2) {
                            setPronouns([...pronouns, pronoun]);
                          }
                        }}
                      >
                        <View style={[styles.checkboxWrapper, pronouns.includes(pronoun) && styles.checkedCheckboxWrapper]}>
                          {pronouns.includes(pronoun) && (
                            <Text style={styles.checkmarkPronoun}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.pronounCheckboxLabel}>{pronoun}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.profileButton}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.profileButtonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Checkbox for pronoun visibility */}
                <View style={styles.checkboxContainerP}>
                  <TouchableOpacity 
                    style={styles.checkboxP}
                    onPress={() => setPronounVisible(!pronounVisible)}
                  >
                    <View style={[styles.checkboxWrapper, pronounVisible && styles.checkedCheckboxWrapper]}>
                      {pronounVisible && (
                        <Text style={styles.checkmarkPronoun}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabelP}>pronouns visible on profile</Text>
                </View>
              </>
            )}
            {step === 8 && (
              <>
              <Text style={styles.subtitle}>What are your intentions for connecting?</Text>
              <Text style={styles.subtitleDescription}>select (1) that applies to you.</Text>
              <View style={styles.formContainer}>
                  {/* Intention selection buttons */}
                  {/* Re-used Gender Buttons for Styling of Intention Buttons */}
                  <View style={styles.intentionButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.genderButton, matchIntention === 'Friends' && styles.selectedGenderButton]}
                      onPress={() => setMatchIntention('Friends')}
                    >
                      <Text style={[styles.genderButtonText, matchIntention === 'Friends' && styles.selectedGenderButtonText]}>friends</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, matchIntention === 'Flirting' && styles.selectedGenderButton]}
                      onPress={() => setMatchIntention('Flirting')}
                    >
                      <Text style={[styles.genderButtonText, matchIntention === 'Flirting' && styles.selectedGenderButtonText]}>flirting</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, matchIntention === 'Both' && styles.selectedGenderButton]}
                      onPress={() => setMatchIntention('Both')}
                    >
                      <Text style={[styles.genderButtonText, matchIntention === 'Both' && styles.selectedGenderButtonText]}>both</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.profileButton}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.profileButtonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )} 
            {step === 9 && (
              <>
                <Text style={styles.subtitle}>What gender are you looking for?</Text>
                <Text style={styles.subtitleDescription}>select (1) that applies to you.</Text>
                <View style={styles.formContainer}>
                  {/* Gender selection buttons */}
                  <View style={styles.genderButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.genderButton, genderPreference === 'Male' && styles.selectedGenderButton]}
                      onPress={() => setGenderPreference('Male')}
                    >
                      <Text style={[styles.genderButtonText, genderPreference === 'Male' && styles.selectedGenderButtonText]}>male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, genderPreference === 'Female' && styles.selectedGenderButton]}
                      onPress={() => setGenderPreference('Female')}
                    >
                      <Text style={[styles.genderButtonText, genderPreference === 'Female' && styles.selectedGenderButtonText]}>female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, genderPreference === 'Other' && styles.selectedGenderButton]}
                      onPress={() => setGenderPreference('Other')}
                    >
                      <Text style={[styles.genderButtonText, genderPreference === 'Other' && styles.selectedGenderButtonText]}>other</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Error message */}
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {/* Next button */}
                  <View>
                    <TouchableOpacity 
                      style={styles.profileButton}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.profileButtonText}>
                        continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            {step === 10 && (
              <>
                <Text style={styles.subtitle}>What are your favorite music genre(s)?</Text>
                <Text style={styles.subtitleDescription}>select all that apply.</Text>
                <View style={styles.genreContainer}>
                  {['EDM', 'Hip Hop', 'Pop', 'Country', 'Jazz', 'R&B', 'Indie', 'Rock', 'Techno', 'Latin', 'Soul', 'Classical', 'J-Pop', 'K-Pop', 'Metal','Reggae'].map((genre) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreButton,
                        musicPreference.includes(genre) && styles.selectedGenreButton
                      ]}
                      onPress={() => {
                        setMusicPreference((prev) =>
                          prev.includes(genre)
                            ? prev.filter((item) => item !== genre)
                            : [...prev, genre]
                        );
                      }}
                    >
                      <Text style={[
                        styles.genreButtonText,
                        musicPreference.includes(genre) && styles.selectedGenreButtonText
                      ]}>
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <View>
                  <TouchableOpacity 
                    style={styles.profileButton}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.profileButtonText}>
                      finish profile setup
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 11 && (
              <>
                <Text style={styles.landingsubtitle}>Profile Set Up Complete!</Text>
                <Text style={styles.subtitleDescription}>now routing you to login..</Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
// END of UI Render


// START of Style Code
// Reyna Aguirre and Maxwell Guillermo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  backButton: {
    position: 'absolute',
    top: 60,
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
    paddingHorizontal: 20,
    paddingTop: 100, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
  },
  landingsubtitle: {
    fontSize: 25,
    color: '#0e1514',
    textAlign: 'left',
    marginBottom: 40, 
    paddingTop: 80,
    fontFamily: 'Sora-SemiBold', // New Sora Font
    lineHeight: 35, // Line Spacing
  },
  subtitle: {
    fontSize: 20,
    color: '#0e1514',
    textAlign: 'left',
    marginBottom: 20, // Reduced margin to move content up
    paddingTop: 20,
    fontFamily: 'Sora-SemiBold', // New Sora Font
    lineHeight: 30, // Line Spacing
  },
  subtitleDescription: {
    fontSize: 13,
    fontWeight: '600',
    paddingLeft: 20,
    paddingRight: 20,
    color: '#0e1514',
    textAlign: 'left',
    marginBottom: 30,
  },

  formContainer: {
    width: '100%',
    marginTop: 20, 
  },
  inputContainer: {
    marginBottom: 15, 
    marginLeft: 20,
    marginRight: 20,
  },
  input: {
    width: "100%",
    height: 50, 
    borderWidth: 0,
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    color: '#808080',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  smallerText: {
    fontSize: 12,
  },
  landingbutton: {
    backgroundColor: '#fba904',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 30,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  landingProfileButton: {
    backgroundColor: 'rgba(55,189,213,0.8)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 30,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fba904',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginTop: 5,
    marginBottom: 30,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  profileButton: {
    backgroundColor: 'rgba(55,189,213,0.8)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginTop: 5,
    marginBottom: 30,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  profileButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 5,
    textAlign: 'left',
    paddingHorizontal: 30,
    paddingVertical:5,
    borderRadius: 5,
  },
  workInProgress: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  landingImage: {
    alignItems: 'center',
    width: 215,
    height: 215,
    marginTop: 70, // Added margin to bring image closer to button
    marginBottom:-75, 
  },
  landingProfileImage: {
    alignItems: 'center',
    width: '100%',
    height: 220,
    marginTop: 70, // Added margin to bring image closer to button
    marginBottom: -10, 
  },
  checkboxContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 13,
    color: '#fba904',
    fontWeight: "700",
    paddingLeft: 5,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 3,
    borderRadius: 5,
    borderColor: '#fba904',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmark: {
    color: '#fba904',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: -20, // uniwue to the last name checkbox

  },
  checkboxContainerP: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    
  },
  checkboxLabelP: {
    marginLeft: 8,
    fontSize: 13,
    color: '#37bdd5',
    fontWeight: "700",
    paddingLeft: 5,
  },
  checkboxP: {
    width: 25,
    height: 25,
    borderWidth: 3,
    borderRadius: 5,
    borderColor: '#37bdd5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    
  },
  checkmarkPronoun: {
    color: '#37bdd5',
    fontSize: 15,
    fontWeight: 'bold',
  },
  checkboxWrapper: {
    width: 25,
    height: 25,
    borderWidth: 3,
    borderColor: '#37bdd5',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckboxWrapper: {
    backgroundColor: '#fff8f0',
  },
  genderButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  genderButton: {
    backgroundColor: 'rgba(55,189,213,0.2)',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    
  },
  selectedGenderButton: {
    backgroundColor: '#fba904',
  },
  genderButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedGenderButtonText: {
    color: '#FFFFFF',
  },
  pronounCheckboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  pronounCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    marginBottom: 10,
  },
  pronounCheckboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1514',
    paddingLeft: 5,
  },
  intentionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  genreButton: {
    backgroundColor: 'rgba(55,189,213,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  selectedGenreButton: {
    backgroundColor: '#fba904',
  },
  genreButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedGenreButtonText: {
    color: '#FFFFFF',
  },
});
// END of Style Code