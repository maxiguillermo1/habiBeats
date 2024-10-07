import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import SearchSong from '../components/search-song';
import SpotifySearch from '../components/SpotifySearch';
import SpotifyAlbumSearch from '../components/SpotifyAlbumSearch';
import { Picker } from '@react-native-picker/picker';
import { PromptSelector } from '../components/PromptSelector';

interface Prompt {
  question: string;
  answer: string;
}

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
  const [musicPreference, setMusicPreference] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  const promptOptions = [
    "What do you look for in a perfect event experience?",
    "Are you more of a front row or back row person at concerts? Why?",
    "If you could have dinner with any musician, dead or alive, who would it be and why?",
    "What's the most memorable concert you've ever attended?",
    "If you could only listen to one album for the rest of your life, what would it be?",
    "How do you prepare for an event? Any special gear or outfits?",
    "What’s one event or concert you’re still hoping to attend one day?",
    "What’s the next concert or event you’re excited about?",
    "What's the most underrated album you've ever listened to?",
    "What’s the most surprising thing you’ve seen happen at a live event?",
    "What's your favorite post-event hangout spot or after-party?",
  ];

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

          setMusicPreference(userData.musicPreference || []);
          
          // Fetch prompts from Firebase
          const fetchedPrompts = userData.prompts || [];
          setPrompts(Object.entries(fetchedPrompts).map(([question, answer]) => ({ question, answer: answer as string })));
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

      // Prepare prompts data for Firebase
      const promptsData = prompts.reduce((acc: { [key: string]: string }, prompt) => {
        if (prompt.question && prompt.answer) {
          acc[prompt.question] = prompt.answer;
        }
        return acc;
      }, {});

      await updateDoc(userDocRef, {
        favoritePerformance: imageUrl,
        listenTo: user.listenTo,
        artistToSee: user.artistToSee,
        favoriteGenre: user.favoriteGenre,
        nextConcert: user.nextConcert,
        unforgettableExperience: user.unforgettableExperience,
        favoriteAfterPartySpot: user.favoriteAfterPartySpot,
        tuneOfMonth: tuneOfMonth ? JSON.stringify(tuneOfMonth) : null,
        favoriteArtists: JSON.stringify(favoriteArtists),
        favoriteAlbum: favoriteAlbum ? JSON.stringify(favoriteAlbum) : null,
        musicPreference: musicPreference,
        prompts: promptsData,
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

  const toggleMusicPreference = (genre: string) => {
    setMusicPreference((prevPreferences) => {
      if (prevPreferences.includes(genre)) {
        return prevPreferences.filter((p) => p !== genre);
      } else {
        return [...prevPreferences, genre];
      }
    });
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

  const handlePromptChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index][field] = value;
    setPrompts(newPrompts);
    setHasChanges(true);
  };

  const handleAddPrompt = () => {
    if (prompts.length < 5) {
      setPrompts([...prompts, { question: '', answer: '' }]);
      setHasChanges(true);
    }
  };

  const handleRemovePrompt = async (index: number) => {
    try {
      const removedPrompt = prompts[index];
      const newPrompts = prompts.filter((_, i) => i !== index);
      setPrompts(newPrompts);
      setHasChanges(true);

      // Remove the prompt from Firebase
      if (removedPrompt.question) {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          [`prompts.${removedPrompt.question}`]: deleteField()
        });
      }
    } catch (error) {
      console.error('Error removing prompt:', error);
      Alert.alert('Error', 'Failed to remove prompt');
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
              <Text style={styles.inputLabel}>Music Preference</Text>
              <View style={styles.genreContainer}>
                {['EDM', 'Hip Hop', 'Pop', 'Country', 'Jazz', 'R&B', 'Indie', 'Rock', 'Techno', 'Latin', 'Soul', 'Classical', 'J-Pop', 'K-Pop', 'Metal','Reggae'].map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreButton,
                      musicPreference.includes(genre) && styles.selectedGenreButton,
                    ]}
                    onPress={() => toggleMusicPreference(genre)}
                  >
                    <Text
                      style={[
                        styles.genreButtonText,
                        musicPreference.includes(genre) && styles.selectedGenreButtonText,
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tune of the Month</Text>
              <SearchSong onSelectSong={handleSelectSong} initialSong={tuneOfMonth || undefined} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Artists</Text>
              <SpotifySearch 
                onSelectArtist={handleSelectArtist} 
                onRemoveArtist={handleRemoveArtist} 
                selectedArtists={favoriteArtists} 
              />
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

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Performance</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imageInputPlaceholder}>
                <Text style={styles.imageInputText}>Choose a Photo</Text>
                {(image || user.favoritePerformance) && (
                  <Image 
                    source={{ uri: image || user.favoritePerformance }} 
                    style={styles.imageInput} 
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Written Prompts ({prompts.length}/5)</Text>
              {prompts.map((prompt, index) => (
                <View key={index} style={styles.promptContainer}>
                  <PromptSelector
                    value={prompt.question}
                    onSelect={(question) => handlePromptChange(index, 'question', question)}
                    onRemove={() => handleRemovePrompt(index)}
                    options={promptOptions}
                  />
                  {prompt.question && (
                    <TextInput
                      style={styles.promptInput}
                      value={prompt.answer}
                      onChangeText={(text) => handlePromptChange(index, 'answer', text)}
                      placeholder="Write your answer here"
                      multiline
                    />
                  )}
                </View>
              ))}
              {prompts.length < 5 && (
                <TouchableOpacity style={styles.addPromptButton} onPress={handleAddPrompt}>
                  <Text style={styles.addPromptButtonText}>+</Text>
                </TouchableOpacity>
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
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageInput: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    resizeMode: 'cover',
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
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  genreButton: {
    backgroundColor: 'rgba(55,189,213,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
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
  promptContainer: {
    marginBottom: 20,
  },
  promptPicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    color: '#542f11',
    minHeight: 100,
  },
  promptSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removePromptButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  removePromptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addPromptButton: {
    backgroundColor: '#fba904',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  addPromptButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});