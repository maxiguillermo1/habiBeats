// ai-chatbot.tsx
// Reyna Aguirre

import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios'; 
import Icon from 'react-native-ico-mingcute-tiny-bold-filled';
import { searchSpotifyArtists, searchSpotifyAlbums, searchSpotifyTracks, getAlbumTracks } from '../api/spotify-api';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { ThemeContext } from '../context/ThemeContext';


const GEMINI_API_KEY = 'AIzaSyD6l21NbFiYT1QtW6H6iaIQMvKxwMAQ604';
const GENIUS_CLIENT_ID = 'iwKSJyXYREHteYohvjK1U9MXBjXMEA6WYcqLO04u4cp2Q8sZHa52RcuZDj8BZVm7';
const GENIUS_CLIENT_SECRET = 'HpmbJXRQ_0jpbdoaiP2Nii8gy9Wp9kSzYxl1mfpl9VPPlqKEh1hke-_hrsYJwWkOX22UbrrlLYQ1PG0xJJ4rRw';

const getGeniusAccessToken = async () => {
    try {
        const response = await axios.post('https://api.genius.com/oauth/token', {
            grant_type: 'client_credentials',
            client_id: GENIUS_CLIENT_ID,
            client_secret: GENIUS_CLIENT_SECRET
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Genius access token:', error);
        throw error;
    }
};

const fetchLyrics = async (trackName: string, artistName: string) => {
    try {
        const accessToken = await getGeniusAccessToken();
        
        const searchResponse = await axios.get(
            `https://api.genius.com/search?q=${encodeURIComponent(`${trackName} ${artistName}`)}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const hits = searchResponse.data.response.hits;
        if (hits.length === 0) {
            return 'Lyrics not found';
        }

        // Get the first matching result
        const songUrl = hits[0].result.url;
        
        return `You can find the lyrics at: ${songUrl}`;
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return 'Error fetching lyrics';
    }
};

const Chatbot = () => {
    const router = useRouter();

    // title animation
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(50);

    // button animations
    const weatherButtonOpacity = useSharedValue(0);
    const planMyOutfitButtonOpacity = useSharedValue(0);
    const weatherButtonTranslateY = useSharedValue(100);
    const planMyOutfitButtonTranslateY = useSharedValue(100);
    const spotifyButtonScale = useSharedValue(0);

    // START of Mariann Grace Dizon Contribution
    // Initialize Firebase Auth
    const auth = getAuth();

    // Initialize Firestore
    const db = getFirestore();

    // Use theme context
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

    // Update dark mode state when theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark');
    }, [theme]);

    // Fetch user's theme preference from Firebase
    useEffect(() => {
        if (!auth.currentUser) return;
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            const userData = docSnapshot.data();
            
            // Ensure userData is defined before accessing themePreference
            const userTheme = userData?.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

    useEffect(() => {
        titleOpacity.value = withSpring(1);
        titleTranslateY.value = withSpring(0);

        weatherButtonOpacity.value = withSpring(1);
        weatherButtonTranslateY.value = withSpring(20);

        planMyOutfitButtonOpacity.value = withSpring(1);
        planMyOutfitButtonTranslateY.value = withSpring(20);
    }, []);

    


    const animatedTitleStyle = useAnimatedStyle(() => {
        return {
            opacity: titleOpacity.value,
            transform: [{ translateY: titleTranslateY.value }],
        };
    });

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            opacity: weatherButtonOpacity.value && planMyOutfitButtonOpacity.value,
            transform: [{ translateY: weatherButtonTranslateY.value && planMyOutfitButtonTranslateY.value }],
        };
    });

    const [activeButton, setActiveButton] = React.useState<string | null>(null);

    // "what's the weather at event" button
    const handleAlbumButtonPressed = () => {
        setActiveButton(activeButton === 'album' ? null : 'album');
    };

    // "plan my outfit" button
    const handleLyricsButtonPressed = () => {
        setActiveButton(activeButton === 'lyrics' ? null : 'lyrics');
    };

    // placeholder text based on which button is pressed
    const getPlaceholderText = () => {
        switch (activeButton) {
            case 'album':
                return "tell me about this album...";
            case 'lyrics':
                return "analyze these lyrics...";
            default:
                return "how can i help you today?";
        }
    };

    // ai response code
    const [isLoading, setIsLoading] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [response, setResponse] = useState('');

    // Add new state to track chat history
    const [chatHistory, setChatHistory] = useState<{ 
        input: string; 
        response: string; 
        buttonType: string | null;
    }[]>([]);

    // Add state for Spotify URL near other state declarations
    const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null);

    // Add new state near other state declarations

    const generateAIResponse = async (userInput: string) => {
        setIsLoading(true);
        setResponse('');
        let prompt = '';

        // different prompts based on active button
        switch (activeButton) {
            case 'album':
                try {
                    // Parse user input to check for specific requests
                    const isLatestRequest = userInput.toLowerCase().includes('latest');
                    const isOldRequest = userInput.toLowerCase().includes('old') || userInput.toLowerCase().includes('first');
                    
                    // Clean the search query
                    const cleanQuery = userInput
                        .toLowerCase()
                        .replace(/latest|newest|recent|old|first/g, '')
                        .trim();

                    // Search for the artist
                    const artists = await searchSpotifyArtists(cleanQuery);
                    
                    if (artists.length === 0) {
                        setResponse('Sorry, I couldn\'t find that artist. Please try another name.');
                        setIsLoading(false);
                        return;
                    }

                    const mainArtist = artists[0];
                    
                    // Get albums and related artists
                    const [albums] = await Promise.all([
                        searchSpotifyAlbums(`artist:${mainArtist.name}`),
                    ]);

                    if (albums.length === 0) {
                        setResponse('No albums found for this artist.');
                        setIsLoading(false);
                        return;
                    }

                    // Select album and get its tracks
                    const targetAlbum = isOldRequest ? albums[albums.length - 1] : albums[0];
                    const albumTracks = await getAlbumTracks(targetAlbum.id);

                    prompt = `Here's the ${isOldRequest ? 'first' : 'latest'} album information for ${mainArtist.name}:
                             
                             Album: ${targetAlbum.name}
                             
                             Tracks: ${albumTracks.map((track: any) => track.name).join(', ')}
                             
                             Please provide a concise summary of this information, mentioning the album name and
                             a couple of tracks`;
                } catch (error) {
                    console.error('Error fetching Spotify data:', error);
                    setResponse('Sorry, I encountered an error while fetching music information. Please try again.');
                    setIsLoading(false);
                    return;
                }
                break;
                
            case 'lyrics':
                try {
                    // Clear any existing Spotify URL when starting a new search
                    setSpotifyUrl(null);
                    console.log('Starting lyrics search for:', userInput);
                    
                    const songArtistMatch = userInput.match(/^(.*?)\s+(?:by|-)\s+(.*)$/i);
                    let trackName, artistName;
                    
                    if (songArtistMatch) {
                        [, trackName, artistName] = songArtistMatch;
                        console.log('Parsed input - Track:', trackName, 'Artist:', artistName);
                        
                        const tracks = await searchSpotifyTracks(`track:${trackName} artist:${artistName}`);
                        console.log('Spotify search results:', tracks);
                        
                        if (tracks.length) {
                            const spotifyTrackUrl = `https://open.spotify.com/track/${tracks[0].id}`;
                            console.log('Found Spotify track URL:', spotifyTrackUrl);
                            setSpotifyUrl(spotifyTrackUrl);
                            
                            prompt = `Please analyze the song "${tracks[0].name}" by ${tracks[0].artists[0].name}. 
                                     Consider the following aspects:
                                     1. The song's overall theme and message
                                     2. Any notable musical elements
                                     3. The song's cultural or historical significance (if any)
                                     
                                     Please provide a brief, engaging analysis in 2-3 sentences.`;
                        }
                    } else {
                        console.log('Performing general search for:', userInput);
                        const tracks = await searchSpotifyTracks(userInput);
                        console.log('Spotify search results:', tracks);
                        
                        if (tracks.length) {
                            const spotifyTrackUrl = `https://open.spotify.com/track/${tracks[0].id}`;
                            console.log('Found Spotify track URL:', spotifyTrackUrl);
                            setSpotifyUrl(spotifyTrackUrl);
                            
                            prompt = `Please analyze the song "${tracks[0].name}" by ${tracks[0].artists[0].name}. 
                                     Consider the following aspects:
                                     1. The song's overall theme and message
                                     2. Any notable musical elements
                                     3. The song's cultural or historical significance (if any)
                                     
                                     Please provide a brief, engaging analysis in 2-3 sentences.`;
                        }
                    }
                } catch (error) {
                    console.error('Error:', error);
                    setResponse('Error fetching song information. Please try again.');
                    setIsLoading(false);
                    return;
                }
                break;
                
            default:
                prompt = `Please provide a brief response (2-3 sentences max) to: ${userInput}`;
        }

        try {
            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                {
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ]
                },
                {
                    params: { key: GEMINI_API_KEY },
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
                const generatedResponse = response.data.candidates[0].content.parts[0].text
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '');
                setResponse(generatedResponse);
                setChatHistory(prev => [...prev, { 
                    input: userInput, 
                    response: generatedResponse,
                    buttonType: activeButton
                }]);
            } else {
                setResponse('Sorry, I couldn\'t generate a response. Please try again.');
            }
        } catch (error) {
            console.error('Error generating AI response:', error);
            setResponse('Sorry, I encountered an error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (!userInput.trim()) {
            return;
        }

        generateAIResponse(userInput);
        setUserInput('');
        Keyboard.dismiss();
    };

    // Add ref for ScrollView
    const scrollViewRef = React.useRef<ScrollView>(null);

    const [showHelpModal, setShowHelpModal] = useState(false);

    const exampleQueries = {
        album: [
            "show me Taylor Swift's latest album",
            "what was Rihanna's first album",
            "tell me about Charli XCX's album"
        ],
        lyrics: [
            "analyze lyrics for Diva by Beyonce",
            "Umbrella by Rihanna"
        ]
    };

    useEffect(() => {
        if (spotifyUrl) {
            spotifyButtonScale.value = withSpring(1);
        } else {
            spotifyButtonScale.value = withSpring(0);
        }
    }, [spotifyUrl]);

    const animatedSpotifyButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: spotifyButtonScale.value }],
        };
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.innerContainer, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push('/profile')}
                >
                    <Ionicons name="chevron-back-outline" size={24} color={isDarkMode ? '#37bdd5' : 'rgba(55,189,213,0.6)'} />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <View style={styles.titleWrapper}>
                        <Animated.Text style={[styles.title, animatedTitleStyle, { color: isDarkMode ? '#fff' : '#0e1514' }]}>habibi ai chatbot</Animated.Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.helpButton}
                        onPress={() => setShowHelpModal(true)}
                    >
                        <Ionicons name="help-circle-outline" size={24} color={isDarkMode ? '#37bdd5' : 'rgba(55,189,213,0.6)'} />
                    </TouchableOpacity>
                </View>

                {spotifyUrl && (
                    <Animated.View style={[styles.spotifyButton, animatedSpotifyButtonStyle]}>
                        <TouchableOpacity 
                            onPress={() => Linking.openURL(spotifyUrl)}
                            style={[styles.spotifyButtonContent, { backgroundColor: isDarkMode ? '#1ED760' : '#1ED760' }]}
                        >
                            <Text style={styles.spotifyButtonText}>play on spotify</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <Animated.View style={[styles.iconButtonContainer, animatedButtonStyle]}>
                    {/* album button */}
                    <TouchableOpacity 
                        onPress={handleAlbumButtonPressed}
                        style={styles.iconButton}
                        activeOpacity={1}
                    >
                        <Ionicons 
                            name="musical-notes-outline" 
                            size={30} 
                            color={activeButton === 'album' ? 'rgba(252,108,133,1)' : isDarkMode ? '#37bdd5' : 'rgba(55,189,213,0.6)'}
                        />
                    </TouchableOpacity>

                    {/* lyrics button */}
                    <TouchableOpacity 
                        onPress={handleLyricsButtonPressed}
                        style={styles.iconButton}
                        activeOpacity={1}
                    >
                        <Ionicons 
                            name="volume-medium-outline" 
                            size={30} 
                            color={activeButton === 'lyrics' ? 'rgba(252,108,133,1)' : isDarkMode ? '#37bdd5' : 'rgba(55,189,213,0.6)'}
                        />
                    </TouchableOpacity>
                </Animated.View>

                {/* response container */}
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.responseContainer}
                    onContentSizeChange={() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                    }}
                >
                    {chatHistory.map((chat, index) => (
                        <View key={index} style={[styles.responseBox, { backgroundColor: isDarkMode ? '#2d2d2d' : '#fff' }]}>
                            <View style={styles.responseHeader}>
                                <View>
                                    <Text style={styles.inputLabel}>Input:</Text>
                                    <Text style={[styles.inputText, { color: isDarkMode ? '#fff' : '#0e1514' }]}>{chat.input}</Text>
                                    <Text style={styles.responseLabel}>Response:</Text>
                                </View>
                                {chat.buttonType && (
                                    <Ionicons 
                                        name={
                                            chat.buttonType === 'album' ? 'musical-notes-outline' :
                                            chat.buttonType === 'lyrics' ? 'volume-medium-outline' : 'help-circle'
                                        }
                                        size={16}
                                        color="rgba(252,108,133, 0.6)"
                                    />
                                )}
                            </View>
                            <Text style={[styles.responseText, { color: isDarkMode ? '#fff' : '#0e1514' }]}>{chat.response}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* user input container */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#fff' : '#0e1514' }]}
                            placeholder={getPlaceholderText()}
                            placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            value={userInput}
                            onChangeText={setUserInput}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity 
                            style={styles.sendButton}
                            onPress={handleSend}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#0e1514'} />
                            ) : (
                                <Ionicons name="arrow-up" size={24} color={isDarkMode ? '#fff' : '#0e1514'} />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <Modal
                    visible={showHelpModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowHelpModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowHelpModal(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2d2d2d' : '#fff' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#0e1514' }]}>Example Queries</Text>
                                <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                                    <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#0e1514'} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.querySection}>
                                <View style={styles.queryHeader}>
                                    <Ionicons name="musical-notes-outline" size={20} color="rgba(252,108,133,1)" />
                                    <Text style={[styles.querySectionTitle, { color: isDarkMode ? '#fff' : '#0e1514' }]}>Album</Text>
                                </View>
                                <Text style={[styles.queryText, { color: isDarkMode ? '#fff' : '#0e1514' }]}>{exampleQueries.album.join('\n')}</Text>
                            </View>
                            <View style={styles.querySection}>
                                <View style={styles.queryHeader}>
                                    <Ionicons name="volume-medium-outline" size={20} color="rgba(252,108,133,1)" />
                                    <Text style={[styles.querySectionTitle, { color: isDarkMode ? '#fff' : '#0e1514' }]}>Lyrics</Text>
                                </View>
                                <Text style={[styles.queryText, { color: isDarkMode ? '#fff' : '#0e1514' }]}>{exampleQueries.lyrics.join('\n')}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        left: 35,
        top: 30,
        zIndex: 1,
    },
    innerContainer: {
        flex: 1,
        paddingTop: 80,
        paddingHorizontal: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 20,
        position: 'relative',
    },
    titleWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    helpButton: {
        position: 'absolute',
        right:  50,
        padding: 10,
    },
    iconButtonContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 0,
    },
    iconButton: {
        marginHorizontal: 40,
    },
    responseContainer: {
        flex: 1,
        paddingHorizontal: 15,
        marginBottom: 140,
        marginTop: 50,
    },
    responseBox: {
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    responseText: {
        fontSize: 12,
        lineHeight: 20,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 25,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'transparent',
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        fontSize: 11,
        height: 36,
        textAlignVertical: 'center',
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
    },
    keyboardAvoidingView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fc6c85',
        marginBottom: 5,
    },
    inputText: {
        fontSize: 12,
        marginBottom: 20,
        marginHorizontal: 10,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    responseLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#37bdd5',
        marginBottom: 5,
    },
    responseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    querySection: {
        marginBottom: 20,
    },
    queryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    querySectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    queryText: {
        fontSize: 12,
        lineHeight: 20,
    },
    spotifyButton: {
        alignSelf: 'center',
        marginTop: 10,
    },
    spotifyButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    spotifyButtonContent: {
        padding: 10,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
});

export default Chatbot;
