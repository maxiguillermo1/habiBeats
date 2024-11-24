// match.tsx
// Mariann Grace Dizon & Reyna Aguirre

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableOpacity, ScrollView, Modal, Animated, Alert, ImageSourcePropType, FlatList, TextInput } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from './match-algorithm'; // import isMatch and User from match-algorithm.tsx
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig'; 
import { fetchCompatibleUsers } from './match-algorithm'; // for match algorithm
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore"; // to store matches 
import { useFocusEffect } from '@react-navigation/native';
import { addNotification } from '../scripts/notificationHandler';
import { sendPushNotification } from '../scripts/pushNotification';

// END of Mariann Grace Dizon Contribution
// Define gifImages for animated borders
const gifImages: Record<string, any> = {
  'pfpoverlay1.gif': require('../assets/animated-avatar/pfpoverlay1.gif'),
  'pfpoverlay2.gif': require('../assets/animated-avatar/pfpoverlay2.gif'),
  'pfpoverlay3.gif': require('../assets/animated-avatar/pfpoverlay3.gif'),
  'pfpoverlay4.gif': require('../assets/animated-avatar/pfpoverlay4.gif'),
  'pfpoverlay5.gif': require('../assets/animated-avatar/pfpoverlay5.gif'),
  'pfpoverlay6.gif': require('../assets/animated-avatar/pfpoverlay6.gif'),
};
// END of Mariann Grace Dizon Contribution

// START of to updating matches hashmap for current user
// Reyna Aguirre Contribution
const updateUserMatch = async (currentUserId: string, matchedUserId: string, status: "liked" | "disliked" | "blocked") => {
  const db = getFirestore(app);
  const userDocRef = doc(db, "users", currentUserId); 

  try {
    await updateDoc(userDocRef, {
      [`matches.${matchedUserId}`]: status  
    });
    console.log(`Match updated: ${matchedUserId} is ${status}`);
  } catch (error) {
    console.error("Error updating match status: ", error);
  }
};
// END of to updating matches hashmap for current user


// START of Match component definition and state initialization
// START of Mariann Grace Dizon Contribution
const Match = () => {
  const [showMatchModal, setShowMatchModal] = useState(false);   // State to control the visibility of the match modal
  const [likeButtonColor, setLikeButtonColor] = useState('#fff8f0');   // State to manage the color of the like button
  const [dislikeButtonColor, setDislikeButtonColor] = useState('#fff8f0'); // State to manage the color of the dislike button
  const [likedContent, setLikedContent] = useState<Set<string>>(new Set());
  const [showWaitingModal, setShowWaitingModal] = useState(false); // New state for waiting modal
  const [showDislikeModal, setShowDislikeModal] = useState(false); // New state for dislike modal
  const [disposablePhotos, setDisposablePhotos] = useState<Array<{imageUrl: string}>>([]);
  const [commentedContent, setCommentedContent] = useState<Set<string>>(new Set());

  // Using useRouter hook to get the router instance for navigation
  const router = useRouter();

  // Animation values for scale and opacity
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  // Animation values for modals
  const waitingModalScale = useRef(new Animated.Value(0)).current;
  const dislikeModalScale = useRef(new Animated.Value(0)).current;
// END of Match component definition and state initialization
// END of Mariann Grace Dizon Contribution

  //  START of fetch two users from Firestore
  //  START of Reyna Aguirre Contribution
  const [user1, setUser1] = useState<User | null>(null); // current user
  const [user2, setUser2] = useState<User | null>(null); // random user
  const [noMoreUsers, setNoMoreUsers] = useState(false); // variable to check if no more users
  const [compatibleUsers, setCompatibleUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null); // current user image
  // END of Reyna Aguirre Contribution

  // START of Mariann Grace Dizon Contribution
  // Add a new state to store the animated border for user2
  const [user2AnimatedBorder, setUser2AnimatedBorder] = useState<ImageSourcePropType | null>(null);

  // Function to fetch the animated border for user2
  const fetchUser2AnimatedBorder = async (user2Id: string) => {
    try {
      const db = getFirestore(app);
      const user2DocRef = doc(db, 'users', user2Id);
      const user2Doc = await getDoc(user2DocRef);
      if (user2Doc.exists()) {
        const user2Data = user2Doc.data();
        if (user2Data.AnimatedBorder && gifImages[user2Data.AnimatedBorder]) {
          setUser2AnimatedBorder(gifImages[user2Data.AnimatedBorder] as ImageSourcePropType);
        }
      }
    } catch (error) {
      console.error('Error fetching user2 animated border:', error);
    }
  };

  // Call fetchUser2AnimatedBorder when user2 is set
  useEffect(() => {
    if (user2) {
      fetchUser2AnimatedBorder(user2.uid);
    }
  }, [user2]);
  // END of Mariann Grace Dizon Contribution

  // START of Reyna Aguirre Contribution
  const [isPaused, setIsPaused] = useState(false);

  // Replace the useEffect with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      console.log("Match screen is focused - reloading data");
      fetchUsers();
    }, [])
  );

  // Move fetchUsers logic into separate function for reusability
  const fetchUsers = async () => {
    // fetch current user (user1)
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    setIsLoading(true);

    if (currentUser) {
      // Fetch current user's profile image from Firestore
      const db = getFirestore(app);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as User;
        setUser1(userData);
        setCurrentUserImage(userData.profileImageUrl || null);
        
        if (userData.paused) {
          setIsPaused(true);
          setIsLoading(false);
          return; // Exit early if paused
        }

        const fetchedUsers = await fetchCompatibleUsers();
        console.log("INIT FETCHED USERS:", fetchedUsers.map(user => user.displayName));
        
        const mutuallyCompatibleUsers = await Promise.all(
          fetchedUsers.map(async (user) => {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.data() as User;
    
            // Check if `user` has interacted with `currentUser`
            const currentUserMatchStatus = userData.matches?.[currentUser.uid];
            
            // Only include users who have either not interacted with the current user or liked them
            if (!currentUserMatchStatus || currentUserMatchStatus === "liked") {
              console.log(`${user.displayName} COULD BE mutually compatible as ${user.displayName} has not interacted with ${currentUser.displayName} yet OR has liked ${currentUser.displayName}.`);
              return user;
            } else {
              console.log(`${user.displayName} is not mutually compatible, skipping.`);
              return null;
            }
          })
        );
        const compatibleUsers = mutuallyCompatibleUsers.filter((user): user is User => user !== null);
        setCompatibleUsers(compatibleUsers);

        if (compatibleUsers.length > 0) {
          setUser2(compatibleUsers[0]);
          setCurrentIndex(0);
          setNoMoreUsers(false);
        } else {
          setNoMoreUsers(true);
        }
      }
    }
    setIsLoading(false);
  };

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, []);
  //  END of fetch two users from Firestore

    // START of fetch a random user (user2) contribution
    const fetchNextUser = async () => {
      if (currentIndex < compatibleUsers.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextUser = compatibleUsers[nextIndex];
    
        // Retrieve `user2`'s data to check interaction
        const db = getFirestore(app);
        const userDocRef = doc(db, "users", nextUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const nextUserData = userDocSnap.data() as User;
    
        // Check if `user2` has liked or disliked the current user
        const currentUserMatchStatus = user1?.uid ? nextUserData.matches?.[user1.uid] : undefined;
        const isMutuallyCompatible = !currentUserMatchStatus || currentUserMatchStatus === "liked";
    
        if (isMutuallyCompatible) {
          setCurrentIndex(nextIndex);
          setUser2(nextUser);
        } else {
          // Skip to the next user if not mutually compatible
          setCurrentIndex(nextIndex);
          fetchNextUser();
        }
      } else {
        setUser2(null);
        setNoMoreUsers(true);
      }
    };
    // END of fetch a random user (user2) contribution
    // END of Reyna Aguirre Contribution
  

  // START of modal animation functions
  // START of Mariann Grace Dizon Contribution
  // Function to animate the modal
  const animateModal = (visible: boolean, scaleValue: Animated.Value) => {
    Animated.timing(scaleValue, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  // END of modal animation functions
  // END of Mariann Grace Dizon Contribution
    
  // START of heart button press handler
  // START of Mariann Grace Dizon Contribution
  // Handler for when the heart button is pressed
  const handleHeartPress = async () => {
    if (user2) {
      setLikeButtonColor('#fc6c85');
      console.log("heart pressed");

      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (currentUser) {
        await updateUserMatch(currentUser.uid, user2.uid, "liked");

        // Add in-app notification
        await addNotification(
          user2.uid,
          `${currentUser.displayName || 'Someone'} liked you!`,
          'like',
          {
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
          }
        );
        console.log("In-app notification sent to user2");

        // Fetch user2's push token
        const db = getFirestore(app);
        const user2DocRef = doc(db, "users", user2.uid);
        const user2DocSnap = await getDoc(user2DocRef);

        if (user2DocSnap.exists()) {
          const user2Data = user2DocSnap.data() as User;
          const user2MatchStatus = currentUser ? user2Data.matches?.[currentUser.uid] : undefined;
          const user2PushToken = user2Data.expoPushToken;

          // Send push notification if user2 has a push token
          if (user2PushToken) {
            await sendPushNotification(
              user2PushToken,
              'New Like',
              `${currentUser.displayName || 'Someone'} liked you!`,
              {
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
              }
            );
            console.log("Push notification sent to user2");
          }

          if (user2MatchStatus === "liked" && currentUser) {
            console.log(`It's a match! ${currentUser.displayName} and ${user2.displayName} liked each other.`);
            setShowMatchModal(true);
            animateModal(true, scaleValue);
          } else {
            console.log(`No mutual like yet. ${user2.displayName} has not liked ${currentUser?.displayName || currentUser?.uid}`);
            setShowWaitingModal(true);
            animateModal(true, waitingModalScale);
            setTimeout(() => {
              setShowWaitingModal(false);
              animateModal(false, waitingModalScale);
              fetchNextUser();
              setLikeButtonColor('#fff8f0');
            }, 3000);
          }
        } else {
          console.error("User2 document not found in Firestore.");
        }
      }
    }
  };
  // END of heart button press handler
  // END of Mariann Grace Dizon Contribution
  
  // START of close button press handler
  // START of Mariann Grace Dizon Contribution
  const handleClosePress = async () => {
    if (user2) {
      setDislikeButtonColor('#0e1514');
      console.log("close pressed");

      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateUserMatch(currentUser.uid, user2.uid, "disliked");
      }

      setShowDislikeModal(true);
      animateModal(true, dislikeModalScale);
      setTimeout(() => {
        setShowDislikeModal(false);
        animateModal(false, dislikeModalScale);
        fetchNextUser();
        setDislikeButtonColor('#fff8f0');
      }, 3000);
    }
  };
  // END of close button press handler
  // END of Mariann Grace Dizon Contribution

  // START of match reset functions
  // START of Reyna Aguirre Contribution
  const confirmResetMatches = () => {
    Alert.alert(
      "Confirm Reset Matches",
      "are you sure you want to reset current match statuses (including blocked users)? this action cannot be undone.",
      [
        {
          text: "cancel",
          style: "cancel"
        },
        {
          text: "yes",
          style: "destructive",
          onPress: () => resetMatches()
        }
      ]
    );
  };

  const resetMatches = async () => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
  
    if (currentUser) {
      const db = getFirestore(app);
      const userDocRef = doc(db, "users", currentUser.uid);
  
      try {
        await updateDoc(userDocRef, { matches: {} });
        console.log("User matches reset successfully");
        
        // Clear local state
        setCompatibleUsers([]);
        setUser2(null);
        setNoMoreUsers(false);
        setCurrentIndex(0);
  
        console.log("Fetching new compatible users after reset");
        const fetchedUsers = await fetchCompatibleUsers();
        console.log("Fetched users:", fetchedUsers.map(user => user.displayName));
  
        const mutuallyCompatibleUsers = await Promise.all(
          fetchedUsers.map(async (user) => {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.data() as User;
    
            // All users should be compatible after reset, so we don't need to check matches
            return user;
          })
        );
  
        const compatibleUsers = mutuallyCompatibleUsers.filter((user): user is User => user !== null);
        console.log("Compatible users after reset:", compatibleUsers.map(user => user.displayName));
        
        setCompatibleUsers(compatibleUsers);
  
        if (compatibleUsers.length > 0) {
          setUser2(compatibleUsers[0]);
          setCurrentIndex(0);
          setNoMoreUsers(false);
          console.log("Initial user set after reset:", compatibleUsers[0].displayName);
        } else {
          setNoMoreUsers(true);
          console.log("No compatible users found after reset");
        }
  
      } catch (error) {
        console.error("Error resetting user matches: ", error);
      }
    } else {
      console.log("No current user authenticated");
    }
  };
  // END of match reset functions
  // END of Reyna Aguirre Contribution

  // START of navigation function
  // START of Mariann Grace Dizon Contribution
  // Function to navigate to the direct message screen  
  const navigateToDirectMessage = (recipientId: string, recipientName: string) => {
    router.push({
      pathname: '/directmessage',
      params: { recipientId, recipientName },
    });
  };
  // END of navigation function
  // END of Mariann Grace Dizon Contribution
  
  // START of like button color reset effect
  // START of Mariann Grace Dizon Contribution
  // Effect to reset like button color when modal is closed
  useEffect(() => {
    if (!showMatchModal) {
      setLikeButtonColor('#fff8f0'); // Change back to original color
    }
  }, [showMatchModal]);
  // END of like button color reset effect
  // END of Mariann Grace Dizon Contribution

  // START of modal close handler
  // START of Mariann Grace Dizon Contribution
  // Function to handle modal close
  const handleModalClose = () => {
    animateModal(false, scaleValue);
    setShowMatchModal(false);
    fetchNextUser(); // Load the next user profile
  };
  // END of modal close handler
  // END of Mariann Grace Dizon Contribution

  // START of content like handler
  // START of Mariann Grace Dizon Contribution  
  const handleContentLike = (contentType: string) => {
    if (user2) {
      setLikedContent(prev => {
        const newSet = new Set(prev);
        if (newSet.has(contentType)) {
          console.log(`Unlike button pressed for ${contentType}`);
          newSet.delete(contentType);
          removePromptInteraction("like", contentType, user2.uid); // Remove like interaction from Firestore
        } else {
          console.log(`Like button pressed for ${contentType}`);
          newSet.add(contentType);
          savePromptInteraction("like", contentType, user2.uid); // Save like interaction with user2's ID
        }
        return newSet;
      });
    }
  };
  // END of content like handler
  // END of Mariann Grace Dizon Contribution  

  // START of Mariann Grace Dizon Contribution
  // Add near other useEffect hooks
  useEffect(() => {
    const fetchDisposablePhotos = async () => {
      if (user2?.myDisposables && user2.myDisposables.length > 0) {
        try {
          const photos = user2.myDisposables.map(photo => ({
            imageUrl: photo.url // Removed timestamp
          }));
          
          setDisposablePhotos(photos);
        } catch (error) {
          console.error('Error processing disposable photos:', error);
          setDisposablePhotos([]);
        }
      } else {
        setDisposablePhotos([]);
      }
    };

    if (user2) {
      fetchDisposablePhotos();
    }
  }, [user2]);
  // END of Mariann Grace Dizon Contribution

  // START of Mariann Grace Dizon Contribution
  // Fetch the user's theme preference
  const [themePreference, setThemePreference] = useState<string>('light');

  useEffect(() => {
    const fetchThemePreference = async () => {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const db = getFirestore(app);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          setThemePreference(userData.themePreference || 'light');
        }
      }
    };

    fetchThemePreference();
  }, []);
  // END of Mariann Grace Dizon Contribution

  // Define styles based on theme preference
  const isDarkTheme = themePreference === 'dark';
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? '#1E1E1E' : '#fff8f0',
    },
    header: {
      flexDirection: 'row',
      paddingLeft: 70,
      paddingRight: 70,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },
    profileImageContainer: {
      borderWidth: 3,
      borderRadius: 50,
      overflow: 'hidden',
      width: 80,
      height: 80,
      position: 'relative',
    },
    profilePicture: {
      width: '100%',
      height: '100%',
    },
    userInfo: {
      flex: 1,
      marginLeft: 15,
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
      marginBottom: 4,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    location: {
      fontSize: 12,
      marginLeft: 4,
    },
    resetButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 10, 
      paddingTop: 30,
    },
    resetButtonIcon: {
      color: isDarkTheme ? '#fff' : '#0e1514', // Adjust the color based on the theme
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 100,
    },
    content: {
      paddingTop: 14,
      paddingLeft: 55,
      paddingRight: 55,
      paddingBottom: 10,
    },
    inputContainer: {
      marginBottom: 20,
      position: 'relative',
      backgroundColor: isDarkTheme ? '#333' : '#FFFFFF',
      borderRadius: 10,
      padding: 15,
    },
    inputContent: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkTheme ? '#fff' : '#333',
    },
    inputText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
    },
    imageInput: {
      width: 240,
      height: 240,
      alignSelf: 'center',
    },
    messageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    message: {
      fontSize: 25,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#000',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 32,
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
    },
    actionButton: {
      borderRadius: 30,
      width: 55,
      height: 55,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dislikeButton: {
      backgroundColor: '#de3c3c',
    },
    likeButton: {
      backgroundColor: '#79ce54',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
      padding: 20,
    },
    modalContent: {
      backgroundColor: isDarkTheme ? '#79ce54' : '#79ce54',
      padding: 20,
      borderRadius: 40,
      alignItems: 'center',
      width: 350,
      height: 750,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 20,
    },
    modalBody: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    modalTitle: {
      fontSize: 40,
      fontWeight: '800',
      color: '#1E1E1E',
      textAlign: 'center',
      marginVertical: 30,
    },
    modalProfilePic: {
      width: 190,
      height: 190,
      borderRadius: 110,
      marginVertical: 10,
    },
    messageButton: {
      padding: 10,
    },
    closeButton: {
      padding: 10,
    },
    profilePicContainer: {
      alignItems: 'center',
      marginBottom: 50,
    },
    displayName: {
      fontSize: 30,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDarkTheme ? '#fff' : '#333',
    },
    musicPreference: {
      marginBottom: 20,
    },
    genre: {
      fontSize: 22,
      color: isDarkTheme ? '#fff' : '#000',
      marginBottom: 5,
      fontWeight: 'bold',
    },
    promptImage: {
      width: 300,
      height: 300,
      borderRadius: 20,
      marginBottom: 25,
      padding: 20,
    },
    profilePic: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    contentLikeButton: {
      position: 'absolute',
      bottom: 3,
      right: 7,
      padding: 6,
      zIndex: 1,
    },
    promptContainer: {
      backgroundColor: isDarkTheme ? '#333' : '#FFFFFF',
      borderRadius: 10,
      marginTop: 5,
      marginBottom: 6,
      marginLeft: 10,
      marginRight: 10,
    },
    promptQuestion: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
      marginBottom: 5,
    },
    promptAnswer: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
    },
    songContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    albumArt: {
      width: 60,
      height: 60,
      borderRadius: 5,
      marginRight: 15,
      marginLeft: 15,
    },
    songInfo: {
      flex: 1,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
    },
    songArtist: {
      marginTop: 1,
      fontSize: 11,
      color: isDarkTheme ? '#fff' : '#333',
    },
    albumContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    albumInfo: {
      flex: 1,
    },
    albumName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
    },
    albumArtist: {
      marginTop: 1,
      fontSize: 11,
      color: isDarkTheme ? '#666' : '#333',
    },
    artistContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    artistImage: {
      width: 60,
      height: 60,
      borderRadius: 50,
      marginRight: 15,
      marginLeft: 15,
      marginTop: 4,
      marginBottom: 4,
    },
    artistName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
    },
    waitingModalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkTheme ? '#0e1514' : '#fff8f0',
    },
    waitingText: {
      fontSize: 20,
      color: isDarkTheme ? '#fba904' : '#fba904',
      marginTop: 20,
    },
    dislikeModalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkTheme ? '#0e1514' : '#fff8f0',
    },
    dislikeText: {
      fontSize: 20,
      color: isDarkTheme ? '#fba904' : '#fba904',
      marginTop: 20,
    },
    animatedBorder: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 50,
      zIndex: 1,
    },
    pausedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    pausedTitle: {
      fontSize: 25,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#000',
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 20,
    },
    settingsButton: {
      padding: 15,
    },
    settingsButtonText: {
      fontSize: 14,
      color: '#79ce54',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    pauseSettingsButtonText: {
      fontSize: 12,
      color: '#7d7d7d',
      textAlign: 'center',
    },
    pauseIconContainer: {
      marginBottom: 30,
    },
    disposableGallery: {
      marginTop: 10,
    },
    disposablePhotoContainer: {
      backgroundColor: '#fafafa',
      padding: 2,
      paddingBottom: 35,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
      marginBottom: 20,
    },
    disposablePhoto: {
      width: 150,
      height: 150,
      borderRadius: 10,
      borderWidth: 10,
      borderColor: '#fafafa',
      backgroundColor: '#fff',
    },
    separator: {
      width: 95,
    },
    flatListContentContainer: {
      paddingHorizontal: 50,
    },
    contentCommentButton: {
      position: 'absolute',
      bottom: 5,
      right: 40,
      padding: 6,
      zIndex: 1,
    },
    commentModalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 20,
      marginTop: -200,
    },
    commentModalContent: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 20,
      alignItems: 'center',
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    commentModalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginBottom: 20,
    },
    commentInput: {
      width: '100%',
      height: 100,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 10,
      padding: 10,
      marginBottom: 20,
      textAlignVertical: 'top', // Ensures text starts at the top of the input
    },
    commentSubmitButton: {
      backgroundColor: '#79ce54',
      padding: 10,
      borderRadius: 10,
      marginBottom: 10,
      width: '100%',
      alignItems: 'center',
    },
    commentSubmitButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    commentCloseButton: {
      backgroundColor: '#de3c3c',
      padding: 10,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
    },
    commentCloseButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    contentThumbsUpButton: {
      position: 'absolute',
      bottom: 5,
      right: 75, // Adjust the position to be left of the comment button
      padding: 6,
      zIndex: 1,
    },
  });

  // START of Mariann Grace Dizon Contribution
  // Add new state for comment modal visibility and comment text
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Function to handle comment button press
  const handleCommentPress = () => {
    setShowCommentModal(true);
  };

  // Function to save a comment to the other user's document
  const saveComment = async (userId: string, attribute: string, comment: string) => {
    const db = getFirestore(app);
    const userDocRef = doc(db, "users", userId);

  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const comments = userData[`${attribute}Comments`] || [];
      comments.push(comment);

      await updateDoc(userDocRef, {
        [`${attribute}Comments`]: comments
      });
    }
  } catch (error) {
    console.error("Error saving comment: ", error);
    }
  };

  // Function to handle comment submission
  const handleCommentSubmit = () => {
    if (user2) {
      saveComment(user2.uid, currentContentType, commentText);
      console.log(`Comment submitted for ${currentContentType}:`, commentText);
      setCommentedContent(prev => {
        const newSet = new Set(prev);
        newSet.add(currentContentType);
        savePromptInteraction("comment", currentContentType, user2.uid, { commentText }); // Save comment interaction with user2's ID
        return newSet;
      });
      setShowCommentModal(false);
      setCommentText('');
    }
  };

  // Add a new state to track thumbs up status
  const [thumbsUpContent, setThumbsUpContent] = useState<Set<string>>(new Set());

  // Add a new handler for thumbs up button press
  const handleThumbsUpPress = async (contentType: string) => {
    if (user2) {
      setThumbsUpContent(prev => {
        const newSet = new Set(prev);
        if (newSet.has(contentType)) {
          console.log(`Thumbs up removed for ${contentType}`);
          newSet.delete(contentType);
          removePromptInteraction("thumbsUp", contentType, user2.uid); // Remove thumbs up interaction from Firestore
        } else {
          console.log(`Thumbs up for ${contentType}`);
          newSet.add(contentType);
          savePromptInteraction("thumbsUp", contentType, user2.uid); // Save thumbs up interaction with user2's ID
        }
        return newSet;
      });
    }
  };

  // Add this state definition at the beginning of your component
  const [currentContentType, setCurrentContentType] = useState<string>('');

  // Add this type definition near the top of the file with other interfaces/types
  interface PromptInteraction {
    interactionType: 'like' | 'comment' | 'thumbsUp';
    contentType: string;
    user2Id: string;
    timestamp: Date;
    commentText?: string;
  }

  // Update the savePromptInteraction function
  const savePromptInteraction = async (
    interactionType: PromptInteraction['interactionType'], 
    contentType: string, 
    user2Id: string, 
    additionalData: any = {}
  ) => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (currentUser) {
      const db = getFirestore(app);
      const promptInteractionsRef = collection(db, "users", currentUser.uid, "promptInteractions");
      const user2DocRef = doc(db, "users", user2Id);

      try {
        const user2Doc = await getDoc(user2DocRef);
        if (user2Doc.exists()) {
          const userData = user2Doc.data();
          const interactionCountKey = `${contentType}${interactionType.charAt(0).toUpperCase() + interactionType.slice(1)}`;
          const currentCount = userData[interactionCountKey] || 0;

          await updateDoc(user2DocRef, {
            [interactionCountKey]: currentCount + 1
          });

          console.log(`Incremented ${interactionType} count for ${contentType}`);
        }
        // Create the interaction document
        const interaction: PromptInteraction = {
          interactionType,
          contentType,
          user2Id,
          timestamp: new Date(),
          ...additionalData
        };

        // Add the document to the promptInteractions subcollection
        const docRef = await addDoc(promptInteractionsRef, interaction);
        console.log(`Saved ${interactionType} interaction for ${contentType} with user2: ${user2Id}, doc ID: ${docRef.id}`);
      } catch (error) {
        console.error("Error saving prompt interaction: ", error);
      }
    }
  };

  // Function to remove interaction from Firestore
  const removePromptInteraction = async (interactionType: string, contentType: string, user2Id: string) => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (currentUser) {
      const db = getFirestore(app);
      const promptInteractionsRef = collection(db, "users", currentUser.uid, "promptInteractions");
      const user2DocRef = doc(db, "users", user2Id);

      try {
        const user2Doc = await getDoc(user2DocRef);
        if (user2Doc.exists()) {
          const userData = user2Doc.data();
          const interactionCountKey = `${contentType}${interactionType.charAt(0).toUpperCase() + interactionType.slice(1)}`;
          const currentCount = userData[interactionCountKey] || 0;

          await updateDoc(user2DocRef, {
            [interactionCountKey]: Math.max(0, currentCount - 1)
          });

          console.log(`Decremented ${interactionType} count for ${contentType}`);
        }
        
        const q = query(promptInteractionsRef, where("interactionType", "==", interactionType), where("contentType", "==", contentType), where("user2Id", "==", user2Id));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
          console.log(`Deleted ${interactionType} interaction for ${contentType} with user2: ${user2Id}`);
        });
      } catch (error) {
        console.error("Error deleting prompt interaction: ", error);
      }
    }
  };

  // Fetch existing interactions from Firestore
  useEffect(() => {
    const fetchInteractions = async () => {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (currentUser && user2) {
        const db = getFirestore(app);
        const promptInteractionsRef = collection(db, "users", currentUser.uid, "promptInteractions");

        try {
          const q = query(promptInteractionsRef, where("user2Id", "==", user2.uid));
          const querySnapshot = await getDocs(q);
          const liked = new Set<string>();
          const commented = new Set<string>();
          const thumbsUp = new Set<string>();

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.interactionType === "like") {
              liked.add(data.contentType);
            } else if (data.interactionType === "comment") {
              commented.add(data.contentType);
            } else if (data.interactionType === "thumbsUp") {
              thumbsUp.add(data.contentType);
            }
          });

          setLikedContent(liked);
          setCommentedContent(commented);
          setThumbsUpContent(thumbsUp);
        } catch (error) {
          console.error("Error fetching prompt interactions: ", error);
        }
      }
    };

    fetchInteractions();
  }, [user2]);

  // UI rendering
  return (
    <SafeAreaView style={dynamicStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {isPaused ? (
        <View style={dynamicStyles.pausedContainer}>
          <View style={dynamicStyles.pauseIconContainer}>
          <Ionicons name="pause" size={50} color="#0e1514" />
          </View>
          <Text style={dynamicStyles.pausedTitle}>new interactions are currently paused</Text>
          <TouchableOpacity 
            style={dynamicStyles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={dynamicStyles.settingsButtonText}>
              click here to go to settings to resume interactions and see new matches 
            </Text>
          </TouchableOpacity>

          <Text style={dynamicStyles.pauseSettingsButtonText}>
              you may need to refresh the page to see update
            </Text>
        </View>
      ) : (
        <>
          {/* reset button */}
          { noMoreUsers && (
            <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
              <TouchableOpacity
                style={dynamicStyles.resetButton}
                onPress={() => {
                  console.log("Reset button pressed");
                  confirmResetMatches();
                }}
              >
                <Ionicons name="refresh" size={40} style={dynamicStyles.resetButtonIcon} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={dynamicStyles.header}>
            {user2 && (
              <>
                <View style={[
                  dynamicStyles.profileImageContainer,
                  { borderColor: getBorderColor(user2.gender) }
                ]}>
                  <Image
                    source={{ uri: user2.profileImageUrl || 'https://example.com/placeholder-profile.png' }}
                    style={dynamicStyles.profilePicture}
                  />
                  {user2AnimatedBorder && (
                    <Image
                      source={user2AnimatedBorder}
                      style={dynamicStyles.animatedBorder} // Apply the new animated border style
                    />
                  )}
                </View>
                <View style={dynamicStyles.userInfo}>
                  <Text style={dynamicStyles.name}>{user2.displayName}</Text>
                  <View style={dynamicStyles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color={getTextColor(user2.gender)} />
                    <Text style={[dynamicStyles.location, { color: getTextColor(user2.gender) }]}>{user2.location}</Text>
                  </View>
                </View>
              </>
            )}
            
          </View>

          <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
            {isLoading ? (
              <View style={dynamicStyles.messageContainer}>
                <Text style={dynamicStyles.message}>loading users ...</Text>
              </View>
            ) : user2 ? (
              <View style={dynamicStyles.content}>
                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Music Preference</Text>
                    <Text style={dynamicStyles.inputText}>
                      {Array.isArray(user2.musicPreference) 
                        ? user2.musicPreference.join(', ') 
                        : user2.musicPreference || 'No preferences set'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('musicPreference')}
                  >
                    <Ionicons 
                      name={likedContent.has('musicPreference') ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('musicPreference')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('musicPreference') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} 
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('musicPreference'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('musicPreference') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Tune of the Month</Text>
                    {user2?.tuneOfMonth ? (
                      (() => {
                        try {
                          const tuneData = JSON.parse(user2.tuneOfMonth);
                          return (
                            <View style={dynamicStyles.songContainer}>
                              {tuneData.albumArt && (
                                <Image source={{ uri: tuneData.albumArt }} style={dynamicStyles.albumArt} />
                              )}
                              <View style={dynamicStyles.songInfo}>
                                <Text style={dynamicStyles.songTitle}>{tuneData.name || 'Unknown Title'}</Text>
                                <Text style={dynamicStyles.songArtist}>{tuneData.artist || 'Unknown Artist'}</Text>
                              </View>
                            </View>
                          );
                        } catch (error) {
                          console.error('Error parsing tuneOfMonth:', error);
                          return <Text style={dynamicStyles.inputText}>{user2.tuneOfMonth}</Text>;
                        }
                      })()
                    ) : (
                      <Text style={dynamicStyles.inputText}>No tune of the month set</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('tuneOfMonth')}
                  >
                    <Ionicons 
                      name={likedContent.has('tuneOfMonth') ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('tuneOfMonth')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('tuneOfMonth') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} // Add a new style for the comment button
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('tuneOfMonth'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('tuneOfMonth') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Favorite Artists</Text>
                    {user2?.favoriteArtists ? (
                      (() => {
                        try {
                          const artistsData = JSON.parse(user2.favoriteArtists);
                          return Array.isArray(artistsData) && artistsData.length > 0 ? (
                            artistsData.map((artist) => (
                              <View key={artist.id} style={dynamicStyles.artistContainer}>
                                {artist.picture && (
                                  <Image source={{ uri: artist.picture }} style={dynamicStyles.artistImage} />
                                )}
                                <Text style={dynamicStyles.artistName}>{artist.name || 'Unknown Artist'}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={dynamicStyles.inputText}>No favorite artists set</Text>
                          );
                        } catch (error) {
                          console.error('Error parsing favoriteArtists:', error);
                          return <Text style={dynamicStyles.inputText}>{user2.favoriteArtists}</Text>;
                        }
                      })()
                    ) : (
                      <Text style={dynamicStyles.inputText}>No favorite artists set</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('favoriteArtists')}
                  >
                    <Ionicons 
                      name={likedContent.has('favoriteArtists') ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('favoriteArtists')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('favoriteArtists') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} // Add a new style for the comment button
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('favoriteArtists'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('favoriteArtists') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>


                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Favorite Album</Text>
                    {user2?.favoriteAlbum ? (
                      (() => {
                        try {
                          const albumData = JSON.parse(user2.favoriteAlbum);
                          return (
                            <View style={dynamicStyles.albumContainer}>
                              {albumData.albumArt && (
                                <Image source={{ uri: albumData.albumArt }} style={dynamicStyles.albumArt} />
                              )}
                              <View style={dynamicStyles.albumInfo}>
                                <Text style={dynamicStyles.albumName}>{albumData.name || 'Unknown Album'}</Text>
                                <Text style={dynamicStyles.albumArtist}>{albumData.artist || 'Unknown Artist'}</Text>
                              </View>
                            </View>
                          );
                        } catch (error) {
                          console.error('Error parsing favoriteAlbum:', error);
                          return <Text style={dynamicStyles.inputText}>{user2.favoriteAlbum}</Text>;
                        }
                      })()
                    ) : (
                      <Text style={dynamicStyles.inputText}>No favorite album set</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('favoriteAlbum')}
                  >
                    <Ionicons 
                      name={likedContent.has('favoriteAlbum') ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('favoriteAlbum')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('favoriteAlbum') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} // Add a new style for the comment button
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('favoriteAlbum'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('favoriteAlbum') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Favorite Performance</Text>
                    {user2.favoritePerformance ? (
                      <Image source={{ uri: user2.favoritePerformance }} style={dynamicStyles.imageInput} />
                    ) : (
                      <Text style={dynamicStyles.inputText}>No favorite performance set</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('favoritePerformance')}
                  >
                    <Ionicons 
                      name={likedContent.has('favoritePerformance') ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('favoritePerformance')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('favoritePerformance') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} // Add a new style for the comment button
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('favoritePerformance'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('favoritePerformance') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Learn More About Me</Text>
                    {user2.prompts && typeof user2.prompts === 'object' ? (
                      Object.entries(user2.prompts).map(([promptTitle, response], index) => (
                        <View key={index} style={dynamicStyles.promptContainer}>
                          <Text style={dynamicStyles.promptQuestion}>{promptTitle}</Text>
                          <Text style={dynamicStyles.promptAnswer}>{response || 'No response provided'}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={dynamicStyles.inputText}>No prompts set</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('prompts')}
                  >
                    <Ionicons 
                      name={likedContent.has('prompts') ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('prompts')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('prompts') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} // Add a new style for the comment button
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('prompts'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('prompts') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={dynamicStyles.inputContainer}>
                  <View style={dynamicStyles.inputContent}>
                    <Text style={dynamicStyles.inputLabel}>Disposable Photos</Text>
                    {disposablePhotos.length > 0 ? (
                      <FlatList
                        data={disposablePhotos}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                          <View style={dynamicStyles.disposablePhotoContainer}>
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={dynamicStyles.disposablePhoto}
                            />
                          </View>
                        )}
                        ItemSeparatorComponent={() => <View style={dynamicStyles.separator} />}
                        contentContainerStyle={dynamicStyles.flatListContentContainer}
                      />
                    ) : (
                      <Text style={dynamicStyles.inputText}>No disposable photos yet</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={dynamicStyles.contentLikeButton}
                    onPress={() => handleContentLike('myDisposables')}
                  >
                    <Ionicons
                      name={likedContent.has('myDisposables') ? "heart" : "heart-outline"}
                      size={20}
                      color="#fc6c85"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentThumbsUpButton}
                    onPress={() => handleThumbsUpPress('myDisposables')}
                  >
                    <Ionicons 
                      name={thumbsUpContent.has('myDisposables') ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.contentCommentButton} // Add a new style for the comment button
                    onPress={() => {
                      setShowCommentModal(true);
                      setCurrentContentType('myDisposables'); // Set the current content type for commenting
                    }}
                  >
                    <Ionicons 
                      name={commentedContent.has('myDisposables') ? "chatbubble" : "chatbubble-outline"} 
                      size={18} 
                      color="#fc6c85" 
                    />
                  </TouchableOpacity>
                </View>

              </View>
            ) : noMoreUsers ? (
              <View style={dynamicStyles.messageContainer}>
                <Text style={dynamicStyles.message}>no more matches for now !</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action buttons (like and dislike) */}
          <View style={dynamicStyles.actionButtons}>
            <TouchableOpacity 
              style={[dynamicStyles.actionButton, dynamicStyles.dislikeButton]}
              onPress={handleClosePress}
            >
              <Ionicons name="close" size={30} color={dislikeButtonColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[dynamicStyles.actionButton, dynamicStyles.likeButton]}
              onPress={handleHeartPress}
            >
              <Ionicons name="heart" size={26} color={likeButtonColor} />
            </TouchableOpacity>
          </View>
          {/* END of Action buttons (like and dislike) */}

          {/* START of Match modal */}
          <Modal
            transparent={true}
            visible={showMatchModal}
            onRequestClose={handleModalClose}
          >
            <Animated.View 
              style={[
                dynamicStyles.modalContainer,
                {
                  transform: [{ scale: scaleValue }],
                }
              ]}
            >
              <View style={dynamicStyles.modalContent}>
                <View style={dynamicStyles.modalHeader}>
                  <TouchableOpacity style={dynamicStyles.closeButton} onPress={handleModalClose}>
                    <Ionicons name="close" size={50} color="#1E1E1E" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={dynamicStyles.messageButton} 
                    onPress={() => {
                      setShowMatchModal(false);
                      navigateToDirectMessage(user2?.uid || '', user2?.displayName || '');
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={40} color="#1E1E1E" />
                  </TouchableOpacity>
                </View>
                <View style={dynamicStyles.modalBody}>
                  <Image
                    source={{ uri: currentUserImage || 'https://example.com/placeholder-profile.png' }}
                    style={dynamicStyles.modalProfilePic}
                  />
                  <Text style={dynamicStyles.modalTitle}>BEAT SYNCED!</Text>
                  <Image
                    source={{ uri: user2?.profileImageUrl || 'https://example.com/placeholder-profile.png' }}
                    style={dynamicStyles.modalProfilePic}
                  />
                </View>
              </View>
            </Animated.View>
          </Modal>
          {/* END of Match modal */}

          {/* START of Waiting modal */}
          <Modal
            transparent={true}
            visible={showWaitingModal}
            onRequestClose={() => setShowWaitingModal(false)}
          >
            <Animated.View 
              style={[
                dynamicStyles.waitingModalContainer,
                {
                  transform: [{ scale: waitingModalScale }],
                }
              ]}
            >
              <Ionicons name="heart" size={100} color="#fc6c85" />
              <Text style={dynamicStyles.waitingText}>Waiting for a mutual like...</Text>
            </Animated.View>
          </Modal>
          {/* END of Waiting modal */}

          {/* START of Dislike modal */}
          <Modal
            transparent={true}
            visible={showDislikeModal}
            onRequestClose={() => setShowDislikeModal(false)}
          >
            <Animated.View 
              style={[
                dynamicStyles.dislikeModalContainer,
                {
                  transform: [{ scale: dislikeModalScale }],
                }
              ]}
            >
              <Ionicons name="close" size={100} color="#de3c3c" />
              <Text style={dynamicStyles.dislikeText}>Moving to the next user...</Text>
            </Animated.View>
          </Modal>
          {/* END of Dislike modal */}

          {/* Add the comment modal */}
          <Modal
            transparent={true}
            visible={showCommentModal}
            onRequestClose={() => setShowCommentModal(false)}
          >
            <View style={dynamicStyles.commentModalContainer}>
              <View style={[
                dynamicStyles.commentModalContent,
                {backgroundColor: isDarkTheme ? '#333' : '#fff'}
              ]}>
                <Text style={[
                  dynamicStyles.commentModalTitle,
                  {color: isDarkTheme ? '#fff' : '#333'}
                ]}>Leave a Comment!</Text>
                <TextInput
                  style={[
                    dynamicStyles.commentInput,
                    {
                      backgroundColor: isDarkTheme ? '#444' : '#fff',
                      color: isDarkTheme ? '#fff' : '#333',
                      borderColor: isDarkTheme ? '#666' : '#ccc'
                    }
                  ]}
                  placeholder="Write your comment here..."
                  placeholderTextColor={isDarkTheme ? '#999' : '#666'}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline={true}
                />
                <TouchableOpacity 
                  style={dynamicStyles.commentSubmitButton}
                  onPress={handleCommentSubmit}
                >
                  <Text style={dynamicStyles.commentSubmitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.commentCloseButton}
                  onPress={() => setShowCommentModal(false)}
                >
                  <Text style={dynamicStyles.commentCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

      <BottomNavBar />
    </SafeAreaView>
  );
};
// END of UI rendering
// END of Mariann Grace Dizon Contribution

// Helper functions
const getBorderColor = (gender: string) => {
  switch (gender?.toLowerCase()) {
    case 'male':
      return '#37bdd5';
    case 'female':
      return '#fc6c85';
    default:
      return '#333';
  }
};

const getTextColor = (gender: string) => {
  switch (gender?.toLowerCase()) {
    case 'male':
      return '#37bdd5';
    case 'female':
      return '#fc6c85';
    default:
      return '#333';
  }
};
export default Match;
