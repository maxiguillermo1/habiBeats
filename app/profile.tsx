// profile.tsx
// Mariann Grace Dizon

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import BottomNavBar from '../components/BottomNavBar';
import { registerForPushNotificationsAsync } from '../scripts/notificationHandler';
import { updateDoc } from 'firebase/firestore';

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: 'Name not set',
    location: 'Location not set',
    profileImageUrl: '',
  });

  const [tuneOfMonth, setTuneOfMonth] = useState<Song | null>(null);
  const [favoritePerformance, setFavoritePerformance] = useState('');
  const [listenTo, setListenTo] = useState('');
  const [favoriteMusicArtists, setFavoriteMusicArtists] = useState('');
  const [favoriteAlbum, setFavoriteAlbum] = useState('');
  const [artistToSee, setArtistToSee] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [tuneOfMonthLoaded, setTuneOfMonthLoaded] = useState(false);
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [nextConcert, setNextConcert] = useState('');
  const [unforgettableExperience, setUnforgettableExperience] = useState('');
  const [favoriteAfterPartySpot, setFavoriteAfterPartySpot] = useState('');
  const [userGender, setUserGender] = useState('');

  useEffect(() => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const userDocRef = doc(db, 'users', currentUser.uid);

      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUser({
            name: `${userData.firstName} ${userData.lastName}`,
            location: userData.location || 'Location not set',
            profileImageUrl: userData.profileImageUrl || '',
          });

          // Set the user's gender
          setUserGender(userData.gender || 'other');

          // Ensure favoriteGenre is set
          setFavoriteGenre(userData.favoriteGenre || '');

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
          setTuneOfMonthLoaded(true);
          setFavoritePerformance(userData.favoritePerformance || '');
          setListenTo(userData.listenTo || '');
          setFavoriteMusicArtists(userData.favoriteMusicArtists || '');
          setFavoriteAlbum(userData.favoriteAlbum || '');
          setArtistToSee(userData.artistToSee || '');
          setNextConcert(userData.nextConcert || '');
          setUnforgettableExperience(userData.unforgettableExperience || '');
          setFavoriteAfterPartySpot(userData.favoriteAfterPartySpot || '');
        }
      }, (error) => {
        console.error('Error fetching user data:', error);
        setTuneOfMonthLoaded(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching user data:', error);
      setTuneOfMonthLoaded(true);
    }

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Register for push notifications
  useEffect(() => {
    console.log("Registering for push notifications");
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Push token:", token);
        // Save the token to the user's document in Firestore
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          updateDoc(userDocRef, { pushToken: token });
        }
      }
    });
  }, []);

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleEditPress = () => {
    router.push('/editprofile');
  };

  // Add this function to determine border color based on gender
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

  // Add this function to determine text color based on gender
  const getTextColor = (gender: string) => {
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
      <View style={styles.header}>
        {user.profileImageUrl ? (
          <View style={[
            styles.profileImageContainer,
            { borderColor: getBorderColor(userGender) }
          ]}>
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.profilePicture}
            />
          </View>
        ) : (
          <View style={[
            styles.profileImageContainer,
            styles.placeholderImage,
            { borderColor: getBorderColor(userGender) }
          ]} />
        )}
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={getTextColor(userGender)} />
            <Text style={[styles.location, { color: getTextColor(userGender) }]}>{user.location}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Ionicons name="create-outline" size={25} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={25} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tune of the Month</Text>
            <View style={styles.inputContent}>
              {tuneOfMonthLoaded && tuneOfMonth && tuneOfMonth.albumArt ? (
                <View style={styles.songContainer}>
                  <Image source={{ uri: tuneOfMonth.albumArt }} style={styles.albumArt} />
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{tuneOfMonth.name}</Text>
                    <Text style={styles.songArtist}>{tuneOfMonth.artist}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.inputText}>No tune of the month set</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>My Favorite Performance</Text>
            <View style={styles.inputContent}>
              {favoritePerformance ? (
                <Image source={{ uri: favoritePerformance }} style={styles.imageInput} />
              ) : (
                <Text style={styles.inputText}>No favorite performance set</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Music Artist/s</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{favoriteMusicArtists || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Album</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{favoriteAlbum || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>I Listen to Music to</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{listenTo || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>If I Could See Any Artist, Dead or Alive, It Would Be</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{artistToSee || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Music Genre</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{favoriteGenre || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Next Concert or Event</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{nextConcert || 'No upcoming concert set'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Unforgettable Concert Experience</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{unforgettableExperience || 'No experience shared'}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Post-Event Hangout Spot</Text>
            <View style={styles.inputContent}>
              <Text style={styles.inputText}>{favoriteAfterPartySpot || 'No spot shared'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomNavBarContainer, isKeyboardVisible && { paddingBottom: 0 }]}>
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 500,
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
    borderRadius: 50, // Half of the width and height
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
    marginLeft: 15,
  },
  name: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
  },
  settingsButton: {
    paddingTop: 15,
    paddingBottom: 25,
    paddingRight: 7,
  },
  content: {
    paddingTop: 20,
    paddingLeft: 50,
    paddingRight: 50,
  },
  inputContainer: {
    marginBottom: 35,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputContent: {
    borderWidth: 3,
    borderColor: '#f7e9da',
    borderRadius: 10,
    padding: 15,
  },
  inputText: {
    fontSize: 14,
    color: '#fba904',
  },
  imageInput: {
    width: '100%',
    height: 250,
  },
  bottomNavBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 80,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    paddingTop: 15,
    paddingBottom: 25,
    paddingRight: 10,
  },
  albumArt: {
    width: 80,
    height: 80,
  },
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 90,
  },
  songInfo: {
    marginLeft: 10,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fba904',
  },
  songArtist: {
    fontSize: 10,
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderImage: {
    backgroundColor: '#f7e9da',
  },
});