// editprofile.tsx
// Mariann Grace Dizon

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import SearchSong from '../components/search-song';
import { getAuth, updateProfile, User } from "firebase/auth";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export default function EditProfile() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '',
    location: '',
    favoritePerformance: '',
    listenTo: '',
    favoriteMusicArtists: '',
    favoriteAlbum: '',
    artistToSee: '',
  });

  const [tuneOfMonth, setTuneOfMonth] = useState<Song | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const googlePlacesRef = useRef(null);
  const [tempLocation, setTempLocation] = useState(user.location);

  const initialValues = useRef({
    tuneOfMonth: null as Song | null,
    favoritePerformance: '',
    listenTo: '',
    favoriteMusicArtists: '',
    favoriteAlbum: '',
    artistToSee: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            name: `${userData.firstName} ${userData.lastName}`,
            location: userData.location || '',
            favoritePerformance: userData.favoritePerformance || '',
            listenTo: userData.listenTo || '',
            favoriteMusicArtists: userData.favoriteMusicArtists || '',
            favoriteAlbum: userData.favoriteAlbum || '',
            artistToSee: userData.artistToSee || '',
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

          initialValues.current = {
            tuneOfMonth: userData.tuneOfMonth ? JSON.parse(userData.tuneOfMonth) : null,
            favoritePerformance: userData.favoritePerformance || '',
            listenTo: userData.listenTo || '',
            favoriteMusicArtists: userData.favoriteMusicArtists || '',
            favoriteAlbum: userData.favoriteAlbum || '',
            artistToSee: userData.artistToSee || '',
          };
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const userDocRef = doc(db, 'users', currentUser.uid);

      let imageUrl = user.favoritePerformance;
      if (image && image !== initialValues.current.favoritePerformance) {
        const imageRef = ref(storage, `userImages/${currentUser.uid}/${Date.now()}`);
        const response = await fetch(image);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }

      const nameParts = user.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      await updateDoc(userDocRef, {
        firstName,
        lastName,
        location: user.location,
        favoritePerformance: imageUrl,
        listenTo: user.listenTo,
        favoriteMusicArtists: user.favoriteMusicArtists,
        favoriteAlbum: user.favoriteAlbum,
        artistToSee: user.artistToSee,
        tuneOfMonth: JSON.stringify(tuneOfMonth),
        updatedAt: new Date(),
      });

      const authInstance = getAuth();
      const currentUserInstance: User | null = authInstance.currentUser;

      if (currentUserInstance) {
        await updateProfile(currentUserInstance, {
          displayName: user.name,
        });
      }

      console.log('User data updated successfully');
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully');
      router.push('/profile');
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUser((prevUser) => ({ ...prevUser, [field]: value }));
    setHasChanges(true);
  };

  const handleSelectSong = (song: Song) => {
    setTuneOfMonth(song);
    setHasChanges(true);
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
      handleInputChange('favoritePerformance', result.assets[0].uri);
    }
  };

  const handleSaveLocationChange = async (data: any, details: any) => {
    if (details) {
      const newLocation = details.formatted_address;
      setTempLocation(newLocation);
      handleInputChange('location', newLocation);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={user.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <GooglePlacesAutocomplete
              ref={googlePlacesRef}
              placeholder='Search for a city or town'
              onPress={handleSaveLocationChange}
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

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tune of the Month</Text>
            <SearchSong onSelectSong={handleSelectSong} initialSong={tuneOfMonth || undefined} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Performance</Text>
            <TouchableOpacity onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imageInput} />
              ) : (
                <Text style={[styles.imageInputText]}>+</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>I Listen to Music to</Text>
            <TextInput
              style={styles.input}
              value={user.listenTo}
              onChangeText={(text) => handleInputChange('listenTo', text)}
              placeholder="Enter your music listening reasons"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Music Artist/s</Text>
            <TextInput
              style={styles.input}
              value={user.favoriteMusicArtists}
              onChangeText={(text) => handleInputChange('favoriteMusicArtists', text)}
              placeholder="Enter your favorite music artists"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Favorite Album</Text>
            <TextInput
              style={styles.input}
              value={user.favoriteAlbum}
              onChangeText={(text) => handleInputChange('favoriteAlbum', text)}
              placeholder="Enter your favorite album"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>If I Could See Any Artist, Dead or Alive, It Would Be</Text>
            <TextInput
              style={styles.input}
              value={user.artistToSee}
              onChangeText={(text) => handleInputChange('artistToSee', text)}
              placeholder="Enter the artist you would like to see"
            />
          </View>
        </View>

        {hasChanges && (
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  googleAutocompleteContainer: {
    flex: 1,
    width: '100%',
    zIndex: 1,
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
    maxHeight: 200,
    zIndex: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
    width: 250,
    height: 250,
  },
  imageInputText: {
    fontSize: 40,
    color: '#999',
  },
  saveButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#79ce54',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});