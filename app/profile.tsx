// profile.tsx
// Mariann Grace Dizon

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import BottomNavBar from '../components/BottomNavBar';

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

  const handleSettingsPress = () => {
    router.push('/profilesettings');
  };

  const handleEditPress = () => {
    router.push('/editprofile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user.profileImageUrl }}
          style={styles.profilePicture}
        />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.location}>{user.location}</Text>
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
            {tuneOfMonthLoaded && tuneOfMonth && (
              <View style={styles.songContainer}>
                <Image source={{ uri: tuneOfMonth.albumArt }} style={styles.albumArt} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{tuneOfMonth.name}</Text>
                  <Text style={styles.songArtist}>{tuneOfMonth.artist}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>My Favorite Performance</Text>
            {favoritePerformance ? (
              <Image source={{ uri: favoritePerformance }} style={styles.imageInput} />
            ) : (
              <Text>No favorite performance set</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Music Artist/s</Text>
            <Text>{favoriteMusicArtists}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Album</Text>
            <Text>{favoriteAlbum}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>I Listen to Music to</Text>
            <Text>{listenTo}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>If I Could See Any Artist, Dead or Alive, It Would Be</Text>
            <Text>{artistToSee}</Text>
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
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 25,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 40,
    borderWidth: 7,
    borderColor: '#fc6c85',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#fc6c85',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    paddingTop: 15,
    paddingBottom: 25,
    paddingRight: 7,
  },
  content: {
    paddingTop: 20,
    paddingLeft: 70,
    paddingRight: 70,
  },
  inputContainer: {
    marginBottom: 35,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fba904',
  },
  imageInput: {
    width: 250,
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
    marginLeft: 20,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  songArtist: {
    fontSize: 13,
    color: '#666',
  },
});