// ai-chatbot.tsx
// Reyna Aguirre

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios'; 
import Icon from 'react-native-ico-mingcute-tiny-bold-filled';
import { searchSpotifyArtists, searchSpotifyAlbums, searchSpotifyTracks, getSpotifyRelatedArtists, getAlbumTracks } from '../api/spotify-api';
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

    // title animation
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(50);

    // button animations
    const weatherButtonOpacity = useSharedValue(0);
    const planMyDayButtonOpacity = useSharedValue(0);
    const planMyOutfitButtonOpacity = useSharedValue(0);
    const weatherButtonTranslateY = useSharedValue(100);
    const planMyDayButtonTranslateY = useSharedValue(100);
    const planMyOutfitButtonTranslateY = useSharedValue(100);
    const spotifyButtonScale = useSharedValue(0);

    useEffect(() => {
        titleOpacity.value = withSpring(1);
        titleTranslateY.value = withSpring(0);

        weatherButtonOpacity.value = withSpring(1);
        weatherButtonTranslateY.value = withSpring(20);

        planMyDayButtonOpacity.value = withSpring(1);
        planMyDayButtonTranslateY.value = withSpring(20);

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
            opacity: weatherButtonOpacity.value && planMyDayButtonOpacity.value && planMyOutfitButtonOpacity.value,
            transform: [{ translateY: weatherButtonTranslateY.value && planMyDayButtonTranslateY.value && planMyOutfitButtonTranslateY.value }],
        };
    });

    const [activeButton, setActiveButton] = React.useState<string | null>(null);

    // "what's the weather at event" button
    const handleAlbumButtonPressed = () => {
        setActiveButton(activeButton === 'album' ? null : 'album');
    };

    // "plan my day" button
    const handleSimilarArtistsButtonPressed = () => {
        setActiveButton(activeButton === 'similarArtists' ? null : 'similarArtists');
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
            case 'similarArtists':
                return "find similar artists to...";
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
                    const [albums, relatedArtists] = await Promise.all([
                        searchSpotifyAlbums(`artist:${mainArtist.name}`),
                        getSpotifyRelatedArtists(mainArtist.id)
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
                
            case 'similarArtists':
                try {
                    // Search for the artist
                    const artists = await searchSpotifyArtists(userInput);
                    
                    if (artists.length === 0) {
                        setResponse('Sorry, I couldn\'t find that artist. Please try another name.');
                        setIsLoading(false);
                        return;
                    }

                    const mainArtist = artists[0];
                    
                    // Get related artists
                    const relatedArtists = await getSpotifyRelatedArtists(mainArtist.id);

                    if (relatedArtists.length === 0) {
                        setResponse('No similar artists found.');
                        setIsLoading(false);
                        return;
                    }

                    // Get top 3 related artists
                    const top3Artists = relatedArtists.slice(0, 3);
                    
                    // Get top tracks for each artist
                    const artistsWithTracks = await Promise.all(
                        top3Artists.map(async (artist: any) => {
                            const tracks = await searchSpotifyTracks(`artist:${artist.name}`);
                            return {
                                name: artist.name,
                                tracks: tracks.slice(0, 3).map((track: any) => track.name)
                            };
                        })
                    );
                    
                    prompt = `Here are 3 similar artists to ${mainArtist.name}:\n\n` +
                            artistsWithTracks.map((artist, index) => 
                                `${index + 1}. ${artist.name}\n` +
                                `   Popular tracks:\n` +
                                artist.tracks.map((track: any) => `   - ${track}`).join('\n')
                            ).join('\n\n');
                } catch (error) {
                    console.error('Error fetching Spotify data:', error);
                    setResponse('Sorry, I encountered an error while fetching similar artists. Please try again.');
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
        similarArtists: [
            "find similar artists to Olivia Rodrigo",
            "who sounds like Frank Ocean",
            "artists similar to Bad Bunny"
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
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.innerContainer}>
                <View style={styles.titleContainer}>
                    <View style={styles.titleWrapper}>
                        <Animated.Text style={[styles.title, animatedTitleStyle]}>habibi ai chatbot</Animated.Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.helpButton}
                        onPress={() => setShowHelpModal(true)}
                    >
                        <Ionicons name="help-circle-outline" size={24} color="rgba(55,189,213,0.6)" />
                    </TouchableOpacity>
                </View>

                {spotifyUrl && (
                    <Animated.View style={[styles.spotifyButton, animatedSpotifyButtonStyle]}>
                        <TouchableOpacity 
                            onPress={() => Linking.openURL(spotifyUrl)}
                            style={styles.spotifyButtonContent}
                        >
                            <Icon name="spotify" size={24}  />
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
                            color={activeButton === 'album' ? 'rgba(252,108,133,1)' : 'rgba(55,189,213,0.6)'}
                        />
                    </TouchableOpacity>

                    {/* similar artists button */}
                    <TouchableOpacity 
                        onPress={handleSimilarArtistsButtonPressed}
                        style={styles.iconButton}
                        activeOpacity={1}
                    >
                        <Ionicons 
                            name="heart-outline" 
                            size={27} 
                            color={activeButton === 'similarArtists' ? 'rgba(252,108,133,1)' : 'rgba(55,189,213,0.6)'}
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
                            color={activeButton === 'lyrics' ? 'rgba(252,108,133,1)' : 'rgba(55,189,213,0.6)'}
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
                        <View key={index} style={styles.responseBox}>
                            <View style={styles.responseHeader}>
                                <View>
                                    <Text style={styles.inputLabel}>Input:</Text>
                                    <Text style={styles.inputText}>{chat.input}</Text>
                                    <Text style={styles.responseLabel}>Response:</Text>
                                </View>
                                {chat.buttonType && (
                                    <Ionicons 
                                        name={
                                            chat.buttonType === 'album' ? 'musical-notes-outline' :
                                            chat.buttonType === 'similarArtists' ? 'heart-outline' :
                                            chat.buttonType === 'lyrics' ? 'volume-medium-outline' : 'help-circle'
                                        }
                                        size={16}
                                        color="rgba(252,108,133, 0.6)"
                                    />
                                )}
                            </View>
                            <Text style={styles.responseText}>{chat.response}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* user input container */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={getPlaceholderText()}
                            placeholderTextColor="#999"
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
                                <ActivityIndicator size="small" color="#0e1514" />
                            ) : (
                                <Ionicons name="arrow-up" size={24} color="#0e1514" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <BottomNavBar />

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
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Example Queries</Text>
                                <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                                    <Ionicons name="close" size={24} color="#0e1514" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.querySection}>
                                <View style={styles.queryHeader}>
                                    <Ionicons name="musical-notes-outline" size={20} color="rgba(252,108,133,1)" />
                                    <Text style={styles.querySectionTitle}>Album</Text>
                                </View>
                                <Text style={styles.queryText}>{exampleQueries.album.join('\n')}</Text>
                            </View>
                            <View style={styles.querySection}>
                                <View style={styles.queryHeader}>
                                    <Ionicons name="heart-outline" size={20} color="rgba(252,108,133,1)" />
                                    <Text style={styles.querySectionTitle}>Similar Artists</Text>
                                </View>
                                <Text style={styles.queryText}>{exampleQueries.similarArtists.join('\n')}</Text>
                            </View>
                            <View style={styles.querySection}>
                                <View style={styles.queryHeader}>
                                    <Ionicons name="volume-medium-outline" size={20} color="rgba(252,108,133,1)" />
                                    <Text style={styles.querySectionTitle}>Lyrics</Text>
                                </View>
                                <Text style={styles.queryText}>{exampleQueries.lyrics.join('\n')}</Text>
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
        backgroundColor: '#fff8f0',
        
    },
    innerContainer: {
        flex: 1,
        paddingTop: 40,
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
        color: '#0e1514',
        textAlign: 'center',
    },
    helpButton: {
        position: 'absolute',
        right:  80,
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
        backgroundColor: '#fff',
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
        color: '#0e1514',
        lineHeight: 20,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 25,
        paddingVertical: 8,
        backgroundColor: '#fff8f0',
        borderTopWidth: 1,
        borderTopColor: '#fff8f0',
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
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
        bottom: 110,
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
        color: '#0e1514',
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
        backgroundColor: '#fff',
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
        color: '#0e1514',
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
        color: '#0e1514',
        marginLeft: 10,
    },
    queryText: {
        fontSize: 12,
        color: '#0e1514',
        lineHeight: 20,
    },
    spotifyButton: {
        alignSelf: 'center',
        marginTop: 10,
    },
    spotifyButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1ED760',
        marginLeft: 5,
    },
    spotifyButtonContent: {
        padding: 10,
        borderRadius: 50,
        backgroundColor: '#fff',
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
