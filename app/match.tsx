// match.tsx
// Mariann Grace Dizon Reyna Aguirre and Maxwell Guillermo

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableOpacity, ScrollView, Modal, Animated, Alert } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from './match-algorithm'; // import isMatch and User from match-algorithm.tsx
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig'; 
import { fetchCompatibleUsers } from './match-algorithm'; // for match algorithm
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"; // to store matches 


// START of to updating matches hashmap for current user
// Reyna Aguirre Contribution
const updateUserMatch = async (currentUserId: string, matchedUserId: string, status: "liked" | "disliked") => {
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

  // Using useRouter hook to get the router instance for navigation
  const router = useRouter();

  // Animation values for scale and opacity
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
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
        setCompatibleUsers(compatibleUsers); // fetch compatible users using the algorithm

        if (compatibleUsers.length > 0) {
          setUser2(compatibleUsers[0]);
          setCurrentIndex(0);  // Start at the first user in compatibleUsers
          setNoMoreUsers(false);
        } else {
          setNoMoreUsers(true);
        }
      }
      setIsLoading(false);
    };
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
  const animateModal = (visible: boolean) => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: visible ? 1 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  // END of modal animation functions
  // END of Mariann Grace Dizon Contribution
    
  // START of heart button press handler
  // START of Mariann Grace Dizon Contribution
  // Handler for when the heart button is pressed
  const handleHeartPress = async () => {
    if (user2) {
      setLikeButtonColor('#fc6c85'); // Change to pink when liked
      // setShowMatchModal(true);
      // animateModal(true);

      console.log("heart pressed");
  
      // Call updateUserMatch to mark user2 as "liked" by user1
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (currentUser) {
        await updateUserMatch(currentUser.uid, user2.uid, "liked");
      }

      // check if user2 has liked user1
      const db = getFirestore(app);
      const user2DocRef = doc(db, "users", user2.uid);
      const user2DocSnap = await getDoc(user2DocRef);

      if (user2DocSnap.exists()) {
        const user2Data = user2DocSnap.data() as User;
        const user2MatchStatus = currentUser ? user2Data.matches?.[currentUser.uid] : undefined;

        // If both users liked each other, show the match modal
        if (user2MatchStatus === "liked" && currentUser) {
          console.log(`It's a match! ${currentUser.displayName} and ${user2.displayName} liked each other.`);
          setShowMatchModal(true);
          animateModal(true);
        } else {
          console.log(`No mutual like yet. ${user2.displayName} has not liked ${currentUser?.displayName || currentUser?.uid}`);
          fetchNextUser();
          setLikeButtonColor('#fff8f0');
        }
      } else {
        console.error("User2 document not found in Firestore.");
      }
    }
  };
  // END of heart button press handler
  // END of Mariann Grace Dizon Contribution
  
  // START of close button press handler
  // START of Mariann Grace Dizon Contribution
  const handleClosePress = async () => {
    if (user2) {
      setDislikeButtonColor('#0e1514'); // Change to red when disliked
      console.log("close pressed");
      // Call updateUserMatch to mark user2 as "disliked" by user1
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateUserMatch(currentUser.uid, user2.uid, "disliked");
      }
  
      fetchNextUser(); // Load the next user profile
      setTimeout(() => {
        setDislikeButtonColor('#fff8f0'); // Change back to original color
      }, 1000);
    }
  };
  // END of close button press handler
  // END of Mariann Grace Dizon Contribution

  // START of match reset functions
  // START of Reyna Aguirre Contribution
  const confirmResetMatches = () => {
    Alert.alert(
      "Confirm Reset Matches",
      "are you sure you want to reset current match statuses?",
      [
        {
          text: "cancel",
          style: "cancel"
        },
        {
          text: "yes",
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
    animateModal(false);
    setShowMatchModal(false);
    fetchNextUser(); // Load the next user profile
  };
  // END of modal close handler
  // END of Mariann Grace Dizon Contribution

  // START of content like handler
  // START of Maxwell Guillermo  Contribution  
  const handleContentLike = (contentType: string) => {
    setLikedContent(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentType)) {
        newSet.delete(contentType);
      } else {
        newSet.add(contentType);
      }
      return newSet;
    });
  };
  // END of content like handler
  // END of Maxwell Guillermo Contribution  

  // UI rendering
  // Mariann Grace Dizon
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* reset button */}
      { noMoreUsers && (
        <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              console.log("Reset button pressed");
              confirmResetMatches();
            }}
          >
            <Ionicons name="refresh" size={40} color="#0e1514" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.header}>
        {user2 && (
          <>
            <View style={[
              styles.profileImageContainer,
              { borderColor: getBorderColor(user2.gender) }
            ]}>
              <Image
                source={{ uri: user2.profileImageUrl || 'https://example.com/placeholder-profile.png' }}
                style={styles.profilePicture}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{user2.displayName}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color={getTextColor(user2.gender)} />
                <Text style={[styles.location, { color: getTextColor(user2.gender) }]}>{user2.location}</Text>
              </View>
            </View>
          </>
        )}
        
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.messageContainer}>
            <Text style={styles.message}>loading users ...</Text>
          </View>
        ) : user2 ? (
          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Music Preference</Text>
                <Text style={styles.inputText}>
                  {Array.isArray(user2.musicPreference) 
                    ? user2.musicPreference.join(', ') 
                    : user2.musicPreference || 'No preferences set'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.contentLikeButton}
                onPress={() => handleContentLike('musicPreference')}
              >
                <Ionicons 
                  name={likedContent.has('musicPreference') ? "heart" : "heart-outline"} 
                  size={18} // Reduced size from 24 to 18
                  color="#fc6c85" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Favorite Performance</Text>
                {user2.favoritePerformance ? (
                  <Image source={{ uri: user2.favoritePerformance }} style={styles.imageInput} />
                ) : (
                  <Text style={styles.inputText}>No favorite performance set</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.contentLikeButton}
                onPress={() => handleContentLike('favoritePerformance')}
              >
                <Ionicons 
                  name={likedContent.has('favoritePerformance') ? "heart" : "heart-outline"} 
                  size={18} 
                  color="#fc6c85" 
                />
              </TouchableOpacity>
            </View>

            {/* Add more sections here similar to profile.tsx if needed */}
          </View>
        ) : noMoreUsers ? (
          <View style={styles.messageContainer}>
            <Text style={styles.message}>no more matches for now !</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Action buttons (like and dislike) */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={handleClosePress}
        >
          <Ionicons name="close" size={40} color={dislikeButtonColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleHeartPress}
        >
          <Ionicons name="heart" size={40} color={likeButtonColor} />
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
            styles.modalContainer,
            {
              opacity: opacityValue,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleValue }],
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
                <Ionicons name="close" size={50} color="#1E1E1E" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.messageButton} 
                onPress={() => {
                  setShowMatchModal(false);
                  navigateToDirectMessage(user2?.uid || '', user2?.displayName || '');
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={40} color="#1E1E1E" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Image
                source={{ uri: currentUserImage || 'https://example.com/placeholder-profile.png' }}
                style={styles.modalProfilePic}
              />
              <Text style={styles.modalTitle}>BEAT SYNCED!</Text>
              <Image
                source={{ uri: user2?.profileImageUrl || 'https://example.com/placeholder-profile.png' }}
                style={styles.modalProfilePic}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
      {/* END of Match modal */}

      <BottomNavBar />
    </SafeAreaView>
  );
};
// END of Mariann Grace Dizon Contribution
// END of UI rendering

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  header: {
    flexDirection: 'row',
    paddingLeft: 40,
    paddingRight: 30,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileImageContainer: {
    borderWidth: 3,
    borderRadius: 50,
    overflow: 'hidden',
    width: 85,
    height: 85,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    marginLeft: 20,
  },
  name: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
  },
  resetButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10, // Ensure it's above other elements
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingTop: 20,
    paddingLeft: 40,
    paddingRight: 30,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
  },
  inputContent: {
    marginBottom: 20, // Reduced from 30 to 20 due to smaller icon
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  inputText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  imageInput: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
  actionButton: {
    padding: 15,
    borderRadius: 35,
    width: 70,
    height: 70,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#79ce54',
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
    justifyContent: 'center', // Changed from 'space-between' to 'center'
    flex: 1,
  },
  modalTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1E1E1E',
    textAlign: 'center',
    marginVertical: 30, // Added margin to create some space around the text
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
  },
  musicPreference: {
    marginBottom: 20,
  },
  genre: {
    fontSize: 22,
    color: '#000',
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
    bottom: 5,
    right: 5,
    padding: 8, // Reduced padding for smaller touch target
    zIndex: 1,
  },
});

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