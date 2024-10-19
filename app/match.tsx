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
  const [showWaitingModal, setShowWaitingModal] = useState(false); // New state for waiting modal
  const [showDislikeModal, setShowDislikeModal] = useState(false); // New state for dislike modal

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
      }

      const db = getFirestore(app);
      const user2DocRef = doc(db, "users", user2.uid);
      const user2DocSnap = await getDoc(user2DocRef);

      if (user2DocSnap.exists()) {
        const user2Data = user2DocSnap.data() as User;
        const user2MatchStatus = currentUser ? user2Data.matches?.[currentUser.uid] : undefined;

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
    animateModal(false, scaleValue);
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
                <Text style={styles.inputLabel}>Tune of the Month</Text>
                {user2?.tuneOfMonth ? (
                  (() => {
                    try {
                      const tuneData = JSON.parse(user2.tuneOfMonth);
                      return (
                        <View style={styles.songContainer}>
                          {tuneData.albumArt && (
                            <Image source={{ uri: tuneData.albumArt }} style={styles.albumArt} />
                          )}
                          <View style={styles.songInfo}>
                            <Text style={styles.songTitle}>{tuneData.name || 'Unknown Title'}</Text>
                            <Text style={styles.songArtist}>{tuneData.artist || 'Unknown Artist'}</Text>
                          </View>
                        </View>
                      );
                    } catch (error) {
                      console.error('Error parsing tuneOfMonth:', error);
                      return <Text style={styles.inputText}>{user2.tuneOfMonth}</Text>;
                    }
                  })()
                ) : (
                  <Text style={styles.inputText}>No tune of the month set</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.contentLikeButton}
                onPress={() => handleContentLike('tuneOfMonth')}
              >
                <Ionicons 
                  name={likedContent.has('tuneOfMonth') ? "heart" : "heart-outline"} 
                  size={18} 
                  color="#fc6c85" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Favorite Artists</Text>
                {user2?.favoriteArtists ? (
                  (() => {
                    try {
                      const artistsData = JSON.parse(user2.favoriteArtists);
                      return Array.isArray(artistsData) && artistsData.length > 0 ? (
                        artistsData.map((artist) => (
                          <View key={artist.id} style={styles.artistContainer}>
                            {artist.picture && (
                              <Image source={{ uri: artist.picture }} style={styles.artistImage} />
                            )}
                            <Text style={styles.artistName}>{artist.name || 'Unknown Artist'}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.inputText}>No favorite artists set</Text>
                      );
                    } catch (error) {
                      console.error('Error parsing favoriteArtists:', error);
                      return <Text style={styles.inputText}>{user2.favoriteArtists}</Text>;
                    }
                  })()
                ) : (
                  <Text style={styles.inputText}>No favorite artists set</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.contentLikeButton}
                onPress={() => handleContentLike('favoriteArtists')}
              >
                <Ionicons 
                  name={likedContent.has('favoriteArtists') ? "heart" : "heart-outline"} 
                  size={18} 
                  color="#fc6c85" 
                />
              </TouchableOpacity>
            </View>


            <View style={styles.inputContainer}>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Favorite Album</Text>
                {user2?.favoriteAlbum ? (
                  (() => {
                    try {
                      const albumData = JSON.parse(user2.favoriteAlbum);
                      return (
                        <View style={styles.albumContainer}>
                          {albumData.albumArt && (
                            <Image source={{ uri: albumData.albumArt }} style={styles.albumArt} />
                          )}
                          <View style={styles.albumInfo}>
                            <Text style={styles.albumName}>{albumData.name || 'Unknown Album'}</Text>
                            <Text style={styles.albumArtist}>{albumData.artist || 'Unknown Artist'}</Text>
                          </View>
                        </View>
                      );
                    } catch (error) {
                      console.error('Error parsing favoriteAlbum:', error);
                      return <Text style={styles.inputText}>{user2.favoriteAlbum}</Text>;
                    }
                  })()
                ) : (
                  <Text style={styles.inputText}>No favorite album set</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.contentLikeButton}
                onPress={() => handleContentLike('favoriteAlbum')}
              >
                <Ionicons 
                  name={likedContent.has('favoriteAlbum') ? "heart" : "heart-outline"} 
                  size={18} 
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

            <View style={styles.inputContainer}>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Written Prompts</Text>
                {user2.prompts && typeof user2.prompts === 'object' ? (
                  Object.entries(user2.prompts).map(([promptTitle, response], index) => (
                    <View key={index} style={styles.promptContainer}>
                      <Text style={styles.promptQuestion}>{promptTitle}</Text>
                      <Text style={styles.promptAnswer}>{response || 'No response provided'}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.inputText}>No prompts set</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.contentLikeButton}
                onPress={() => handleContentLike('prompts')}
              >
                <Ionicons 
                  name={likedContent.has('prompts') ? "heart" : "heart-outline"} 
                  size={18} 
                  color="#fc6c85" 
                />
              </TouchableOpacity>
            </View>

            
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
          <Ionicons name="close" size={30} color={dislikeButtonColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]}
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
            styles.modalContainer,
            {
              transform: [{ scale: scaleValue }],
              backgroundColor: '#fff8f0',
            }
          ]}
        >
          <View style={styles.modalContent}>
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
            styles.waitingModalContainer,
            {
              transform: [{ scale: waitingModalScale }],
              backgroundColor: '#fff8f0',
            }
          ]}
        >
          <Ionicons name="heart" size={100} color="#fc6c85" />
          <Text style={styles.waitingText}>Waiting for a mutual like...</Text>
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
            styles.dislikeModalContainer,
            {
              transform: [{ scale: dislikeModalScale }],
              backgroundColor: '#fff8f0',
            }
          ]}
        >
          <Ionicons name="close" size={100} color="#de3c3c" />
          <Text style={styles.dislikeText}>Moving to the next user...</Text>
        </Animated.View>
      </Modal>
      {/* END of Dislike modal */}

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
    color: '#333',
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingTop: 14,
    paddingLeft: 55,
    paddingRight: 55,
    paddingBottom: 23,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
  },
  inputContent: {
    marginBottom: 20, // Adjusted for smaller icon
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
    color: '#000',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 32,
    position: 'absolute',
    bottom: 80,
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
    padding: 6,
    zIndex: 1,
  },
  promptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 6,
    marginLeft: 10,
    marginRight: 10,
  },
  promptQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  promptAnswer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  promptTitleContainer: {
    // Add your desired styles here
    marginBottom: 5,
  },
  promptResponseContainer: {
    // Add your desired styles here
    marginBottom: 5,
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
    color: '#333',
  },
  songArtist: {
    marginTop: 1,
    fontSize: 11,
    color: '#333',
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
    color: '#333',
  },
  albumArtist: {
    marginTop: 1,
    fontSize: 11,
    color: '#666',
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
    color: '#333',
  },
  waitingModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  waitingText: {
    fontSize: 20,
    color: '#fba904',
    marginTop: 20,
  },
  dislikeModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dislikeText: {
    fontSize: 20,
    color: '#fba904',
    marginTop: 20,
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