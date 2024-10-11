import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut, verifyBeforeUpdateEmail, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, deleteDoc, updateDoc, getDoc, addDoc, collection, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; // Ensure this import is correct
import { getFunctions, httpsCallable } from 'firebase/functions';
import PushNotificationsSettings from './settings/push-notifications';
import ChangePassword from './settings/change-password';
import { useRouter } from 'expo-router';

const Settings = () => {
  const navigation = useNavigation();
  const auth = getAuth();

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
  const googlePlacesRef = useRef(null);
  const router = useRouter();

  const [userGender, setUserGender] = useState('');

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
        setName(userData.displayName || `${userData.firstName} ${userData.lastName}`);
        setLocation(userData.displayLocation || 'Location not set');
        setProfileImage(userData.profileImageUrl || '');
        setUserGender(userData.gender || 'other');
        setLastNameVisible(userData.lastNameVisible !== false); // Default to true if not set
        setLocationVisible(userData.locationVisible !== false); // Default to true if not set
        console.log('Fetched user gender:', userData.gender);
      }
    }
  };

  // START of Reyna Aguirre Contribution
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              await signOut(auth);
              console.log("User signed out successfully");
              navigation.navigate('login-signup' as never);
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
            navigation.navigate('post-delete-survey' as never); // Navigate to the survey screen
          }
        }
      ]
    );
  };
  // END of Reyna Aguirre Contribution
  
  // New functions from profilesettings.tsx

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

  const handleImagePicker = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("Selected asset:", selectedAsset);

        const downloadURL = await uploadImageToFirebase(selectedAsset.uri);
        console.log("Download URL:", downloadURL);

        setProfileImage(downloadURL);

        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
            profileImageUrl: downloadURL
          });
          console.log("Firestore updated successfully");
        } else {
          console.log("No authenticated user found");
        }
      } else {
        console.log("Image picker cancelled or no asset selected");
      }
    } catch (error) {
      console.error("Error in handleImagePicker:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  };

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
            // Navigate to a separate screen for changing password
            navigation.navigate('settings/changepassword' as never);
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
            // Navigate to the change email screen
            navigation.navigate('settings/change-email' as never);
          }
        }
      ]
    );
  };

  // Add these functions to your component
  const handleEditDisplayName = () => {
    // Implement logic to edit display name
  };

  // Toggle last name visibility
  // Jesus Donate
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

  const handleEditProfilePicture = () => {
    // Implement logic to edit profile picture
  };

  const handleEditLocation = () => {
    // Implement logic to edit location
  };

  // Toggle location visibility
  // Jesus Donate
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

  // Update this function
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Jesus Donate - Display Name is used for the user's display name
  const handleSaveNameChange = async () => {
    // Changes name, even if is authenticated or not
    
    setIsEditingName(false);
    let firstName = '';
    let lastName = '';
    // Update name in Firestore
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const nameParts = tempName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
      await updateDoc(userDocRef, {
        firstName: firstName,
        lastName: lastName,
        // If the user has their last name hidden, then the display name is just the first name
        displayName: lastNameVisible ? tempName : firstName
      });
      // Update the name state with the new display name
    }

    setName(lastNameVisible ? tempName : firstName);
    console.log('Inside handleSaveNameChange:', lastName, lastName ? tempName : firstName);
  };

  const handleSaveLocationChange = async () => {
    if (tempLocation) {
      setLocation(locationVisible ? tempLocation : 'N/A');
      setIsEditingLocation(false);

      // Save the new location to Firestore
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        try {
          await updateDoc(userDocRef, {
            location: tempLocation,
            displayLocation: locationVisible ? tempLocation : 'N/A'
          });
          console.log('Location updated successfully in Firestore');
        } catch (error) {
          console.error('Error updating location in Firestore:', error);
        }
      }
    }
  };

  const getBorderColor = (gender: string) => {
    console.log('Getting border color for gender:', gender);
    switch (gender.toLowerCase()) {
      case 'male':
        return '#37bdd5';
      case 'female':
        return '#fc6c85';
      default:
        return '#fba904';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.backButton}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder}></View>
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
          </View>
          <Text style={styles.nameInput}>{name}</Text>
          <Text style={styles.locationInput}>{location}</Text>
        </View>

        {/* Edit Profile Section */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
        </View>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.settingItem} onPress={handleImagePicker}>
          <Text style={styles.settingTitle}>Change Profile Picture</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditingName(true)}>
          <Text style={styles.settingTitle}>Change Name</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditingLocation(true)}>
          <Text style={styles.settingTitle}>Change Location</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Rest of the settings sections */}
        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Pause</Text>
            <Text style={styles.settingDescription}>
              Pausing prevents your profile from being shown to new people. You can still chat with your current matches.
            </Text>
          </View>
          <Switch />
        </View>
        <View style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Show Last Active Status</Text>
            <Text style={styles.settingDescription}>
              No one can see your last active status, and you cannot see when others were last active.
            </Text>
          </View>
          <Switch />
        </View>
        <View style={styles.divider} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Visibility</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Show Last Name</Text>
          <Switch value={lastNameVisible} onValueChange={handlelastNameToggle} />
        </View>
        <View style={styles.divider} />

        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Show Location</Text>
          <Switch value={locationVisible} onValueChange={handleShowLocationToggle} />
        </View>
        <View style={styles.divider} />

        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Show My Events</Text>
          <Switch value={myEventsVisible} onValueChange={setMyEventsVisible} />
        </View>
        <View style={styles.divider} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('settings/push-notifications' as never)}
        >
          <Text style={styles.settingTitle}>Push Notifications</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('settings/email-notifications' as never)}
        >
          <Text style={styles.settingTitle}>Email Notifications</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />


        

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Safety</Text>
        </View>
        <View style={styles.divider} />
        

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('settings/selfie-verification' as never)}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Selfie Verification</Text>
            <Text style={styles.settingDescription}>You're not verified yet.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('settings/block-list' as never)}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Block List</Text>
            <Text style={styles.settingDescription}>
              Block people you know. They won't see you and you won't see them on Hinge.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('settings/hidden-words' as never)}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Hidden Words</Text>
            <Text style={styles.settingDescription}>
              Hide likes from people who use offensive words in their comments.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <View style={[styles.sectionContainer, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Phone & email</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.contactItem}>
          <Text style={styles.contactInfo}>+1 XXX XXX XXX</Text>
          <Ionicons name="alert-circle-outline" size={14} color="red" />
        </View>
        <View style={styles.divider} />

        <View style={styles.contactItem}>
          <View style={styles.contactInfoContainer}>
            <Text style={styles.contactInfo}>{email}</Text>
            <Ionicons name="checkmark-circle" size={14} color="green" />
          </View>
          <TouchableOpacity onPress={handleEditEmail}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        <View style={styles.accountActionsContainer}>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.accountActionButton} onPress={handleLogout}>
            <Text style={styles.accountActionText}>Log Out</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.accountActionButton} onPress={handleChangePassword}>
            <Text style={styles.accountActionText}>Change Password</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.accountActionButton} onPress={handleDeleteAccount}>
            <Text style={styles.accountActionText}>Delete Account</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
         
        </View>


      </ScrollView>

      {/* Modals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalOption} onPress={() => { handleImagePicker(); setModalVisible(false); }}>
              <Text style={styles.modalOptionText}>Change Profile Picture</Text>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={isChangingEmail}
        onRequestClose={() => setIsChangingEmail(false)}
      >
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

      {/* Name change modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingName}
        onRequestClose={() => setIsEditingName(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Name</Text>
            <TextInput
              style={styles.input}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter new name"
            />
            <TouchableOpacity style={styles.button} onPress={handleSaveNameChange}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setIsEditingName(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location change modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingLocation}
        onRequestClose={() => setIsEditingLocation(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Location</Text>
            <View style={styles.googleAutocompleteContainer}>
              <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder='Search for a city or town'
                onPress={(data, details) => {
                  if (details) {
                    setTempLocation(details.formatted_address);
                  }
                }}
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
            <TouchableOpacity style={styles.button} onPress={handleSaveLocationChange}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setIsEditingLocation(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0', // Updated background color
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
    borderWidth: 3,
    borderRadius: 75, // Half of the width and height
    overflow: 'hidden',
    width: 125,
    height: 125,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  nameInput: {
    fontSize: 22, // Reduced from 24
    fontWeight: 'bold',
    marginTop: 20,
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
    fontSize: 16, // Reduced from 18
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
    fontSize: 16, // Reduced from 18
    borderWidth: 1,
    borderColor: '#fc6c85',
    borderRadius: 8,
    padding: 6,
    marginRight: 40,
  },
  googleAutocompleteContainer: {
    flex: 0,
    width: '100%',
    marginBottom: 20,
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
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 14, // Reduced from 16
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    marginBottom: 20,
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
  cancelButton: {
    backgroundColor: '#ccc',
    marginTop: 10,
  },
});

export default Settings;