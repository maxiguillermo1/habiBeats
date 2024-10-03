import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import SearchSong from '../components/search-song';

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export default function EditProfile() {
  const router = useRouter();
  const [user, setUser] = useState({
    favoritePerformance: '',
    listenTo: '',
    favoriteMusicArtists: '',
    favoriteAlbum: '',
    artistToSee: '',
    favoriteGenre: '', // New state
    nextConcert: '', // New state
    unforgettableExperience: '', // New state
    favoriteAfterPartySpot: '', // New state
  });

  const [tuneOfMonth, setTuneOfMonth] = useState<Song | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const initialValues = useRef({
    tuneOfMonth: null as Song | null,
    favoritePerformance: '',
    listenTo: '',
    favoriteMusicArtists: '',
    favoriteAlbum: '',
    artistToSee: '',
    favoriteGenre: '', // Added favoriteGenre to initialValues
    nextConcert: '', // Added nextConcert to initialValues
    unforgettableExperience: '', // Added unforgettableExperience to initialValues
    favoriteAfterPartySpot: '', // Added favoriteAfterPartySpot to initialValues
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
            favoritePerformance: userData.favoritePerformance || '',
            listenTo: userData.listenTo || '',
            favoriteMusicArtists: userData.favoriteMusicArtists || '',
            favoriteAlbum: userData.favoriteAlbum || '',
            artistToSee: userData.artistToSee || '',
            favoriteGenre: userData.favoriteGenre || '', // Added favoriteGenre to setUser
            nextConcert: userData.nextConcert || '', // Added nextConcert to setUser
            unforgettableExperience: userData.unforgettableExperience || '', // Added unforgettableExperience to setUser
            favoriteAfterPartySpot: userData.favoriteAfterPartySpot || '', // Added favoriteAfterPartySpot to setUser
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
            favoriteGenre: userData.favoriteGenre || '', // Added favoriteGenre to initialValues
            nextConcert: userData.nextConcert || '', // Added nextConcert to initialValues
            unforgettableExperience: userData.unforgettableExperience || '', // Added unforgettableExperience to initialValues
            favoriteAfterPartySpot: userData.favoriteAfterPartySpot || '', // Added favoriteAfterPartySpot to initialValues
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

      await updateDoc(userDocRef, {
        favoritePerformance: imageUrl,
        listenTo: user.listenTo,
        favoriteMusicArtists: user.favoriteMusicArtists,
        favoriteAlbum: user.favoriteAlbum,
        artistToSee: user.artistToSee,
        favoriteGenre: user.favoriteGenre, // Ensure this is saved
        nextConcert: user.nextConcert, // Save to backend
        unforgettableExperience: user.unforgettableExperience, // Save to backend
        favoriteAfterPartySpot: user.favoriteAfterPartySpot, // Save to backend
        tuneOfMonth: JSON.stringify(tuneOfMonth),
        updatedAt: new Date(),
      });

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/profile')}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tune of the Month</Text>
              <SearchSong onSelectSong={handleSelectSong} initialSong={tuneOfMonth || undefined} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Performance</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imageInputPlaceholder}>
                <Text style={styles.imageInputText}>Choose a Photo</Text>
                {image && (
                  <Image source={{ uri: image }} style={styles.imageInput} />
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

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Music Genre</Text>
              <TextInput
                style={styles.input}
                value={user.favoriteGenre}
                onChangeText={(text) => handleInputChange('favoriteGenre', text)}
                placeholder="Enter your favorite music genre"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>What's the next concert or event you're excited about?</Text>
              <TextInput
                style={styles.input}
                value={user.nextConcert}
                onChangeText={(text) => handleInputChange('nextConcert', text)}
                placeholder="Enter the next concert or event"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Describe your favorite concert experience and why</Text>
              <TextInput
                style={styles.input}
                value={user.unforgettableExperience}
                onChangeText={(text) => handleInputChange('unforgettableExperience', text)}
                placeholder="Describe your experience"
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>What's your favorite post-event hangout spot or after-party?</Text>
              <TextInput
                style={styles.input}
                value={user.favoriteAfterPartySpot}
                onChangeText={(text) => handleInputChange('favoriteAfterPartySpot', text)}
                placeholder="Enter your favorite hangout spot"
                multiline
              />
            </View>

            {hasChanges && (
              <View style={styles.saveButtonContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10, // Moved to the left
    padding: 10,
    backgroundColor: '#fba904',
    borderRadius: 5,
    zIndex: 1,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    marginTop: 50, // Adjust for back button
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
    height: 250,
    backgroundColor: '#f0f0f0',
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageInput: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageInputText: {
    fontSize: 18,
    color: '#999',
    zIndex: 1,
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