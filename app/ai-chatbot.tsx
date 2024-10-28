// ai-chatbot.tsx
// Reyna Aguirre

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';


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

    <View style={styles.inputContainer}>
        <TextInput
            style={styles.input}
            placeholder={getPlaceholderText()}
            placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="arrow-up" size={24} color="#0e1514" />
        </TouchableOpacity>
    </View>
    
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
  inputContainer: {
    position: 'absolute',
    bottom: 110, 
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff8f0',
    borderTopWidth: 1,
    borderTopColor: '#fff8f0', // can be changed to #eee
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
});

export default Chatbot;
