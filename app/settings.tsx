import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, SafeAreaView, Alert, Image, TextInput, Modal, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getAuth, signOut, verifyBeforeUpdateEmail, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, deleteDoc, updateDoc, getDoc, addDoc, collection, Timestamp, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { db, app } from '../firebaseConfig'; // Ensure this path is correct
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; // Ensure this import is correct
import { getFunctions, httpsCallable } from 'firebase/functions';
import PushNotificationsSettings from './settings/push-notifications';
import ChangePassword from './settings/change-password';
import { useRouter } from 'expo-router';
import { getGooglePlacesQueryConfig } from '../api/google-places-api';
import { useTranslation } from 'react-i18next';
import '../i18n';

interface UserMatch {
  uid: string;
  displayName: string;
  profileImageUrl: string;
  matches?: {
    [uid: string]: "liked" | "disliked";
  };
}

const Settings = () => {
  const auth = getAuth();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Existing state variables
  const [lastNameVisible, setLastNameVisible] = useState(true);
  const [locationVisible, setLocationVisible] = useState(true);
  const [myEventsVisible, setMyEventsVisible] = useState(true);

  // New state variables from profilesettings.tsx
  const [profileImage, setProfileImage] = useState<string>('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Location not set');
  const [modalVisible, setModalVisible] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(auth.currentUser?.email || '');

  // New state variables for editing name and location
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempLocation, setTempLocation] = useState(location);
  const googlePlacesRef = useRef<GooglePlacesAutocompleteRef | null>(null);
  const router = useRouter();

  const [userGender, setUserGender] = useState('');
  const [isEditingBorder, setIsEditingBorder] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Add these modal states
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBorderModal, setShowBorderModal] = useState(false);

  // Add these state variables if not already present
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Add local state for theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Add these style variables at the top of your component
  const getThemeColors = (isDark: boolean) => ({
    background: isDark ? '#151718' : '#fff8f0',
    text: isDark ? '#ECEDEE' : '#0e1514',
    subText: isDark ? '#9BA1A6' : '#888',
    divider: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    cardBackground: isDark ? '#1a1d1e' : '#FFFFFF',
    border: isDark ? '#2d3235' : '#E0E0E0',
  });

  // Add this near other state declarations
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserData();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    console.log('userGender state changed:', userGender);
  }, [userGender]);

  const fetchUserData = async () => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsVerified(userData.isVerified || false);
        setName(userData.displayName || `${userData.firstName} ${userData.lastName}`);
        setLocation(userData.displayLocation || 'Location not set');
        setProfileImage(userData.profileImageUrl || '');
        setUserGender(userData.gender || 'other');
        setLastNameVisible(userData.lastNameVisible !== false); // Default to true if not set
        setLocationVisible(userData.locationVisible !== false); // Default to true if not set
        const savedTheme = userData.themePreference || 'light';
        setIsDarkMode(savedTheme === 'dark');
      }
    }
  };

  // START of Fetching Animated Border
  // START of Mariann Grace Dizon Contribution
  const fetchAnimatedBorder = async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.AnimatedBorder) {
            setSelectedGif(userData.AnimatedBorder);
          }
        }
      } catch (error) {
        console.error('Error fetching animated border:', error);
      }
    }
  };

  useEffect(() => {
    fetchAnimatedBorder();
  }, []);
  // END of Fetching Animated Border
  // END of Mariann Grace Dizon Contribution

  // START of Reyna Aguirre Contribution
  const handleLogout = () => {
    Alert.alert(
      t('alerts.logout_title'),
      t('alerts.logout_message'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              // Update isOnline status to false before signing out
              if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                  isOnline: false
                });
              }

              await signOut(auth);
              console.log("User signed out successfully");
              
              router.replace('/login-signup');
            } catch (error) {
              console.error("Error signing out: ", error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            router.replace('/post-delete-survey');
          }
        }
      ]
    );
  };
  // END of Reyna Aguirre Contribution

  // START of Jesus Donate Contribution
  const uploadImageToFirebase = async (uri: string) => {
    try {
      console.log("Starting image upload to Firebase");
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = 'profilePicture_' + auth.currentUser?.uid + '_' + new Date().getTime();
      const storageRef = ref(storage, `profilePictures/${filename}`);
      
      console.log("Uploading blob to Firebase Storage");
      await uploadBytes(storageRef, blob);
      
      console.log("Getting download URL");
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log("Image uploaded successfully, download URL:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image to Firebase:", error);
      throw error;
    }
  };
  // END of Jesus Donate Contribution

  // START of Mariann Grace Dizon
  const handleImagePicker = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Show loading indicator
        Alert.alert('Uploading...', 'Please wait while we update your profile picture.');

        const downloadURL = await uploadImageToFirebase(selectedAsset.uri);
        
        // Update state and Firestore
        setProfileImage(downloadURL);
        
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
            profileImageUrl: downloadURL
          });
          
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error) {
      console.error("Error in handleImagePicker:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  };
  // END of Mariann Grace Dizon


  // START of Maxwell Guillermo Contribution
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  };

  const sendEmailChangeOTP = async (email: string) => {
    const otpCode = generateOTP();
    const timestamp = Timestamp.now();

    try {
      await addDoc(collection(db, "email_change_requests"), {
        email: email,
        otp: otpCode,
        timestamp: timestamp,
        used: false,
        userId: auth.currentUser?.uid
      });

      const functions = getFunctions();
      const sendOTPFunc = httpsCallable(functions, 'sendOTP');
      await sendOTPFunc({ email, otp: otpCode, isEmailChange: true });

      Alert.alert("OTP Sent", `An OTP has been sent to your current email address. Please enter the OTP to verify your email change.`);
      setOtpSent(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChangeEmail = async () => {
    setEmailChangeError('');
    if (!auth.currentUser) return;

    if (!newEmail) {
      setEmailChangeError('Please enter your new email address.');
      return;
    }

    if (!isValidEmail(newEmail)) {
      setEmailChangeError('Please enter a valid email address.');
      return;
    }

    if (!confirmNewEmail) {
      setEmailChangeError('Please confirm your new email address.');
      return;
    }

    if (newEmail !== confirmNewEmail) {
      setEmailChangeError('New email addresses do not match.');
      return;
    }
    
    if (!otpSent) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setEmailChangeError('This email is already in use. Please choose a different email.');
        return;
      }

      await sendEmailChangeOTP(auth.currentUser.email!);
      return;
    }

    if (!otp) {
      setEmailChangeError('Please enter the OTP.');
      return;
    }

    const q = query(collection(db, 'email_change_requests'),
      where('email', '==', auth.currentUser.email),
      where('otp', '==', otp),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      setEmailChangeError('Invalid OTP. Please try again.');
      return;
    }

    const otpDoc = snapshot.docs[0];
    const otpData = otpDoc.data();

    const now = Timestamp.now();
    const expirationTime = 15 * 60 * 1000; // 15 minutes
    if (now.toMillis() - otpData.timestamp.toMillis() > expirationTime) {
      setEmailChangeError('OTP has expired. Please request a new one.');
      return;
    }
    
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);

      await updateDoc(otpDoc.ref, { used: true });

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        pendingEmail: newEmail
      });

      const unsubscribe = auth.onIdTokenChanged(async (user) => {
        if (user?.email === newEmail) {
          await updateDoc(userDocRef, {
            email: newEmail,
            pendingEmail: null
          });
          unsubscribe();
        }
      });      
      Alert.alert(
        'Verification Email Sent',
        'A verification link has been sent to your new email address. Please check your new email and click on the link to complete the email change process.',
        [{ text: 'OK', onPress: () => {
          setIsChangingEmail(false);
          setNewEmail('');
          setConfirmNewEmail('');
          setOtp('');
          setOtpSent(false);
        }}]
      );
    } catch (error) {
      console.error('Error updating email:', error);
      setEmailChangeError('Failed to send verification email. Please try again.');
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "Are you sure you want to change your password?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Change", 
          style: "destructive",
          onPress: () => {
            router.push('/settings/change-password');
          }
        }
      ]
    );
  };

  const handleEditEmail = () => {
    Alert.alert(
      "Change Email",
      "Are you sure you want to change your email?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Change", 
          style: "destructive",
          onPress: () => {
            router.push('/settings/change-email');
          }
        }
      ]
    );
  };
  // END of Maxwell Guillermo Contribution

  // Add these functions to your component
  const handleEditDisplayName = () => {
    // Implement logic to edit display name
  };

  const handleEditProfilePicture = () => {
    // Implement logic to edit profile picture
  };

  const handleEditLocation = () => {
    // Implement logic to edit location
  };
  
  const handleBackPress = () => {
    router.push('/profile');
  };


  // START of Jesus Donate Contribution
  // Toggle last name visibility
  const handlelastNameToggle = async (value: boolean) => {
    console.log('Show last name toggle value:', value);
    setLastNameVisible(value);

    // Only runs if the user is authenticated
    if (auth.currentUser) {

      // Gets the first and last name of the user
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      let firstName = '';
      let lastName = '';
      if (userDoc.exists()) {
        const userData = userDoc.data();
        firstName = userData.firstName || '';
        lastName = userData.lastName || '';
      }

      // Updates the user's last name visibility and display name in user's document
      try {
        await updateDoc(userDocRef, {
          lastNameVisible: value,
          displayName: value ? `${firstName} ${lastName}` : firstName
        });
        setName(value ? `${firstName} ${lastName}` : firstName);
        console.log(value ? `${firstName} ${lastName}` : firstName);
      } catch (error) {
        console.error('Error updating show last name preference:', error);
      }
    }
  };


  // Toggle location visibility
  const handleShowLocationToggle = async (value: boolean) => {
    setLocationVisible(value);

    // Only runs if the user is authenticated
    if (auth.currentUser) {

      // Gets the location of the user
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      let location = '';
      if (userDoc.exists()) {
        const userData = userDoc.data();
        location = userData.location || 'N/A';
      }

      // Updates the user's location visibility
      try {
        await updateDoc(userDocRef, {
          locationVisible: value,
          displayLocation: value ? `${location}` : 'N/A'
        });
        setLocation(value ? `${location}` : 'N/A');
        console.log('Show location preference updated successfully');
      } catch (error) {
        console.error('Error updating show location preference:', error);
      }
    }
  };
 
  


  // Jesus Donate - Display Name is used for the user's display name
  const handleSaveNameChange = async (newName: string) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const nameParts = newName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        await updateDoc(userDocRef, {
          firstName: firstName,
          lastName: lastName,
          displayName: lastNameVisible ? newName.trim() : firstName
        });
        
        // Update local state
        setName(lastNameVisible ? newName.trim() : firstName);
        setNameInput('');
        setIsNameModalVisible(false);
        console.log('Name updated successfully:', newName);
      }
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };



  const handleSaveLocationChange = async (newLocation: string) => {
    if (newLocation && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          location: newLocation,
          displayLocation: locationVisible ? newLocation : 'N/A'
        });
        
        setLocation(newLocation);
        setIsEditingLocation(false);
        
        Alert.alert(
          'Success',
          'Location updated successfully'
        );
      } catch (error) {
        console.error('Error updating location:', error);
        Alert.alert(
          'Error',
          'Failed to update location. Please try again.'
        );
      }
    }
  };

  // END of Jesus Donate Contribution

  const getBorderColor = (gender: string) => {
    
    switch (gender.toLowerCase()) {
      case 'male':
        return '#37bdd5';
      case 'female':
        return '#fc6c85';
      default:
        return '#fba904';
    }
  };

  // START of Mariann Grace Dizon Contribution
  // Import GIFs at the top of your file
  const gifImages: Record<string, any> = {
    'pfpoverlay1.gif': require('../assets/animated-avatar/pfpoverlay1.gif'),
    'pfpoverlay2.gif': require('../assets/animated-avatar/pfpoverlay2.gif'),
    'pfpoverlay3.gif': require('../assets/animated-avatar/pfpoverlay3.gif'),
    'pfpoverlay4.gif': require('../assets/animated-avatar/pfpoverlay4.gif'),
    'pfpoverlay5.gif': require('../assets/animated-avatar/pfpoverlay5.gif'),
    'pfpoverlay6.gif': require('../assets/animated-avatar/pfpoverlay6.gif'),
  };
  
  // START of Theme Toggle Function
  const handleThemeToggle = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          themePreference: newTheme ? 'dark' : 'light'
        });
        
        console.log('Theme preference saved:', newTheme ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
        setIsDarkMode(!newTheme);
        Alert.alert('Error', 'Failed to save theme preference');
      }
    }
  };
  // END of Theme Toggle Function

  // START of Save Border Change Function
  const handleSaveBorderChange = async () => {
    if (selectedGif && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          AnimatedBorder: selectedGif
        });
        console.log('Animated border saved successfully:', selectedGif);
        setIsEditingBorder(false);
      } catch (error) {
        console.error('Error saving animated border:', error);
        Alert.alert('Error', 'Failed to save animated border. Please try again.');
      }
    }
  };
  // END of Save Border Change Function

  // START of Cancel Border Change Function
  const handleCancelBorderChange = () => {
    fetchAnimatedBorder();
    setIsEditingBorder(false);
  };
  // END of Cancel Border Change Function
  // END of Mariann Grace Dizon Contribution

  // START of Maxwell Guillermo Contribution - Language Functions
  const handleLanguageChange = (language: string) => {
    try {
      i18n.changeLanguage(language).then(() => {
        setCurrentLanguage(language);
        setShowLanguageModal(false);
      }).catch((error) => {
        console.error('Error changing language:', error);
      });
    } catch (error) {
      console.error('Error in handleLanguageChange:', error);
    }
  };

  const languageNames = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ja: '日本'
  };

  // Language Modal Styles
  const languageModalStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
      backgroundColor: '#fff8f0',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      width: '100%',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 15,
      color: '#0e1514',
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#e0e0e0',
    },
    selectedOption: {
      backgroundColor: 'rgba(251, 169, 4, 0.1)',
    },
    optionText: {
      fontSize: 16,
      color: '#0e1514',
    },
    selectedText: {
      color: '#fba904',
      fontWeight: '600',
    },
    cancelOption: {
      marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#e0e0e0',
    }
  });
  // END of Maxwell Guillermo Contribution - Language Functions

  // Name Change Modal Styles
  const nameModalStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 20,
    },
    content: {
      backgroundColor: '#fff8f0',
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 20,
      color: '#0e1514',
      textAlign: 'center',
    },
    input: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#fba904',
      borderRadius: 8,
      padding: 10,
      marginBottom: 20,
      backgroundColor: '#fff',
    },
  });

  // Location Change Modal Styles
  const locationStyles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: '#FFF8F0',
      borderRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      paddingBottom: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
    },
    closeButton: {
      padding: 5,
    },
    autocompleteContainer: {
      position: 'relative',
      zIndex: 999,
      height: 200,
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 'auto',
      zIndex: 1,
    },
  });

  // Border Change Modal Styles
  const borderModalStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 20,
    },
    content: {
      backgroundColor: '#fff8f0',
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 20,
      color: '#0e1514',
      textAlign: 'center',
    },
    gifOption: {
      width: 100,
      height: 100,
      margin: 5,
      borderRadius: 50,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedGifOption: {
      borderColor: '#fba904',
    },
    gifThumbnail: {
      width: '100%',
      height: '100%',
    }
  });

  // Then update your modal components to use these specific styles:
  const LanguageModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLanguageModal}
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={languageModalStyles.container}>
        <View style={[
          languageModalStyles.content,
          { backgroundColor: getThemeColors(isDarkMode).background }
        ]}>
          <Text style={[
            languageModalStyles.title,
            { color: isDarkMode ? '#FFFFFF' : getThemeColors(isDarkMode).text }
          ]}>{t('settings.select_language')}</Text>
          <TouchableOpacity 
            style={[languageModalStyles.option, currentLanguage === 'en' && languageModalStyles.selectedOption]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={[
              languageModalStyles.optionText, 
              currentLanguage === 'en' && languageModalStyles.selectedText,
              { color: currentLanguage === 'en' && isDarkMode ? '#FFA500' : isDarkMode ? '#FFFFFF' : getThemeColors(isDarkMode).text }
            ]}>English</Text>
            {currentLanguage === 'en' && <Ionicons name="checkmark" size={20} color="#fba904" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[languageModalStyles.option, currentLanguage === 'es' && languageModalStyles.selectedOption]}
            onPress={() => handleLanguageChange('es')}
          >
            <Text style={[
              languageModalStyles.optionText, 
              currentLanguage === 'es' && languageModalStyles.selectedText,
              { color: currentLanguage === 'es' && isDarkMode ? '#FFA500' : isDarkMode ? '#FFFFFF' : getThemeColors(isDarkMode).text }
            ]}>Español</Text>
            {currentLanguage === 'es' && <Ionicons name="checkmark" size={20} color="#fba904" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[languageModalStyles.option, currentLanguage === 'fr' && languageModalStyles.selectedOption]}
            onPress={() => handleLanguageChange('fr')}
          >
            <Text style={[
              languageModalStyles.optionText, 
              currentLanguage === 'fr' && languageModalStyles.selectedText,
              { color: currentLanguage === 'fr' && isDarkMode ? '#FFA500' : isDarkMode ? '#FFFFFF' : getThemeColors(isDarkMode).text }
            ]}>Français</Text>
            {currentLanguage === 'fr' && <Ionicons name="checkmark" size={20} color="#fba904" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[languageModalStyles.option, currentLanguage === 'ja' && languageModalStyles.selectedOption]}
            onPress={() => handleLanguageChange('ja')}
          >
            <Text style={[
              languageModalStyles.optionText, 
              currentLanguage === 'ja' && languageModalStyles.selectedText,
              { color: currentLanguage === 'ja' && isDarkMode ? '#FFA500' : isDarkMode ? '#FFFFFF' : getThemeColors(isDarkMode).text }
            ]}>日本語</Text>
            {currentLanguage === 'ja' && <Ionicons name="checkmark" size={20} color="#fba904" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[languageModalStyles.option, languageModalStyles.cancelOption]}
            onPress={() => setShowLanguageModal(false)}
          >
            <Text style={[
              languageModalStyles.optionText,
              { color: isDarkMode ? '#FFFFFF' : getThemeColors(isDarkMode).text }
            ]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const NameChangeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isNameModalVisible}
      onRequestClose={() => {
        setIsNameModalVisible(false);
        setNameInput(name);
      }}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={nameModalStyles.container}>
          <View style={[
            nameModalStyles.content,
            { backgroundColor: getThemeColors(isDarkMode).background }
          ]}>
            <Text style={[
              nameModalStyles.title,
              { color: getThemeColors(isDarkMode).text }
            ]}>Change Name</Text>
            <TextInput
              style={nameModalStyles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter new name"
              autoFocus={false}
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleSaveNameChange(nameInput)}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => {
                setNameInput(name);
                setIsNameModalVisible(false);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const LocationChangeModal = () => {
    const [selectedLocation, setSelectedLocation] = useState('');

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingLocation}
        onRequestClose={() => setIsEditingLocation(false)}
      >
        <View style={locationStyles.modalContainer}>
          <View style={[
            locationStyles.modalContent,
            { backgroundColor: getThemeColors(isDarkMode).background }
          ]}>
            <View style={locationStyles.headerContainer}>
              <Text style={[
                locationStyles.modalTitle,
                { color: getThemeColors(isDarkMode).text }
              ]}>Change Location</Text>
              <TouchableOpacity 
                onPress={() => setIsEditingLocation(false)}
                style={locationStyles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={locationStyles.autocompleteContainer}>
              <GooglePlacesAutocomplete
                placeholder='Search for a city'
                fetchDetails={true}
                onPress={(data) => {
                  setSelectedLocation(data.description);
                }}
                query={{
                  key: 'AIzaSyAa8GhuQxxebW8Dw-2xMyFGnBA3R5IZHOc',
                  language: 'en',
                  types: '(cities)',
                }}
                styles={{
                  container: {
                    flex: 0,
                  },
                  textInput: {
                    height: 46,
                    backgroundColor: '#FFFFFF',
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                  },
                  listView: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    marginTop: 0,
                    maxHeight: 150,
                  },
                  row: {
                    padding: 13,
                    height: 44,
                    backgroundColor: '#FFFFFF',
                  },
                  separator: {
                    height: 1,
                    backgroundColor: '#E0E0E0',
                  },
                }}
                enablePoweredByContainer={false}
                debounce={300}
                minLength={2}
                listViewDisplayed="auto"
              />
            </View>

            <View style={locationStyles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, { flex: 1, backgroundColor: '#ff4444' }]} 
                onPress={() => setIsEditingLocation(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { flex: 1 }]}
                onPress={() => {
                  if (selectedLocation) {
                    handleSaveLocationChange(selectedLocation);
                  }
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const BorderChangeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditingBorder}
      onRequestClose={() => setIsEditingBorder(false)}
    >
      <View style={borderModalStyles.container}>
        <View style={[
          borderModalStyles.content,
          { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff8f0' }
        ]}>
          <Text style={[
            borderModalStyles.title,
            { color: isDarkMode ? '#ffffff' : '#0e1514' }
          ]}>Select an Animated Border</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(gifImages).map((gifKey) => (
              <TouchableOpacity
                key={gifKey}
                onPress={() => setSelectedGif(gifKey)}
                style={[
                  borderModalStyles.gifOption,
                  selectedGif === gifKey && borderModalStyles.selectedGifOption
                ]}
              >
                <Image source={gifImages[gifKey]} style={borderModalStyles.gifThumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={handleSaveBorderChange}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancelBorderChange}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Add these useEffects to handle state updates
  useEffect(() => {
    if (isEditingName) {
      setTempName(name);
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingLocation) {
      setTempLocation(location);
    }
  }, [isEditingLocation]);

  // Update the name editing functionality
  const handleEditName = () => {
    setNameInput(name); // Initialize with current name
    setIsNameModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: getThemeColors(isDarkMode).background 
    }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.customHeader, {
          borderBottomColor: getThemeColors(isDarkMode).divider
        }]}>
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={[styles.backButton, { color: getThemeColors(isDarkMode).text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.title')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Picture and Location Display */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.profileImageContainer,
              { borderColor: getBorderColor(userGender) }
            ]}
          >
            <Image
              source={{ uri: profileImage || 'https://via.placeholder.com/150' }}
              style={styles.profilePicture}
            />
            {selectedGif && (
              <Image
                source={gifImages[selectedGif]}
                style={styles.overlayGif}
              />
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.nameInput, isDarkMode && { color: getThemeColors(isDarkMode).text }]}>{name}</Text>
            {isVerified && (
              <Ionicons 
                name="checkmark-circle" 
                size={24}
                color="#fba904" 
                style={styles.verifiedBadge} 
              />
            )}
          </View>
          <Text style={[styles.locationInput, { color: getThemeColors(isDarkMode).subText }]}>{location}</Text>
        </View>

        {/* Edit Profile Section */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { color: getThemeColors(isDarkMode).subText }]}>
            {t('settings.profile.edit_profile')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleImagePicker}
        >
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.profile.change_profile_picture')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleEditName}
        >
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.profile.change_name')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditingLocation(true)}>
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.profile.change_location')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditingBorder(true)}>
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.profile.change_border')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        {/* Theme and Language Section */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.appearance')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        {/* Theme Toggle */}
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <View style={styles.settingTitleContainer}>
              <Ionicons 
                name={isDarkMode ? 'moon-outline' : 'sunny-outline'} 
                size={24} 
                color={getThemeColors(isDarkMode).text} 
              />
              <Text style={[
                styles.settingTitle, 
                { marginLeft: 10, color: getThemeColors(isDarkMode).text }
              ]}>
                {t('settings.theme_mode')}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: '#767577', true: '#79ce54' }}
            thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        {/* Language Selector */}
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.language')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {languageNames[currentLanguage as keyof typeof languageNames]}
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={getThemeColors(isDarkMode).subText} 
          />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        {/* Profile Section */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.profile.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.activity.last_active')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {t('settings.activity.last_active_description')}
            </Text>
          </View>
          <Switch />
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        {/* Matches Section */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.matches.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/current-liked-list')}>
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.matches.current_interactions')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        {/* Visibility Section */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.visibility.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.settingItem}>
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.visibility.show_last_name')}
          </Text>
          <Switch value={lastNameVisible} onValueChange={handlelastNameToggle} />
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.settingItem}>
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.visibility.show_location')}
          </Text>
          <Switch value={locationVisible} onValueChange={handleShowLocationToggle} />
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.settingItem}>
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.visibility.show_events')}
          </Text>
          <Switch value={myEventsVisible} onValueChange={setMyEventsVisible} />
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.notifications.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/push-notifications')}
        >
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.notifications.push_notifications')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/email-notifications')}
        >
          <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
            {t('settings.notifications.email_notifications')}
          </Text>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.safety.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/pause-new-interaction')}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.safety.pause_account')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {t('settings.safety.pause_account_description')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/selfie-verification')}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.safety.selfie_verification')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {isVerified ? t('settings.safety.verified') : t('settings.safety.not_verified')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/block-list')}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.safety.block_list')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {t('settings.safety.block_list_description')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/hidden-words')}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.safety.hidden_words')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {t('settings.safety.hidden_words_description')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.phone_email.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.contactItem}>
          <Text style={[styles.contactInfo, { color: getThemeColors(isDarkMode).text }]}>+1 XXX XXX XXX</Text>
          <Ionicons name="alert-circle-outline" size={14} color={isDarkMode ? '#9BA1A6' : 'red'} />
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.contactItem}>
          <View style={styles.contactInfoContainer}>
            <Text style={[styles.contactInfo, { color: getThemeColors(isDarkMode).text }]}>{email}</Text>
            <Ionicons name="checkmark-circle" size={14} color="green" />
          </View>
          <TouchableOpacity onPress={handleEditEmail}>
            <Text style={[styles.editText, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.phone_email.edit')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.data_privacy.title')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/download-data')}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.data_privacy.download_data')}
            </Text>
            <Text style={[styles.settingDescription, { color: getThemeColors(isDarkMode).subText }]}>
              {t('settings.data_privacy.download_description')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={[styles.sectionTitle, { 
            color: getThemeColors(isDarkMode).subText 
          }]}>
            {t('settings.data_privacy.explore_safety')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          //onPress={() => router.push('/settings/crisis-hotlines')}
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTitleContainer}>
              <Ionicons name="call-outline" size={24} color={getThemeColors(isDarkMode).text} />
              <Text style={[styles.settingTitle, { marginLeft: 10, color: getThemeColors(isDarkMode).text }]}>
                {t('settings.data_privacy.crisis_hotlines')}
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/safety-resources/help-center')}
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTitleContainer}>
              <Ionicons name="help-circle-outline" size={24} color={getThemeColors(isDarkMode).text} />
              <Text style={[styles.settingTitle, { marginLeft: 10, color: getThemeColors(isDarkMode).text }]}>
                {t('settings.data_privacy.help_center')}
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: getThemeColors(isDarkMode).subText }]}>›</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: getThemeColors(isDarkMode).divider }]} />

        <View style={styles.accountActionsContainer}>
          <TouchableOpacity style={styles.accountActionButton} onPress={handleLogout}>
            <Text style={[styles.accountActionText, { color: getThemeColors(isDarkMode).text }]}>
              {t('common.logout')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.accountActionButton} 
            onPress={handleChangePassword}
          >
            <Text style={[styles.accountActionText, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.account.change_password')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.accountActionButton, styles.deleteButton]} 
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.accountActionText, styles.deleteText, { color: getThemeColors(isDarkMode).text }]}>
              {t('settings.account.delete_account')}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <NameChangeModal />
      <LocationChangeModal />
      <BorderChangeModal />
      <LanguageModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  title: {
    fontSize: 20, // Reduced from 22
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 26, // Reduced from 28
    fontWeight: 'bold',
  },
  sectionContainer: {
    paddingTop: 10,
    paddingHorizontal: 30,
    paddingBottom: 15,
  },
  sectionSpacing: {
    marginTop: 20, // Add space above each section (except the first one)
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    marginLeft: 18.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 50,
  },
  settingContent: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 11, // Reduced from 15
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 10, // Reduced from 13
    color: '#888',
    lineHeight: 16, // Adjusted from 18
  },
  chevron: {
    fontSize: 18, // Reduced from 18
    color: '#888',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 55,
  },
  contactInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactInfo: {
    fontSize: 12,
    marginRight: 5,
    flex: 1,
  },
  editText: {
    fontSize: 10.5,
    color: 'black',
    marginLeft: 5,
  },
  accountActionsContainer: {
    marginTop: 40,
    marginBottom: 20, // Added margin at the bottom
  },
  accountActionButton: {
    paddingVertical: 15,
    marginVertical: 0 // Added vertical margin
  },
  accountActionText: {
    fontSize: 11, // Reduced from 13
    color: 'black',
    textAlign: 'center',
  },
  
  profileSection: {
    alignItems: 'center',
    marginVertical: 20, // Reduced from 45

  },
  profileImageContainer: {
    width: 125,
    height: 125,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 3,
    position: 'relative',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  locationInput: {
    fontSize: 14, // Reduced from 16
    color: '#666',
    marginTop: 5,
    marginBottom: 10, // Added to create some space before the Profile section
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    fontSize: 28, // Reduced from 30
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 15, // Reduced from 17
    fontWeight: 'bold',
  },
  placeholder: {
    width: 20, // To balance the back button on the left
  },
  overlayGif: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  currentLanguageText: {
    fontSize: 14,
    color: '#fba904',
    marginRight: 10,
  },
  mainModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#0e1514',
    textAlign: 'center',
  },
  mainModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
  },
  mainModalOptionText: {
    fontSize: 16,
    color: '#0e1514',
  },
  gifOption: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGifOption: {
    borderColor: '#fba904',
  },
  gifThumbnail: {
    width: '100%',
    height: '100%',
  },
  mainModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  mainModalContent: {
    backgroundColor: '#fff8f0',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 0,
  },
  deleteText: {
    color: '#ff0000', // matching red color for delete text
  },
  button: {
    backgroundColor: '#fba904',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  verifiedBadge: {
    marginLeft: 5,
  },
});


export default Settings;
