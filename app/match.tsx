// match.tsx
// Mariann Grace Dizon and Reyna Aguirre

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableOpacity, ScrollView, Modal, Animated } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from './match-algorithm'; // import isMatch and User from match-algorithm.tsx
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig'; 
import { fetchCompatibleUsers } from './match-algorithm'; // for match algorithm
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';


// Match component definition
const Match = () => {
  const [showMatchModal, setShowMatchModal] = useState(false);   // State to control the visibility of the match modal
  const [likeButtonColor, setLikeButtonColor] = useState('#1E1E1E');   // State to manage the color of the like and dislike buttons
  const [dislikeButtonColor, setDislikeButtonColor] = useState('#1E1E1E'); // dislike button color
  
  // Using useRouter hook to get the router instance for navigation
  const router = useRouter();

  // functions for animation values
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;


  //  START of fetch two users from Firestore
  //  START of Reyna Aguirre Contribution
  const [user1, setUser1] = useState<User | null>(null); // current user
  const [user2, setUser2] = useState<User | null>(null); // random user
  const [noMoreUsers, setNoMoreUsers] = useState(false); // variable to check if no more users
  const [compatibleUsers, setCompatibleUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
    
      // fetch current user (user1)
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      setIsLoading(true);

      if (currentUser) {
        const fetchedUsers = await fetchCompatibleUsers();
        console.log("FETCHED USERS:", fetchedUsers.map(user => user.displayName));
        setCompatibleUsers(fetchedUsers); // fetch compatible users using the algorithm

        if (fetchedUsers.length > 0) {
          setUser1(fetchedUsers[0]);
          setUser2(fetchedUsers.length > 1 ? fetchedUsers[1] : null);
          setCurrentIndex(1);
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
        setCurrentIndex(prevIndex => prevIndex + 1);
        setUser2(compatibleUsers[currentIndex + 1]);
      } else {
        setUser2(null);
        setNoMoreUsers(true);
      }
    };
    // END of fetch a random user (user2) contribution
    // END of Reyna Aguirre Contribution
  

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
    
  // Handler for when the heart button is pressed
  const handleHeartPress = async () => {
    if (user1 && user2) {
      if (user1 && user2) {
        setLikeButtonColor('#fc6c85'); // Change to pink when liked
        setShowMatchModal(true);
        animateModal(true);
      } else {
        console.log("No match");
        fetchNextUser(); // Load the next user profile if no match
      }
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

  // Effect to reset like button color when modal is closed
  useEffect(() => {
    if (!showMatchModal) {
      setLikeButtonColor('#1E1E1E'); // Change back to original color
    }
  }, [showMatchModal]);

  // Function to handle the close button press
  const handleClosePress = () => {
    setDislikeButtonColor('#de3c3c'); // change to red
    fetchNextUser(); // Load the next user profile
    setTimeout(() => {
      setDislikeButtonColor('#1E1E1E'); // Change back to original color
    }, 1000);
  };

  // UI rendering
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* User2 Profile */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ alignItems: 'center' }} 
      >
        {isLoading ? (
          <View>
            <Text style={styles.message}>loading users ...</Text>
          </View>
        ) : user2 ? (
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
              <Text style={styles.sectionTitle}>Favorite Performance</Text>
              <Image
                source={{ uri: user2.favoritePerformance }}
                style={styles.promptImage}
              />
            </View>
          </>
        ) : noMoreUsers ? (
          <View>
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
  message: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
    fontStyle: 'italic',
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
  promptImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
    marginBottom: 25,
    padding: 20,
  },
});

export default Match;