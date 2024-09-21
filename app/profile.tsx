// profile.tsx
// Mariann Grace Dizon

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity, ScrollView, Animated, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import BottomNavBar from '../components/BottomNavBar';
import { auth, db, storage } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import SearchSong from '../components/search-song';

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
  const [hasChanges, setHasChanges] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [favoriteMusicArtists, setFavoriteMusicArtists] = useState('');
  const [favoriteAlbum, setFavoriteAlbum] = useState('');
  const [artistToSee, setArtistToSee] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [tuneOfMonthLoaded, setTuneOfMonthLoaded] = useState(false);

  const initialValues = useRef({
    tuneOfMonth: null as Song | null,
    favoritePerformance: '',
    listenTo: '',
    favoriteMusicArtists: '',
    favoriteAlbum: '',
    artistToSee: '',
  });

  const buttonY = useRef(new Animated.Value(100)).current;

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const userDocRef = doc(db, 'users', currentUser.uid);

      let imageUrl = favoritePerformance;
      if (image && image !== initialValues.current.favoritePerformance) {
        const imageRef = ref(storage, `userImages/${currentUser.uid}/${Date.now()}`);
        const response = await fetch(image);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }

      let updatedData = {
        favoritePerformance: imageUrl,
        listenTo,
        favoriteMusicArtists,
        favoriteAlbum,
        artistToSee,
        updatedAt: new Date(),
        tuneOfMonth: JSON.stringify(tuneOfMonth),
      };

      if (tuneOfMonth) {
        updatedData.tuneOfMonth = JSON.stringify(tuneOfMonth);
      }


      await updateDoc(userDocRef, updatedData);
      console.log('User data updated successfully');

      Animated.timing(buttonY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setHasChanges(false);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const handleInputChange = () => {
    setHasChanges(true);
    Animated.timing(buttonY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCancel = () => {
    setTuneOfMonth(initialValues.current.tuneOfMonth);
    setFavoritePerformance(initialValues.current.favoritePerformance);
    setListenTo(initialValues.current.listenTo);
    setFavoriteMusicArtists(initialValues.current.favoriteMusicArtists);
    setFavoriteAlbum(initialValues.current.favoriteAlbum);
    setArtistToSee(initialValues.current.artistToSee);
    setImage(initialValues.current.favoritePerformance);

    Animated.timing(buttonY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setHasChanges(false);
    });
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      handleInputChange();
    }
  };

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
          setImage(userData.favoritePerformance || '');
          setFavoriteMusicArtists(userData.favoriteMusicArtists || '');
          setFavoriteAlbum(userData.favoriteAlbum || '');
          setArtistToSee(userData.artistToSee || '');

          initialValues.current = {
            tuneOfMonth: userData.tuneOfMonth ? JSON.parse(userData.tuneOfMonth) : null,
            favoritePerformance: userData.favoritePerformance || '',
            listenTo: userData.listenTo || '',
            favoriteMusicArtists: userData.favoriteMusicArtists || '',
            favoriteAlbum: userData.favoriteAlbum || '',
            artistToSee: userData.artistToSee || '',
          };
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

  const handleSelectSong = async (song: Song) => {
    setTuneOfMonth(song);
    console.log('Selected song:', song);
    handleInputChange();

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const userDocRef = doc(db, 'users', currentUser.uid);

      await updateDoc(userDocRef, {
        tuneOfMonth: JSON.stringify(song),
      });
      console.log('Tune of the month updated successfully');

      // Update the initial value
      initialValues.current.tuneOfMonth = song;

      // Hide the save button as changes are already saved
      Animated.timing(buttonY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setHasChanges(false);
    } catch (error) {
      console.error('Error updating tune of the month:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isKeyboardVisible && { paddingBottom: 0 }]}>
      <View style={styles.header}>
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profilePicture}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.location}>{user.location}</Text>
          </View>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Ionicons name="settings-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, isKeyboardVisible && { paddingBottom: 80 }]}>
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tune of the Month</Text>
            {/* Conditional rendering to prevent error when tuneOfMonth is null */}
            {tuneOfMonthLoaded && (
              <SearchSong onSelectSong={handleSelectSong} initialSong={tuneOfMonth || undefined} />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>My Favorite Performance</Text>
            <TouchableOpacity onPress={pickImage}>
              <View style={styles.imageInputPlaceholder}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.imageInput} />
                ) : (
                  <Text style={[styles.imageInputText]}>+</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Music Artist/s</Text>
            <TextInput
              style={styles.input}
              value={favoriteMusicArtists}
              onChangeText={(text) => {
                setFavoriteMusicArtists(text);
                handleInputChange();
              }}
              multiline
              placeholder="Enter your favorite music artists"
              editable={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Album</Text>
            <TextInput
              style={styles.input}
              value={favoriteAlbum}
              onChangeText={(text) => {
                setFavoriteAlbum(text);
                handleInputChange();
              }}
              multiline
              placeholder="Enter your favorite album"
              editable={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>I Listen to Music to</Text>
            <TextInput
              style={styles.input}
              value={listenTo}
              onChangeText={(text) => {
                setListenTo(text);
                handleInputChange();
              }}
              multiline
              placeholder="Enter your music listening reasons"
              editable={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>If I Could See Any Artist, Dead or Alive, It Would Be</Text>
            <TextInput
              style={styles.input}
              value={artistToSee}
              onChangeText={(text) => {
                setArtistToSee(text);
                handleInputChange();
              }}
              multiline
              placeholder="Enter the artist you would like to see"
              editable={true}
            />
          </View>
        </View>
      </ScrollView>

      {hasChanges && (
        <Animated.View style={[styles.saveButtonContainer, { transform: [{ translateY: buttonY }] }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Changes</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
    paddingBottom: 80, 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 85,
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
    paddingBottom: 25,
    paddingRight: 8,
  },
  content: {
    paddingTop: 20,
    paddingLeft: 50,
    paddingRight: 50,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fba904',
  },
  input: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 45,
    backgroundColor: '#fff',
    color: '#542f11',
  },
  imageInputPlaceholder: {
    width: '100%',
    height: 290,
    backgroundColor: '#f0f0f0',
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInput: {
    width: '100%',
    height: '100%',
  },
  imageInputText: {
    fontSize: 40,
    color: '#999',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 105,
    left: 25,
    right: 25,
    alignItems: 'center',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  saveButton: {
    backgroundColor: '#79ce54',
    padding: 13,
    borderRadius: 15,
    width: '40%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    padding: 13,
    borderRadius: 15,
    width: '50%',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomNavBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 80,
  },
});