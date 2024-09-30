// match.tsx
// Mariann Grace Dizon and Reyna Aguirre


// START of Mariann Grace Dizon Contribution
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableOpacity, ScrollView, Modal, Dimensions, Animated } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isMatch, User } from './match-algorithm'; // import isMatch and User from match-algorithm.tsx
import { getFirestore, collection, getDoc, getDocs, query, limit, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig'; 
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
          setUser1(user1Doc.data() as User);
        }
      }

      // Fetch a random user (user2)
      const querySnapshot = await getDocs(query(usersRef, limit(1)));
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUser?.uid) {
          setUser2(doc.data() as User);
        }
      });
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
        setLikeButtonColor('#e66cab'); // Change to pink
        setShowMatchModal(true);
        animateModal(true);
      } else {
        console.log("No match");
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

  // Effect to reset like button color when modal is closed
  useEffect(() => {
    if (!showMatchModal) {
      setLikeButtonColor('#1E1E1E'); // Change back to original color
    }
  }, [showMatchModal]);

  // Function to handle the close button press
  const handleClosePress = () => {
    setDislikeButtonColor('#fba904'); // Change to orange
    // Here you would typically load the next user profile
    // For this example, we'll use a timeout to simulate that
    setTimeout(() => {
      setDislikeButtonColor('#1E1E1E'); // Change back to original color
    }, 1000); // Adjust this time as needed
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.content}>
        {/* Header section with profile picture and name */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://example.com/profile-pic.jpg' }}
            style={styles.profilePic}
          />
          <Text style={styles.name}>Owen Stacy</Text>
        </View>
        
        {/* Tune of the month section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tune of the month</Text>
          <View style={styles.tuneContainer}>
            <Image
              source={{ uri: 'https://example.com/album-cover.jpg' }}
              style={styles.albumCover}
            />
            <View style={styles.tuneInfo}>
              <Text style={styles.tuneTitle}>Just Give Them All Some Fir (Remix)</Text>
              <Text style={styles.tuneArtist}>by Steve Aoki & Linkin Park</Text>
            </View>
          </View>
        </View>
        
        {/* Favorite performance section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My favorite performance (so far)</Text>
          <Image
            source={{ uri: 'https://example.com/performance-pic.jpg' }}
            style={styles.performancePic}
          />
        </View>
        
        {/* Music listening reason section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I listen to music to</Text>
          <Text style={styles.musicReason}>Forget about it all and to lose myself during New York City</Text>
        </View>
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
                source={{ uri: 'https://example.com/placeholder-profile.png' }}
                style={styles.profilePic}
              />
              <Image
                source={{ uri: 'https://example.com/placeholder-profile.png' }}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tuneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumCover: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  tuneInfo: {
    marginLeft: 10,
  },
  tuneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tuneArtist: {
    fontSize: 12,
    color: '#666',
  },
  performancePic: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  musicReason: {
    fontSize: 14,
    color: '#333',
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
    marginBottom: 200,
  },
  modalTitle: {
    fontSize: 38,
    fontWeight: '800',
    marginTop: 'auto',
    marginBottom: 300,
    color:'#1E1E1E',
  },
  messageButton: {
    padding: 10,
  },
  closeButton: {
    padding: 10,
  },
  profilePicContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.2,
  },
  decorationItem: {
    margin: 10,
  },
  messageIcon: {
    position: 'absolute',
    top: 63,
    right: 20,
    padding: 10,
  },
});

export default Match;

// END of Mariann Grace Dizon Contribution