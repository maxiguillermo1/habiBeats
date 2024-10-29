// ai-chatbot.tsx
// Reyna Aguirre

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios'; 

const GEMINI_API_KEY = 'AIzaSyD6l21NbFiYT1QtW6H6iaIQMvKxwMAQ604';


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
    const handleWeatherButtonPressed = () => {
        setActiveButton(activeButton === 'weather' ? null : 'weather');
    };

    // "plan my day" button
    const handlePlanMyDayButtonPressed = () => {
        setActiveButton(activeButton === 'planDay' ? null : 'planDay');
    };

    // "plan my outfit" button
    const handlePlanMyOutfitButtonPressed = () => {
        setActiveButton(activeButton === 'planShirt' ? null : 'planShirt');
    };

    // placeholder text based on which button is pressed
    const getPlaceholderText = () => {
        switch (activeButton) {
            case 'weather':
                return "what's the weather like during my event?";
            case 'planShirt':
                return "what should i wear for my event?";
            case 'planDay':
                return "help me plan the day for my event!";
            default:
                return "how can i help you today?";
        }
    };

    // ai response code
    const [isLoading, setIsLoading] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [response, setResponse] = useState('');

    // Add new state to track chat history
    const [chatHistory, setChatHistory] = useState<{ input: string; response: string }[]>([]);

    const generateAIResponse = async (userInput: string) => {
        setIsLoading(true);
        let prompt = '';

        // different prompts based on active button
        switch (activeButton) {
            case 'weather':
                prompt = `Provide a very brief (2-3 sentences max) response about the weather for this event: ${userInput}. Include only temperature and essential weather tips.`;
                break;
                
            case 'planShirt':
                prompt = `In 2-3 sentences max, suggest 1-2 outfit ideas for this event: ${userInput}. Be specific but concise.`;
                break;
                
            case 'planDay':
                prompt = `In 2-3 bullet points max, list the key timing and practical tips for this event: ${userInput}. Focus only on the most important details.`;
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
            
            const generatedResponse = response.data.candidates[0].content.parts[0].text;
            setResponse(generatedResponse);
            // Add to chat history
            setChatHistory(prev => [...prev, { input: userInput, response: generatedResponse }]);
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

    return (
        <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.Text style={[styles.title, animatedTitleStyle]}>habibi ai chatbot</Animated.Text>

        <Animated.View style={[styles.iconButtonContainer, animatedButtonStyle]}>
            {/* weather button */}
            <TouchableOpacity 
                onPress={handleWeatherButtonPressed}
                style={styles.iconButton}
                activeOpacity={1}
            >
                <Ionicons 
                    name="sunny" 
                    size={40} 
                    color={activeButton === 'weather' ? 'rgba(55,189,213,1)' : 'rgba(55,189,213,0.6)'}
                />
            </TouchableOpacity>

            {/* plan my outfit button */}
            <TouchableOpacity 
                onPress={handlePlanMyOutfitButtonPressed}
                style={styles.iconButton}
                activeOpacity={1}
            >
                <Ionicons 
                    name="shirt" 
                    size={37} 
                    color={activeButton === 'planShirt' ? 'rgba(55,189,213,1)' : 'rgba(55,189,213,0.6)'}
                />
            </TouchableOpacity>

            {/* plan my day button */}
            <TouchableOpacity 
                onPress={handlePlanMyDayButtonPressed}
                style={styles.iconButton}
                activeOpacity={1}
            >
                <Ionicons 
                    name="stopwatch" 
                    size={40} 
                    color={activeButton === 'planDay' ? 'rgba(55,189,213,1)' : 'rgba(55,189,213,0.6)'}
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
                    <Text style={styles.inputLabel}>Input:</Text>
                    <Text style={styles.inputText}>{chat.input}</Text>
                    <Text style={styles.responseLabel}>Response:</Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 20,
    color: '#0e1514',
    textAlign: 'center',
  },
  iconButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconButton: {
    marginHorizontal: 30,
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
    fontSize: 14,
    color: '#0e1514',
    lineHeight: 20,
},
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff8f0',
    borderTopWidth: 1,
    borderTopColor: '#fff8f0',
},
input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginRight: 10,
    fontSize: 11,
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
    color: '#37bdd5',
    marginBottom: 5,
},
  inputText: {
    fontSize: 14,
    color: '#0e1514',
    marginBottom: 10,
    fontStyle: 'italic',
},
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#37bdd5',
    marginBottom: 5,
},
});

export default Chatbot;
