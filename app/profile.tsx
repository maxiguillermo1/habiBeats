// profile.tsx
// Mariann Grace Dizon

// Import necessary modules and define types
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, Keyboard, ImageSourcePropType, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import BottomNavBar from '../components/BottomNavBar';
import { registerForPushNotificationsAsync, hasUnreadNotifications, addNotification } from '../scripts/notificationHandler';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext, ThemeProvider } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

// Define interfaces for data structures
interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface Album {
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

interface Prompt {
  question: string;
  answer: string;
}

interface DisposablePhoto {
  url: string;
  timestamp: number;
}

interface DisposableImage {
  url: string;
  timestamp: number;
}
// End of imports and type definitions

// Define Profile component and initialize state
const gifImages: Record<string, any> = {
  'pfpoverlay1.gif': require('../assets/animated-avatar/pfpoverlay1.gif'),
  'pfpoverlay2.gif': require('../assets/animated-avatar/pfpoverlay2.gif'),
  'pfpoverlay3.gif': require('../assets/animated-avatar/pfpoverlay3.gif'),
  'pfpoverlay4.gif': require('../assets/animated-avatar/pfpoverlay4.gif'),
  'pfpoverlay5.gif': require('../assets/animated-avatar/pfpoverlay5.gif'),
  'pfpoverlay6.gif': require('../assets/animated-avatar/pfpoverlay6.gif'),
};

export default function Profile() {
  // State for animated border image
  const [animatedBorder, setAnimatedBorder] = useState<ImageSourcePropType | null>(null);

  const router = useRouter();
  const navigation = useNavigation();
  // State for user profile data
  const [user, setUser] = useState({
    name: 'Name not set',
    location: 'Location not set',
    profileImageUrl: '',
    gender: '',
    myDisposables: [] as DisposableImage[],
  });

  // State for various user preferences and data
  const [tuneOfMonth, setTuneOfMonth] = useState<Song | null>(null);
  const [favoritePerformance, setFavoritePerformance] = useState('');
  const [favoriteAlbumData, setFavoriteAlbumData] = useState<Album | null>(null);
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);
  const [tuneOfMonthLoaded, setTuneOfMonthLoaded] = useState(false);
  const [musicPreference, setMusicPreference] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedDisposable, setSelectedDisposable] = useState<DisposablePhoto | null>(null);

  // Add menu state
  const [menuVisible, setMenuVisible] = useState(false);

  // Update theme context usage
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  // Fetch user data and register push notifications
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Listen for real-time updates to user data
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            
            // Set theme based on user preference
            const userTheme = userData.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference

            // Set other user data
            setUser({
              name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
              location: userData.displayLocation || 'Location not set',
              profileImageUrl: userData.profileImageUrl || '',
              gender: userData.gender || '',
              myDisposables: userData.myDisposables || [],
            });

            // Fetch animated border image
            fetchAnimatedBorder();

            // Parse and set tune of the month
            if (userData.tuneOfMonth) {
              try {
                const parsedTuneOfMonth = JSON.parse(userData.tuneOfMonth);
                setTuneOfMonth(parsedTuneOfMonth);
                setTuneOfMonthLoaded(true);
              } catch (error) {
                console.error('Error parsing tuneOfMonth:', error);
                setTuneOfMonth(null);
              }
            } else {
              setTuneOfMonth(null);
            }

            // Parse and set favorite album data
            if (userData.favoriteAlbum) {
              try {
                const parsedFavoriteAlbum = JSON.parse(userData.favoriteAlbum);
                setFavoriteAlbumData(parsedFavoriteAlbum);
              } catch (error) {
                console.error('Error parsing favoriteAlbum:', error);
                setFavoriteAlbumData(null);
              }
            } else {
              setFavoriteAlbumData(null);
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

            // Set other user preferences
            setFavoritePerformance(userData.favoritePerformance || '');
            setMusicPreference(userData.musicPreference || []);

            // Fetch and set prompts
            const fetchedPrompts = userData.prompts || {};
            const promptsArray = Object.entries(fetchedPrompts).map(([question, answer]) => ({
              question,
              answer: answer as string
            }));
            setPrompts(promptsArray);

            if (userData.myDisposables) {
              setSelectedDisposable({ url: userData.myDisposables, timestamp: Date.now() });
            } else {
              setSelectedDisposable(null);
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Register for push notifications and update user document with token
  useEffect(() => {
    console.log("Registering for push notifications");
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Push token:", token);
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          updateDoc(userDocRef, { pushToken: token });
        }
      }
    });
  }, []);

  // Checks if there are any unread notifications
  const checkUnreadNotifications = useCallback(async () => {
    if (auth.currentUser) {
      const unread = await hasUnreadNotifications(auth.currentUser.uid);
      setHasUnread(unread);
    }
  }, []);

  useEffect(() => { 
    checkUnreadNotifications();

    const intervalId = setInterval(() => {
      checkUnreadNotifications();
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkUnreadNotifications]);

  // Define helper functions for navigation and styling
  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleEditPress = () => {
    router.push('/editprofile');
  };

  const getBorderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return '#37bdd5';
      case 'female':
        return '#fc6c85';
      default:
        return '#333';
    }
  };

  const getTextColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return '#37bdd5';
      case 'female':
        return '#fc6c85';
      default:
        return '#333';
    }
  };

  const handleCameraPress = () => {
    router.push('/disposable-camera');
  };

  // Add menu toggle function
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Fetch animated border image based on user data
  const fetchAnimatedBorder = async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.AnimatedBorder && gifImages[userData.AnimatedBorder]) {
            setAnimatedBorder(gifImages[userData.AnimatedBorder] as ImageSourcePropType);
          }
        }
      } catch (error) {
        console.error('Error fetching animated border:', error);
      }
    }
  };

  return (
    <ThemeProvider>
      <SafeAreaView style={[styles.container, { 
        backgroundColor: isDarkMode ? '#151718' : '#fff8f0' 
      }]}>
        <View style={styles.header}>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={toggleMenu}
            >
              <Ionicons 
                name="apps-outline" 
                size={25} 
                color={menuVisible ? '#37bdd5' : isDarkMode ? '#fff' : '#333'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Modal for menu */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={menuVisible}
          onRequestClose={toggleMenu}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={toggleMenu}
          >
            <View style={[styles.menuContainer, {
              backgroundColor: isDarkMode ? '#2d3235' : '#fff'
            }]}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  handleEditPress();
                  toggleMenu();
                }}
              >
                <Ionicons name="create-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
                <Text style={[styles.menuText, { color: isDarkMode ? '#fff' : '#333' }]}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  router.push('/ai-chatbot');
                  toggleMenu();
                }}
              >
                <Ionicons name="heart-circle-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
                <Text style={[styles.menuText, { color: isDarkMode ? '#fff' : '#333' }]}>HabiBI AI</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  router.push('/discography');
                  toggleMenu();
                }}
              >
                <Ionicons name="compass-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
                <Text style={[styles.menuText, { color: isDarkMode ? '#fff' : '#333' }]}>Discography</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  router.push('/notification-page');
                  toggleMenu();
                }}
              >
                <Ionicons name="notifications-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
                <Text style={[styles.menuText, { color: isDarkMode ? '#fff' : '#333' }]}>Notifications</Text>
                {hasUnread && <View style={styles.menuNotificationDot} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  handleSettingsPress();
                  toggleMenu();
                }}
              >
                <Ionicons name="settings-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
                <Text style={[styles.menuText, { color: isDarkMode ? '#fff' : '#333' }]}>Settings</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <View style={styles.profileContent}>
          {user.profileImageUrl ? (
            <View style={[
              styles.profileImageContainer,
              { borderColor: getBorderColor(user.gender) }
            ]}>
              {animatedBorder && (
                <Image
                  source={animatedBorder}
                  style={styles.animatedBorder}
                />
              )}
              <Image
                source={{ uri: user.profileImageUrl }}
                style={styles.profilePicture}
              />
            </View>
          ) : (
            <View style={[
              styles.profileImageContainer,
              styles.placeholderImage,
              { borderColor: getBorderColor(user.gender) }
            ]} />
          )}
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: isDarkMode ? '#fff' : '#333' }]}>{user.name}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color={getTextColor(user.gender)} />
              <Text style={[styles.location, { color: getTextColor(user.gender) }]}>{user.location}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <View style={[styles.inputContent, {
                borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
              }]}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>Music Preference</Text>
                {musicPreference.length > 0 ? (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#fff' : '#333' }]}>
                    {musicPreference.join(', ')}
                  </Text>
                ) : (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>
                    No music preferences set
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputContent, {
                borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
              }]}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>Tune of the Month</Text>
                {tuneOfMonthLoaded && tuneOfMonth && tuneOfMonth.albumArt ? (
                  <View style={styles.songContainer}>
                    <Image source={{ uri: tuneOfMonth.albumArt }} style={styles.albumArt} />
                    <View style={styles.songInfo}>
                      <Text style={[styles.songTitle, { color: isDarkMode ? '#fff' : '#333' }]}>{tuneOfMonth.name}</Text>
                      <Text style={[styles.songArtist, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>{tuneOfMonth.artist}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>No tune of the month set</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputContent, {
                borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
              }]}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>Favorite Artists</Text>
                {favoriteArtists.length > 0 ? (
                  favoriteArtists.map((artist) => (
                    <View key={artist.id} style={styles.artistContainer}>
                      <Image source={{ uri: artist.picture }} style={styles.artistImage} />
                      <Text style={[styles.artistName, { color: isDarkMode ? '#fff' : '#333' }]}>{artist.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>No favorite artists set</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputContent, {
                borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
              }]}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>Favorite Album</Text>
                {favoriteAlbumData ? (
                  <View style={styles.albumContainer}>
                    <Image source={{ uri: favoriteAlbumData.albumArt }} style={styles.albumArt} />
                    <View style={styles.albumInfo}>
                      <Text style={[styles.albumName, { color: isDarkMode ? '#fff' : '#333' }]}>{favoriteAlbumData.name}</Text>
                      <Text style={[styles.albumArtist, { color: isDarkMode ? '#9BA1A6' : '#666' }]}>{favoriteAlbumData.artist}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>No favorite album set</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputContent, {
                borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
              }]}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>My Favorite Performance</Text>
                {favoritePerformance ? (
                  <Image source={{ uri: favoritePerformance }} style={styles.imageInput} />
                ) : (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>No favorite performance set</Text>
                )}
              </View>
            </View>

            {prompts.map((prompt, index) => (
              <View key={index} style={styles.inputContainer}>
                <View style={[styles.inputContent, {
                  borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                  backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
                }]}>
                  <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>{prompt.question}</Text>
                  <Text style={[styles.inputText, { color: isDarkMode ? '#fff' : '#333' }]}>{prompt.answer}</Text>
                </View>
              </View>
            ))}

            <View style={styles.inputContainer}>
              <View style={[styles.inputContent, {
                borderColor: isDarkMode ? '#2d3235' : '#FFFFFF',
                backgroundColor: isDarkMode ? '#2d3235' : '#FFFFFF'
              }]}>
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#333' }]}>My Disposables</Text>
                {user.myDisposables.length > 0 ? (
                  user.myDisposables.map((disposable, index) => (
                    <View key={index} style={styles.disposableContainer}>
                      <Image source={{ uri: disposable.url }} style={styles.disposableImage} />
                    </View>
                  ))
                ) : (
                  <Text style={[styles.inputText, { color: isDarkMode ? '#9BA1A6' : '#333' }]}>No disposable photos selected</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNavBarContainer}>
          <BottomNavBar />
        </View>
      </SafeAreaView>
    </ThemeProvider>
  );
}
// End of Profile component render

// Define StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 1,
    paddingBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 5,
  },
  settingsButton: {
    padding: 5,
  },
  notificationButton: {
    padding: 5,
    position: 'relative',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 30,
    paddingTop: 5,
    paddingBottom: 13,
  },
  profileImageContainer: {
    borderWidth: 3,
    borderRadius: 50,
    overflow: 'hidden',
    width: 85,
    height: 85,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    zIndex: 0,
    position: 'relative',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 15,
    marginLeft: 4,
  },
  placeholderImage: {
    backgroundColor: '#f7e9da',
  },
  content: {
    paddingTop: 10,
    paddingLeft: 30,
    paddingRight: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  inputContent: {
    borderWidth: 15,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
  },
  inputText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  songArtist: {
    marginTop: 1,
    fontSize: 11,
    color: '#333',
  },
  songInfo: {
    flex: 1,
  },
  artistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistImage: {
    width: 65,
    height: 65,
    borderRadius: 50,
    marginRight: 15,
    marginLeft: 15,
    marginTop: 4,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  albumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 15,
    marginLeft: 15,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  albumArtist: {
    marginTop: 1,
    fontSize: 11,
    color: '#666',
  },
  promptContainer: {
    marginBottom: 1,
  },
  promptQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  promptAnswer: {
    fontSize: 20,
    color: '#666',
  },
  notificationDot: {
    position: 'absolute',
    right: 3,
    top: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  animatedBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    zIndex: 1, // Ensure animated border is on top
  },
  cameraButton: {
    padding: 5,
  },
  discoverButton: {
    padding: 5,
  },
  disposableContainer: {
    backgroundColor: '#fff',
    padding: 10,
    paddingBottom: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  disposableImage: {
    width: 250,
    height: 250,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  disposablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
    paddingTop: 10,
  },
  leftHeaderButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  menuButton: {
    padding: 5,
  },
  menuNotificationDot: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
});

