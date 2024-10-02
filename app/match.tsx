// match.tsx
// Mariann Grace Dizon and Reyna Aguirre

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableOpacity, ScrollView, Modal, Animated } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isMatch, User } from './match-algorithm'; // import isMatch and User from match-algorithm.tsx
import { getFirestore, collection, getDoc, getDocs, query, limit, doc, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig'; 


// START of Tune of the Month UI 
// START of Reyna Aguirre Contribution
interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}
// END of Tune of the Month UI 
// END of Reyna Aguirre Contribution

// Match component definition
const Match = () => {
  // State to control the visibility of the match modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  // State to manage the color of the like and dislike buttons
  const [likeButtonColor, setLikeButtonColor] = useState('#1E1E1E');
  const [dislikeButtonColor, setDislikeButtonColor] = useState('#1E1E1E');
  // Using useRouter hook to get the router instance for navigation
  const router = useRouter();
  // Refs for animation values
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const [tuneOfMonth, setTuneOfMonth] = useState<Song | null>(null); // for Tune of the Month

  //  START of fetch two users from Firestore
  //  START of Reyna Aguirre Contribution
  const [user1, setUser1] = useState<User | null>(null);
  const [user2, setUser2] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const db = getFirestore(app);
      const usersRef = collection(db, "users");
      
      // Fetch current user (user1)
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const user1Doc = await getDoc(doc(usersRef, currentUser.uid));
        if (user1Doc.exists()) {
          const userData = user1Doc.data() as User;
          setUser1(userData);
          
          // Parse tuneOfMonth if it exists
          if (userData.tuneOfMonth) {
            try {
              const parsedTuneOfMonth = JSON.parse(userData.tuneOfMonth);
              setTuneOfMonth(parsedTuneOfMonth);
            } catch (error) {
              console.error('Error parsing tuneOfMonth:', error);
              setTuneOfMonth(null);
            }
          } else {
            setTuneOfMonth(null);
          }
        }
      }

      // Fetch a random user (user2)
      await fetchNextUser();
    };

    fetchUsers();
  }, []);
  //  END of fetch two users from Firestore
  //  END of Reyna Aguirre Contribution

  // Handler for when the heart button is pressed
  const handleHeartPress = async () => {
    if (user1 && user2) {
      const matched = await isMatch(user1, user2);  // check if users match
      if (matched) {
        setLikeButtonColor('#fc6c85'); // Change to pink
        setShowMatchModal(true);
        animateModal(true);
      } else {
        console.log("No match");
        fetchNextUser(); // Load the next user profile if no match
      }
    } else {
      console.log("User data not available");
    }
  };

  // Handler for when the message button is pressed in the modal
  const handleMessagePress = () => {
    // Navigate to messages screen
    router.push('/messages');
  };

  // Handler for when the message icon button is pressed on the top right
  const handleMessageIconPress = () => {
    // Navigate to messages screen
    router.push('/messages');
  };

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

  // START of Reyna Aguirre Contribution
  const fetchNextUser = async () => {
    const db = getFirestore(app);
    const usersRef = collection(db, "users");
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Query for users that are not the current user
      const querySnapshot = await getDocs(query(usersRef, limit(50))); // Fetch more users to increase randomness

      const filteredUsers = querySnapshot.docs
        .map((doc) => doc.data() as User)
        .filter((user) => user.uid !== currentUser.uid); // Filter out the current user

      if (filteredUsers.length > 0) {
        // Get a random user from the filtered list
        const randomIndex = Math.floor(Math.random() * filteredUsers.length);
        setUser2(filteredUsers[randomIndex]);
      } else {
        console.log("No more users to display");
        // Handle the case when there are no more users to display
      }
    }
  };
  // END of Reyna Aguirre Contribution
  
  // Effect to reset like button color when modal is closed
  useEffect(() => {
    if (!showMatchModal) {
      setLikeButtonColor('#1E1E1E'); // Change back to original color
    }
  }, [showMatchModal]);

  // Function to handle the close button press
  const handleClosePress = () => {
    setDislikeButtonColor('#de3c3c'); // Change to orange
    fetchNextUser(); // Load the next user profile
    setTimeout(() => {
      setDislikeButtonColor('#1E1E1E'); // Change back to original color
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ alignItems: 'center' }} 
      >
        {user2 ? (
          <>
            <View style={styles.header}>
              <Image
                source={{ uri: user2.profileImageUrl }}
                style={styles.profilePic}
              />
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{user2.displayName}</Text>
                <Text style={styles.location}>{user2.location}</Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.sectionTitle}>Music Preference</Text>
              <Text style={styles.genre}>
                {Array.isArray(user2.musicPreference) 
                  ? user2.musicPreference.join('      ') 
                  : user2.musicPreference || 'No preferences set'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.sectionTitle}>Tune of the Month</Text>
              <Text style={styles.tuneOfMonth}>{user2.tuneOfMonth}</Text>
            </View>
          </>
        ) : (
          <View>
            <Text>Loading...</Text>
          </View>
        )}
      </ScrollView>

      {/* Action buttons (like and dislike) */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.dislikeButton]} 
          onPress={handleClosePress}
        >
          <Ionicons name="close" size={50} color={dislikeButtonColor} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]} 
          onPress={handleHeartPress}
        >
          <Ionicons name="heart" size={40} color={likeButtonColor} />
        </TouchableOpacity>
      </View>

      {/* Match modal */}
      <Modal
        transparent={true}
        visible={showMatchModal}
        onRequestClose={() => {
          animateModal(false);
          setShowMatchModal(false);
        }}
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
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowMatchModal(false)}>
                <Ionicons name="close" size={50} color="#1E1E1E" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.messageButton} 
                onPress={() => {
                  setShowMatchModal(false);
                  router.push('/messages');
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={40} color="#1E1E1E" />
              </TouchableOpacity>
            </View>
            <View style={styles.profilePicContainer}>
              <Image
                source={{ uri: user1?.profileImageUrl || 'https://example.com/placeholder-profile.png' }}
                style={styles.profilePic}
              />
              <Image
                source={{ uri: user2?.profileImageUrl || 'https://example.com/placeholder-profile.png' }}
                style={styles.profilePic}
              />
            </View>
            <Text style={styles.modalTitle}>BEAT SYNCED!</Text>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Bottom navigation bar */}
      <BottomNavBar />
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  content: {
    flex: 1,
    padding: 30,
  },
  header: {
    alignItems: 'center',
  },
  profilePic: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 25,
  },
  name: {
    fontSize: 35, 
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0e1514',
    marginTop: 10,
  },
  age: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: 'rgba(14,21,20,0.5)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  tuneOfMonth: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#37bdd5',
  },
  sectionContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
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
    position: 'absolute',
    left: 20,
    bottom: 30,
  },
  likeButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
  },
  spacer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#79ce54',
    padding: 20,
    borderRadius: 40,
    alignItems: 'center',
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 38,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 20,
    color:'#1E1E1E',
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
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
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
});

export default Match;

// END of Mariann Grace Dizon Contribution