import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import SearchSong from '../components/search-song';
import SpotifySearch from '../components/SpotifySearch';
import SpotifyAlbumSearch from '../components/SpotifyAlbumSearch';

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface Artist {
  id: string;
  name: string;
  picture: string;
}

interface Album {
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
    favoriteAlbum: '',
    artistToSee: '',
    favoriteGenre: '',
    nextConcert: '',
    unforgettableExperience: '',
    favoriteAfterPartySpot: '',
  });

  const [tuneOfMonth, setTuneOfMonth] = useState<Song | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [favoriteAlbum, setFavoriteAlbum] = useState<Album | null>(null);
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);

  const initialValues = useRef({
    tuneOfMonth: null as Song | null,
    favoritePerformance: '',
    listenTo: '',
    favoriteAlbum: '',
    artistToSee: '',
    favoriteGenre: '',
    nextConcert: '',
    unforgettableExperience: '',
    favoriteAfterPartySpot: '',
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
            favoriteAlbum: userData.favoriteAlbum || '',
            artistToSee: userData.artistToSee || '',
            favoriteGenre: userData.favoriteGenre || '',
            nextConcert: userData.nextConcert || '',
            unforgettableExperience: userData.unforgettableExperience || '',
            favoriteAfterPartySpot: userData.favoriteAfterPartySpot || '',
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

          if (userData.favoriteAlbum) {
            try {
              const parsedFavoriteAlbum = JSON.parse(userData.favoriteAlbum);
              setFavoriteAlbum(parsedFavoriteAlbum);
            } catch (error) {
              console.error('Error parsing favoriteAlbum:', error);
              setFavoriteAlbum(null);
            }
          } else {
            setFavoriteAlbum(null);
          }

          if (userData.favoriteArtists) {
            try {
              const parsedFavoriteArtists = JSON.parse(userData.favoriteArtists);
              setFavoriteArtists(parsedFavoriteArtists);
            } catch (error) {
              console.error('Error parsing favoriteArtists:', error);
              setFavoriteArtists([]);
            }
          } else {
            setFavoriteArtists([]);
          }
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
        artistToSee: user.artistToSee,
        favoriteGenre: user.favoriteGenre,
        nextConcert: user.nextConcert,
        unforgettableExperience: user.unforgettableExperience,
        favoriteAfterPartySpot: user.favoriteAfterPartySpot,
        tuneOfMonth: JSON.stringify(tuneOfMonth),
        favoriteArtists: JSON.stringify(favoriteArtists),
        favoriteAlbum: favoriteAlbum ? JSON.stringify(favoriteAlbum) : null,
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

  const handleSelectArtist = (artist: Artist) => {
    setFavoriteArtists((prevArtists) => [...prevArtists, artist]);
    setHasChanges(true);
  };

  const handleRemoveArtist = (artistId: string) => {
    setFavoriteArtists((prevArtists) => prevArtists.filter(artist => artist.id !== artistId));
    setHasChanges(true);
  };

  const handleSelectAlbum = (album: Album) => {
    setFavoriteAlbum(album);
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

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Artists</Text>
              <SpotifySearch 
                onSelectArtist={handleSelectArtist} 
                onRemoveArtist={handleRemoveArtist} 
                selectedArtists={favoriteArtists} 
              />
              {favoriteArtists.map((artist) => (
                <View key={artist.id} style={styles.selectedArtistContainer}>
                  <Image source={{ uri: artist.picture }} style={styles.artistImage} />
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveArtist(artist.id)} style={styles.removeArtistButton}>
                    <Text style={styles.removeArtistButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Album</Text>
              <SpotifyAlbumSearch onSelectAlbum={handleSelectAlbum} />
              {favoriteAlbum && (
                <View style={styles.albumContainer}>
                  <Image source={{ uri: favoriteAlbum.albumArt }} style={styles.albumImage} />
                  <Text style={styles.albumName}>{favoriteAlbum.name}</Text>
                  <Text style={styles.albumArtist}>{favoriteAlbum.artist}</Text>
                </View>
              )}
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
    top: 50,
    left: 20,
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
    marginTop: 50,
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
  artistContainer: {
    marginTop: 10,
  },
  artistText: {
    fontSize: 16,
    color: '#542f11',
  },
  artistImage: {
    width: 50,
    height: 50,
  },
  // If there's another 'artistImage' property, rename it, for example:
  // artistImageAlt: {
  //   // ... other properties
  // },
  albumContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  albumImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  albumName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#542f11',
  },
  albumArtist: {
    fontSize: 14,
    color: '#666',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  genreButton: {
    backgroundColor: 'rgba(55,189,213,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  selectedGenreButton: {
    backgroundColor: '#fba904',
  },
  genreButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedGenreButtonText: {
    color: '#FFFFFF',
  },
  selectedArtistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  artistName: {
    flex: 1,
    fontSize: 16,
    color: '#542f11',
  },
  removeArtistButton: {
    backgroundColor: '#fba904',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeArtistButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
