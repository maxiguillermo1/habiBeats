// editprofile.tsx
// Mariann Grace Dizon 

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import SearchSong from '../components/search-song';
import SearchAlbum from '../components/search-album';
import { PromptSelector } from '../components/PromptSelector';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform } from 'react-native';
import SearchArtist from '../components/search-artist';

// Define interfaces for data structures used in the component
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

// Add this type for the route params
type RouteParams = {
  selectedPhoto?: string;
}

// Add this interface
interface DisposableImage {
  id: string;
  url: string;
  caption?: string;
}

// Main component for editing user profile
export default function EditProfile() {
  const router = useRouter();
  const navigation = useNavigation<NavigationProp<any>>();

  // State variables to manage user data and UI state
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
  const [myDisposables, setMyDisposables] = useState<DisposableImage[]>([]);
  const [selectedDisposable, setSelectedDisposable] = useState<DisposableImage | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempCaption, setTempCaption] = useState('');

  // Predefined prompt options for user to select from
  const promptOptions = [
    "Are you more of a front row or back row person at concerts? Why?",
    "How do you prepare for an event? Any special gear or outfits?",
    "How do you usually find out about upcoming concerts or events?",
    "If you could have dinner with any musician, dead or alive, who would it be and why?",
    "If you could only listen to one album for the rest of your life, what would it be?",
    "What do you look for in a perfect event experience?",
    "What's one event or concert you're still hoping to attend one day?",
    "What's one piece of advice you would give to someone attending their first concert or event?",
    "What's one thing you always bring to an event that others might overlook?",
    "What's the best concert or event you've attended alone, and why was it worth it?",
    "What's the longest distance you've traveled to attend an event?",
    "What's the most memorable concert you've ever attended?",
    "What's the most memorable merch or souvenir you've collected from an event?",
    "What's the most surprising thing you've seen happen at a live event?",
    "What's the most underrated album you've ever listened to?",
    "What's the next concert or event you're excited about?",
    "What's your favorite post-event hangout spot or after-party?"
  ];

  // Store initial values to detect changes
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

  // Fetch user data from Firebase on component mount
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

          // Parse and set tune of the month
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

          // Parse and set favorite album
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

          // Parse and set favorite artists
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

          // Set music preferences
          setMusicPreference(userData.musicPreference || []);
          
          // Fetch prompts from Firebase
          const fetchedPrompts = userData.prompts || [];
          setPrompts(Object.entries(fetchedPrompts).map(([question, answer]) => ({ question, answer: answer as string })));

          if (userData.myDisposables) {
            // Check if it's already an array
            if (Array.isArray(userData.myDisposables)) {
              setMyDisposables(userData.myDisposables);
            } else {
              try {
                const parsedDisposables = JSON.parse(userData.myDisposables);
                setMyDisposables(parsedDisposables);
              } catch (error) {
                console.error('Error parsing myDisposables:', error);
                setMyDisposables([]);
              }
            }
          } else {
            setMyDisposables([]);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Update the navigation effect to handle disposable photos
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // @ts-ignore - Access the route params
      const params = navigation.getState().routes.find(r => r.name === 'editprofile')?.params;
      
      // Handle selectedDisposables array
      if (params?.selectedDisposables && Array.isArray(params.selectedDisposables)) {
        params.selectedDisposables.forEach((photoUri: string) => {
          handleAddDisposable(photoUri);
        });
        // Clear the params
        navigation.setParams({ selectedDisposables: undefined });
      }
      
      // Handle single photoUri (for backward compatibility)
      if (params?.photoUri) {
        handleAddDisposable(params.photoUri);
        // Clear the params
        navigation.setParams({ photoUri: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Handle saving changes to Firebase
  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Handle image upload if changed
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

      // Update user document in Firebase
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
        myDisposables: myDisposables,
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

  // Handle input changes and mark form as changed
  const handleInputChange = (field: string, value: string) => {
    setUser((prevUser) => ({ ...prevUser, [field]: value }));
    setHasChanges(true);
  };

  // Handle song selection
  const handleSelectSong = (song: Song) => {
    setTuneOfMonth(song);
    setHasChanges(true);
  };

  // Handle artist selection
  const handleSelectArtist = (artist: Artist) => {
    setFavoriteArtists((prevArtists) => [...prevArtists, artist]);
    setHasChanges(true);
  };

  // Handle artist removal
  const handleRemoveArtist = (artistId: string) => {
    setFavoriteArtists((prevArtists) => prevArtists.filter(artist => artist.id !== artistId));
    setHasChanges(true);
  };

  // Handle album selection
  const handleSelectAlbum = (album: Album) => {
    setFavoriteAlbum(album);
    setHasChanges(true);
  };

  // Toggle music preference selection
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

  // Pick an image from the library
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
      const selectedImageUri = result.assets[0].uri;
      setImage(selectedImageUri);
      setHasChanges(true);
    }
  };

  // Handle prompt change
  const handlePromptChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index][field] = value;
    setPrompts(newPrompts);
    setHasChanges(true);
  };

  // Add a new prompt
  const handleAddPrompt = () => {
    if (prompts.length < 8) {
      setPrompts([...prompts, { question: '', answer: '' }]);
      setHasChanges(true);
    }
  };

  // Remove a prompt
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

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Handle disposable photo deletion
  const handleDeleteDisposable = (id: string) => {
    setMyDisposables(prev => prev.filter(photo => photo.id !== id));
    setHasChanges(true);
  };

  // Update handleAddDisposable to better handle the photo addition
  const handleAddDisposable = (photoUri: string) => {
    setMyDisposables(prev => {
      // Check if we've already reached the limit
      if (prev.length >= 4) {
        Alert.alert('Limit Reached', 'You can only select up to 4 photos');
        return prev;
      }
      
      // Check if this photo is already added
      if (prev.some(photo => photo.url === photoUri)) {
        return prev;
      }
      
      // Add the new photo
      const newPhoto: DisposableImage = {
        id: Date.now().toString(),
        url: photoUri
      };
      return [...prev, newPhoto];
    });
    setHasChanges(true);
  };

  // Add this at the component level
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // @ts-ignore - Access the route params
      const params = navigation.getState().routes.find(r => r.name === 'editprofile')?.params;
      if (params?.photoUri) {
        handleAddDisposable(params.photoUri);
        // Clear the params
        navigation.setParams({ photoUri: undefined });
      }
    });
  
    return unsubscribe;
  }, [navigation]);

  // Add this function to handle photo deletion
  const handleDeleteFavoritePerformance = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Update both local state and database
      setImage(null);
      setUser(prev => ({ ...prev, favoritePerformance: '' }));
      setHasChanges(true);
      
      // Update the database immediately
      await updateDoc(userDocRef, {
        favoritePerformance: deleteField()
      });
      
    } catch (error) {
      console.error('Error deleting favorite performance:', error);
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  // Render the component UI
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-back-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
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
                <SearchArtist 
                  onSelectArtist={handleSelectArtist} 
                  onRemoveArtist={handleRemoveArtist} 
                  selectedArtists={favoriteArtists}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Favorite Album</Text>
                <SearchAlbum onSelectAlbum={handleSelectAlbum} />
                {favoriteAlbum && (
                  <View style={styles.albumContainer}>
                    <Image source={{ uri: favoriteAlbum.albumArt }} style={styles.albumImage} />
                    <View style={styles.albumInfo}>
                      <Text style={styles.albumName}>{favoriteAlbum.name}</Text>
                      <Text style={styles.albumArtist}>{favoriteAlbum.artist}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.favoritePerformanceContainer}>
                <Text style={styles.inputLabel}>Favorite Performance</Text>
                <View style={styles.performanceImageContainer}>
                  {(image || user.favoritePerformance) ? (
                    <>
                      <Image 
                        source={{ uri: image || user.favoritePerformance }} 
                        style={styles.performanceImage} 
                      />
                      <TouchableOpacity 
                        style={styles.deletePerformanceButton}
                        onPress={handleDeleteFavoritePerformance}
                      >
                        <Ionicons name="close-circle" size={24} color="red" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addPerformanceButton}
                      onPress={pickImage}
                    >
                      <Ionicons name="add-circle-outline" size={40} color="#fba904" />
                      <Text style={styles.addPerformanceText}>Add Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Written Prompts ({prompts.length}/8)</Text>
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
                {prompts.length < 8 && (
                  <TouchableOpacity style={styles.addPromptButton} onPress={handleAddPrompt}>
                    <Text style={styles.addPromptButtonText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>My Disposables ({myDisposables.length}/4)</Text>
                <View style={styles.disposablesGrid}>
                  {myDisposables.map((photo) => (
                    <View key={photo.id} style={styles.disposableContainer}>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteDisposable(photo.id)}
                      >
                        <Ionicons name="close-circle" size={24} color="red" />
                      </TouchableOpacity>
                      <Image 
                        source={{ uri: photo.url }} 
                        style={styles.disposableImage} 
                      />
                    </View>
                  ))}
                  {myDisposables.length < 4 && (
                    <TouchableOpacity 
                      style={[styles.disposableContainer, styles.addDisposableButton]} 
                      onPress={() => navigation.navigate('disposable-gallery', { 
                        selectMode: true,
                        maxSelections: 4 - myDisposables.length,
                        currentDisposables: myDisposables.map(d => d.url),
                        returnRoute: 'editprofile'
                      })}
                    >
                      <Ionicons name="add-circle-outline" size={40} color="#fba904" />
                      <Text style={styles.addDisposableText}>Add Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.scrollContent}
        />
      </KeyboardAvoidingView>

      {hasChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#542f11',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  inputContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#542f11',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  selectedGenreButton: {
    backgroundColor: '#fba904',
  },
  genreButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedGenreButtonText: {
    color: '#fff',
  },
  disposablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  disposableContainer: {
    width: '47%',
    height: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disposableImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  addDisposableButton: {
    backgroundColor: 'rgba(251, 169, 4, 0.1)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fba904',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDisposableText: {
    color: '#fba904',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  promptContainer: {
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    color: '#542f11',
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 8,
    fontSize: 16,
  },
  addPromptButton: {
    backgroundColor: '#fba904',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addPromptButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  saveButton: {
    backgroundColor: '#79ce54',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  albumContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  albumInfo: {
    marginLeft: 12,
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#542f11',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 14,
    color: '#666',
  },
  selectedArtistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  artistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  artistName: {
    flex: 1,
    fontSize: 16,
    color: '#542f11',
    marginLeft: 12,
    fontWeight: '500',
  },
  favoritePerformanceContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(251, 169, 4, 0.1)',
    position: 'relative',
  },
  performanceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addPerformanceButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fba904',
    borderRadius: 12,
  },
  addPerformanceText: {
    color: '#fba904',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  deletePerformanceButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  performanceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
  },
  performanceHint: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});