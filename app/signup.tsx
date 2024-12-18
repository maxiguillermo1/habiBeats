// signup.tsx
// Main signup flow component for user registration
// Authors: Reyna Aguirre

// Import required dependencies
import React, { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from "react-native";
import { getAuth, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { app } from "../firebaseConfig.js";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Font from 'expo-font';
import { Checkbox } from 'react-native-paper';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants'; 
import MapView, { Marker, Region } from 'react-native-maps';
import 'react-native-get-random-values';
import TermsOfService from './legal-pages/terms-of-service';
import PrivacyPolicy from './legal-pages/privacy-policy';

// Load custom fonts
async function loadFonts() {
  await Font.loadAsync({
    'Sora-SemiBold': require('../assets/fonts/Sora-SemiBold.ttf'),
  });
}

// Custom TextInput component with consistent styling
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

// Main SignUp component
export default function SignUp() {
  
  // State for font loading
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load fonts on component mount
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

  // User information states
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
  const [lastNameVisible, setLastNameVisible] = useState<boolean>(true); 
  const [gender, setGender] = useState<string>(""); 
  const [genderPreference, setGenderPreference] = useState<string>("");
  const [pronouns, setPronouns] = useState<string[]>([]);
  const [pronounVisible, setPronounVisible] = useState<boolean>(true);
  const [matchIntention, setMatchIntention] = useState<string>("");
  const [musicPreference, setMusicPreference] = useState<string[]>([]);
  const [agePreference, setAgePreference] = useState<number>(0);
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);

  // Location related states
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [locationSelected, setLocationSelected] = useState(false);
  const [displayLocation, setDisplayLocation] = useState<string>('');
  const [locationVisible, setLocationVisible] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Animation values for transitions
  const landingSubtitleOpacity = useSharedValue(0);
  const landingSubtitleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);

  // Request location permissions and set initial region
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Initialize animations on step change
  useEffect(() => {
    landingSubtitleOpacity.value = withDelay(150, withSpring(1));
    landingSubtitleTranslateY.value = withDelay(150, withSpring(0));
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));
  }, [step, router]);

  // Animation styles
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

  // Handle user signup process
  const handleSignUp = async () => {
    try {
      console.log("Starting sign up process...");
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created:", user);

      const displayName = lastNameVisible ? `${firstName} ${lastName}` : firstName;
      setDisplayLocation(`${locationVisible ? selectedLocation?.name : 'N/A'}`);
      console.log("Display name:", displayName);
      await updateProfile(user, {
        displayName: displayName
      });

      const db = getFirestore(app);
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        age: age,
        displayName: displayName,
        lastNameVisible: lastNameVisible,
        pronounsVisible: pronounVisible,
        gender: gender, 
        genderPreference: genderPreference,
        agePreference: { min: 21, max: 80 },
        pronouns: pronouns,
        musicPreference: musicPreference,
        matchIntention: matchIntention,
        location: selectedLocation?.name,
        displayLocation: `${locationVisible ? selectedLocation?.name : 'N/A'}`,
        locationVisible: locationVisible,
        uid: user.uid
      });
      console.log("User document created successfully");

      setSuccessMessage("Sign up successful!");
      
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
  };

  // Update user profile in Firestore
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
        locationVisible: locationVisible,
        gender: gender,
        genderPreference: genderPreference,
        agePreference: { min: 21, max: 80 },
        pronouns: pronouns,
        musicPreference: musicPreference,
        matchIntention: matchIntention, 
        location: selectedLocation?.name,
        displayLocation: `${locationVisible ? selectedLocation?.name : 'N/A'}`,
        uid: userId
      }, { merge: true });
      
      console.log("User profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      setErrorMessage("Failed to update user profile. Please try again.");
    }
  };

  // Reverse geocode coordinates to get location name
  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAa8GhuQxxebW8Dw-2xMyFGnBA3R5IZHOc`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        console.log(addressComponents);
        const cityComponent = addressComponents.find(
          (component: any) => component.types.includes('locality') || component.types.includes('administrative_area_level_3')
        );
        const stateComponent = addressComponents.find(
          (component: any) => component.types.includes('administrative_area_level_1')
        );
        if (cityComponent && stateComponent) {
          setCurrentLocationName(`${cityComponent.long_name}, ${stateComponent.short_name}`);
          setLocationSelected(true);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }, []);
  
  // Handle location confirmation
  const handleConfirmLocation = () => {
    if (currentLocationName) {
      setSelectedLocation({
        latitude: region.latitude,
        longitude: region.longitude,
        name: currentLocationName
      });
      setLocationSelected(true);
    }
  };

  // Handle map region changes
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    if (newRegion.latitude !== region.latitude && newRegion.longitude !== region.longitude) {
      reverseGeocode(newRegion.latitude, newRegion.longitude);
    }
  };

  // Handle final signup step
  const handleFinishSignUp = () => {
    console.log("Finishing sign up...");
    handleSignUp();
  };

  // Clear error message
  const clearErrorMessage = () => {
    setErrorMessage("");
  };

  // Handle progression through signup steps
  const handleNextStep = async () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (firstName && lastName) {
        console.log("firstName:", firstName);
        console.log("lastName:", lastName);
        setStep(2);
      } else {
        setErrorMessage("Please enter both first and last name.");
      }
    } else if (step === 2) {
      if (email) {
        try {
          const auth = getAuth(app);
          await createUserWithEmailAndPassword(auth, email, 'temporaryPassword');
          if (auth.currentUser) {
            await auth.currentUser.delete();
          }
          console.log("email:", email);
          setStep(3);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            setErrorMessage("This email is already registered. Please use a different email or try logging in.");
          } else {
            console.error("Error checking email:", error);
            setErrorMessage("An error occurred. Please try again.");
          }
        }
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
        console.log("gender:", gender);
        setStep(7);
      } else {
        setErrorMessage("Please select your gender.");
      }
    }
    else if (step === 7) {
      if (pronouns.length > 0) {
        console.log("pronouns:", pronouns);
        setStep(8);
      } else {
        setErrorMessage("Please select at least one pronoun.");
      }
    }
    else if (step === 8) {
      if (matchIntention) {
        console.log("matchIntention:", matchIntention);
        setStep(9);
      } else {
        setErrorMessage("Please select your match intention.");
      }
    }
    else if (step === 9) {
      if (genderPreference) {
        console.log("genderPreference:", genderPreference);
        setStep(10);
      } else {
        setErrorMessage("Please select your gender preference.");
      }
    }
    else if (step === 10) {
      console.log("musicPreference:", musicPreference);
      if (musicPreference.length > 0) {
        setStep(11);
      } else {
        setErrorMessage("Please select your music preference.");
      }
    }
    else if (step === 11) {
      console.log("selectedLocation:", selectedLocation);
      if (selectedLocation) {
        setStep(12);
      } else {
        setErrorMessage("Please confirm a location before proceeding.");
      }
    }
    else if (step === 12) {
      if (termsAccepted) {
        setStep(13);
      } else {
        setErrorMessage("Please accept the Terms of Service to continue.");
      }
    }
    else if (step === 13) {
      if (privacyAccepted) {
        console.log("Signing up user...");
        handleFinishSignUp();
      } else {
        setErrorMessage("Please accept the Privacy Policy to continue.");
      }
    }
  };

  // Wait for fonts to load before rendering
  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
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

          <View style={styles.content}>
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
            {step === 1 && (
              <>
                <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>What's your name?</Animated.Text>
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={firstName} 
                      onChangeText={(text) => { setFirstName(text); clearErrorMessage(); }} 
                      placeholder="first name"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={lastName} 
                      onChangeText={(text) => { setLastName(text); clearErrorMessage(); }} 
                      placeholder="last name"
                    />
                  </View>
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.buttonText}>
                      continue
                    </Text>
                  </TouchableOpacity>
                </View>
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
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={email} 
                      onChangeText={(text) => setEmail(text)} 
                      placeholder="email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
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
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  <View>
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={() => {
                        const today = new Date();
                        let calculatedAge = today.getFullYear() - dateOfBirth.getFullYear();
                        const m = today.getMonth() - dateOfBirth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
                          calculatedAge--;
                        }
                        setAge(calculatedAge);
                        
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
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={password} 
                      onChangeText={(text) => { setPassword(text); clearErrorMessage(); }} 
                      placeholder="enter password"
                      secureTextEntry={true}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <CustomTextInput 
                      value={confirmPassword} 
                      onChangeText={(text) => { setConfirmPassword(text); clearErrorMessage(); }} 
                      placeholder="re-enter new password"
                      secureTextEntry={true}
                    />
                  </View>
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  
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
                      continue
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 11 && (
              <>
                {/* Location Input */}
                <Text style={styles.subtitle}>Where are you located?</Text>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={region}
                    onRegionChangeComplete={handleRegionChange}
                  >
                    <Marker coordinate={region} />
                  </MapView>
                  {/* Displays the current location name */}
                  {currentLocationName && (
                    <View style={styles.locationNameContainer}>
                      <Text style={styles.locationNameText}>{currentLocationName}</Text>
                    </View>
                  )}
                  {/* Confirm Location Button */}
                  <TouchableOpacity style={styles.confirmLocationButton} onPress={handleConfirmLocation}>
                    <Text style={styles.confirmLocationButtonText}>Confirm Location</Text>
                  </TouchableOpacity>
                </View>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                {locationSelected && (
                  <>
                    {/* Displays confirmed location */}
                    <Text>My Location: {currentLocationName}</Text>
                    <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                      <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                  </>
                )}
                {/* Checkbox for last name visibility */}
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setLocationVisible(!locationVisible)}
                  >
                    <Checkbox
                      status={locationVisible ? 'checked' : 'unchecked'}
                      onPress={() => setLocationVisible(!locationVisible)}
                      color="#fba904"
                    />
                    {locationVisible && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>location visible on profile</Text>
                </View>
              </>
            )}
            {step === 12 && (
              <>
                <Text style={styles.subtitle}>Terms of Service</Text>
                <ScrollView style={styles.termsContainer}>
                  <TermsOfService />
                </ScrollView>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    <Checkbox
                      status={termsAccepted ? 'checked' : 'unchecked'}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                      color="#fba904"
                    />
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>I accept the Terms of Service</Text>
                </View>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleNextStep}
                >
                  <Text style={styles.buttonText}>Complete Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
            {step === 13 && (
              <>
                <Text style={styles.subtitle}>Privacy Policy</Text>
                <ScrollView style={styles.termsContainer}>
                  <PrivacyPolicy />
                </ScrollView>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setPrivacyAccepted(!privacyAccepted)}
                  >
                    <Checkbox
                      status={privacyAccepted ? 'checked' : 'unchecked'}
                      onPress={() => setPrivacyAccepted(!privacyAccepted)}
                      color="#fba904"
                    />
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>I accept the Privacy Policy</Text>
                </View>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleNextStep}
                >
                  <Text style={styles.buttonText}>Complete Sign Up</Text>
                </TouchableOpacity>
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
// Reyna Aguirre
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





  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: 300,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  autocompleteInput: {
    fontSize: 16,
  },
  locationNameContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  locationNameText: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  confirmLocationButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#fba904',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  confirmLocationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: 300,
  },
  termsContainer: {
    maxHeight: 400,
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
// END of Style Code