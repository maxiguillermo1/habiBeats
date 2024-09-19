// profilesettings.tsx
// Mariann Grace Dizon, Jesus Donate, Reyna Aguirre, and Maxwell Guillermo

// Import necessary dependencies
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Switch, TouchableOpacity, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useAuth } from '../hooks/useAuth';
import { app, db, auth, storage } from '../firebaseConfig';
import { collection, addDoc, Timestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, signOut, updateEmail, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileSettings() {
  // Get the user and userData from the useAuth hook
  const { user, userData } = useAuth();
  // Initialize router for navigation
  const router = useRouter();
  // Get initial image values from route params
  const { initialProfileImage, initialFavoritePerformanceImage } = useLocalSearchParams();
  // State variables for various settings
  const [showLastName, setShowLastName] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [profileImage, setProfileImage] = useState<string>(initialProfileImage as string);
  const [favoritePerformanceImage, setFavoritePerformanceImage] = useState(initialFavoritePerformanceImage as string | null);
  const [hasChanges, setHasChanges] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Location not set');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempLocation, setTempLocation] = useState(location);
  const googlePlacesRef = useRef(null);
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
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  // START of Displaying Real-Time User Data
  // START of Jesus Donate Contribution
  useEffect(() => {
    if (userData) {
      // Combine firstName and lastName
      setName(`${userData.firstName} ${userData.lastName}`);
      setLocation(userData.location || 'Location not set');
      // Set other state variables based on userData
      if (userData.profileImageUrl) {
        setProfileImage(userData.profileImageUrl);
      }
    }
  }, [userData]);
  // END of Displaying Real-Time User Data
  // END of Jesus Donate Contribution

  // START of Updating User Email in Firestore
  // START of Jesus Donate Contribution
  // update the user's email in Firestore if the email has been verified
  useEffect(() => {
    if (user) {
      const unsubscribe = auth.onIdTokenChanged(async (updatedUser) => {
        if (updatedUser) {
          const userDocRef = doc(db, 'users', updatedUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          
          if (userData && userData.pendingEmail && updatedUser.email === userData.pendingEmail) {
            // Email has been verified and changed
            await updateDoc(userDocRef, {
              email: updatedUser.email,
              pendingEmail: null
            });
            console.log('Email updated in Firestore');
          }
        }
      });
  
      return () => unsubscribe();
    }
  }, [user]);
  // END of Updating User Email in Firestore
  // END of Jesus Donate Contribution
  
  // Function to handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // START of Uploading Image to Firebase
  // START of Jesus Donate Contribution
  const uploadImageToFirebase = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = 'profilePicture_' + auth.currentUser?.uid;
    const storageRef = ref(storage, `profilePictures/${filename}`);
    
    try {
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image: ", error);
      throw error;
    }
  };
  // END of Uploading Image to Firebase
  // END of Jesus Donate Contribution

  // START of Picking Image from Camera Roll
  // Start of Grace Mariann Dizon Contribution
  const handleImagePicker = async (setImageFunction: React.Dispatch<React.SetStateAction<string>>) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const downloadURL = await uploadImageToFirebase(result.assets[0].uri);
        setImageFunction(downloadURL);
        setHasChanges(true);

        // Update user document in Firestore
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
            profileImageUrl: downloadURL
          });
        }
      } catch (error) {
        console.error("Error handling image pick: ", error);
        Alert.alert("Error", "Failed to upload image. Please try again.");
      }
    }
  };
  // END of Picking Image from Camera Roll
  // END of Grace Mariann Dizon Contribution

  // Function to handle profile picture edit
  const handleEditProfilePicture = () => setModalVisible(true);

  // Function to handle saving changes
  const handleSave = () => {
    console.log('Saving changes...');
    router.replace({
      pathname: '/profile',
      params: { 
        updatedProfileImage: profileImage,
        updatedFavoritePerformanceImage: favoritePerformanceImage,
        updatedName: name,
        updatedLocation: location
      }
    });
  };

  // START Function to Handle Logout
  // START of Reyna Aguirre Contribution
  const handleLogout = () => {
    // R (09/06/2024) - Added a Popup Alert to Confirm Logout START
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: async () => {
            const auth = getAuth();
            try {
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
  // END Function to Handle Logout
  // END of Reyna Aguirre Contribution

  // START of Jesus Donate Contribution
  // START of Updating User Display Name in Firestore
  const handleSaveNameChange = async () => {
    setName(tempName);
    setIsEditingName(false);
    setHasChanges(true);

    // Save the new changed display name to Firestore
    if (user) { // if user is logged in 
      const userDocRef = doc(db, 'users', user.uid);
      const nameParts = tempName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      // try to update the name in Firestore
      try {
        await updateDoc(userDocRef, {
          firstName: firstName,
          lastName: lastName,
          displayName: tempName
        });
        console.log('Display name updated successfully in Firestore');
        // Update the name in profile.tsx
        router.setParams({ updatedName: tempName });
      } catch (error) {
        console.error('Error updating display name in Firestore:', error);
      }
    }
  };
  // END of Updating User Display Name in Firestore
  // END of Jesus Donate Contribution

  // START of Updating User Location in Firestore
  // START of Jesus Donate Contribution
  const handleSaveLocationChange = async (data: any, details: any) => {
    console.log('handleSaveLocationChange called');
    console.log('data:', data);
    console.log('details:', details);
    if (details) {
      const newLocation = details.formatted_address;
      setTempLocation(newLocation);
      setLocation(newLocation);
      setIsEditingLocation(false);
      setHasChanges(true);

      // Save the new location to Firestore
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDocRef, {
            location: newLocation
          });
          console.log('Location updated successfully in Firestore');
        } catch (error) {
          console.error('Error updating location in Firestore:', error);
        }
      }
    }
  };
  // END of Updating User Location in Firestore
  // END of Jesus Donate Contribution

  const handleSaveLocation = async () => {
    setLocation(tempLocation);
    setIsEditingLocation(false);
    setHasChanges(true);

    // Save the new location to Firestore
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userDocRef, {
          location: tempLocation
        });
        console.log('Location updated successfully in Firestore');
      } catch (error) {
        console.error('Error updating location in Firestore:', error);
      }
    }
  };

  // START of Changing User Email
  // START of Jesus Donate Contribution
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

    // check if the new email is valid
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
      // Check if the new email is already in use
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setEmailChangeError('This email is already in use. Please choose a different email.');
        return;
      }

      // Send OTP to the current email
      await sendEmailChangeOTP(auth.currentUser.email!);
      return;
    }

    if (!otp) {
      setEmailChangeError('Please enter the OTP.');
      return;
    }

    // Verify OTP
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

    // Check if OTP is expired (15 minutes)
    const now = Timestamp.now();
    const expirationTime = 15 * 60 * 1000; // 15 minutes
    if (now.toMillis() - otpData.timestamp.toMillis() > expirationTime) {
      setEmailChangeError('OTP has expired. Please request a new one.');
      return;
    }

    try {
      // Send verification email to the new email address
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  
      // Mark OTP as used
      await updateDoc(otpDoc.ref, { used: true });
  
      // Save the new email in Firestore (it will be updated after verification)
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        pendingEmail: newEmail
      });
  
      // Set up an observer for the user's ID token
      const unsubscribe = auth.onIdTokenChanged(async (user) => {
        if (user?.email === newEmail) {
          // Email has been verified and changed
          await updateDoc(userDocRef, {
            email: newEmail,
            pendingEmail: null
          });
          unsubscribe(); // Stop listening for changes
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
  // END of Changing User Email
  // END of Jesus Donate Contribution

  // START of Changing User Password
  // START of Jesus Donate Contribution
  const handleChangePassword = async () => {
    setPasswordChangeError('');
    const auth = getAuth();
    if (!auth.currentUser) return;

    if (!currentPassword) {
      setPasswordChangeError('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setPasswordChangeError('New password cannot be empty.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordChangeError('New password cannot be the same as current password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New password and confirm new password do not match.');
      return;
    }

    try {
      // Re-authenticate the user
      await signInWithEmailAndPassword(auth, auth.currentUser.email!, currentPassword);

      // Update the password
      await updatePassword(auth.currentUser, newPassword);

      Alert.alert('Success', 'Your password has been changed successfully.');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordChangeError('Current password is incorrect. Please try again.');
      } else {
        setPasswordChangeError('Failed to change password. Enter valid current password.');
      }
    }
  };
  // END of Changing User Password
  // END of Jesus Donate Contribution

  // START of UI Render
  // START of Reyna Aguirre and Maxwell Guillermo and Grace Mariann Dizon and Jesus Donate Contribution
  // Render the component
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>
        
        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImage }}
              style={styles.profilePicture}
            />
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePicture}>
              <Ionicons name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {isEditingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempName}
                onChangeText={setTempName}
              />
              <TouchableOpacity style={styles.editButton} onPress={handleSaveNameChange}>
                <Ionicons name="save-outline" size={25} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.nameInput}>{name}</Text>
          )}
          {isEditingLocation ? (
            <View style={styles.editContainer}>
              <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder='Search for a city or town'
                onPress={handleSaveLocationChange}
                query={{
                  key: 'AIzaSyAa8GhuQxxebW8Dw-2xMyFGnBA3R5IZHOc',
                  language: 'en',
                  types: '(cities)',
                }}
                styles={{
                  container: styles.googleAutocompleteContainer,
                  textInputContainer: styles.googleAutocompleteInputContainer,
                  textInput: styles.googleAutocompleteInput,
                  listView: styles.googleAutocompleteListView,
                }}
                fetchDetails={true}
                onFail={(error) => console.error(error)}
                onNotFound={() => console.log('no results')}
                filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                debounce={200}
              />
            </View>
          ) : (
            <Text style={styles.locationInput}>{location}</Text>
          )}
        </View>

        {/* Settings section */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.settingsSection}>
            {/* Notifications setting */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#767577", true: "#79ce54" }}
                thumbColor={notifications ? "#f4f3f4" : "#f4f3f4"}
              />
            </View>
            {/* Show Last Name setting */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show Last Name</Text>
              <Switch
                value={showLastName}
                onValueChange={setShowLastName}
                trackColor={{ false: "#767577", true: "#79ce54" }}
                thumbColor={showLastName ? "#f4f3f4" : "#f4f3f4"}
              />
            </View>
            {/* Show Location setting */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show Location</Text>
              <Switch
                value={showLocation}
                onValueChange={setShowLocation}
                trackColor={{ false: "#767577", true: "#79ce54" }}
                thumbColor={showLocation ? "#f4f3f4" : "#f4f3f4"}
              />
            </View>
            {/* Show My Events setting */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show My Events</Text>
              <Switch
                value={showMyEvents}
                onValueChange={setShowMyEvents}
                trackColor={{ false: "#767577", true: "#79ce54" }}
                thumbColor={showMyEvents ? "#f4f3f4" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Logout button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal for edit options */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalOption} onPress={() => { handleImagePicker(setProfileImage); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Profile Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setIsEditingLocation(true); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setIsEditingName(true); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Display Name</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setIsChangingEmail(true); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setIsChangingPassword(true); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Email change modal */}
        <Modal
        animationType="slide"
        transparent={true}
        visible={isChangingEmail}
        onRequestClose={() => setIsChangingEmail(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Email</Text>
            {!otpSent ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="New Email"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Email"
                  value={confirmNewEmail}
                  onChangeText={setConfirmNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.button} onPress={handleChangeEmail}>
                  <Text style={styles.buttonText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.button} onPress={handleChangeEmail}>
                  <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
              </>
            )}
            {emailChangeError ? <Text style={styles.errorText}>{emailChangeError}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={() => {
              setIsChangingEmail(false);
              setOtpSent(false);
              setOtp('');
              setNewEmail('');
              setConfirmNewEmail('');
              setEmailChangeError('');
            }}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isChangingPassword}
        onRequestClose={() => setIsChangingPassword(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
            />
            {passwordChangeError ? <Text style={styles.errorText}>{passwordChangeError}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {
              setIsChangingPassword(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
              setPasswordChangeError('');
            }}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </>
  );
}
// END of UI Render
// END of Reyna Aguirre and Maxwell Guillermo and Grace Mariann Dizon and Jesus Donate Contribution

// START of StyleSheet
// START of Reyna Aguirre and Maxwell Guillermo and Grace Mariann Dizon and Jesus Donate Contribution 
// Define styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  profileSection: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fc6c85',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#fc6c85',
    borderRadius: 15,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  locationInput: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#37bdd5',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderColor: '#fba904',
    borderWidth: 1,
  },
  modalOption: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#e07ab1',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginHorizontal: 20,
    width: '90%',
  },
  editInput: {
    flex: 1,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#fc6c85',
    borderRadius: 8,
    padding: 6,
    marginRight: 40,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  googleAutocompleteContainer: {
    flex: 1,
    width: '100%',
  },
  googleAutocompleteInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  googleAutocompleteInput: {
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#fc6c85',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  googleAutocompleteListView: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#fc6c85',
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fc6c85',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fc6c85',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 20,
  },
});
// END of StyleSheet
// END of Reyna Aguirre and Maxwell Guillermo and Grace Mariann Dizon and Jesus Donate Contribution 