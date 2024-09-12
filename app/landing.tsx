import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

export default function Landing() {
  const router = useRouter();

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);

// Animated Flow for Title, Subtitle, and Button
  useEffect(() => {
    titleOpacity.value = withSpring(1);
    titleTranslateY.value = withSpring(0);
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));
    buttonOpacity.value = withDelay(300, withSpring(1));
    buttonTranslateY.value = withDelay(300, withSpring(0));
  }, []);

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    };
  });

  const animatedSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateY.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    };
  });

  // Navigates to Login/Signup screen when user presses continue button
  const handleContinue = () => {
    router.push('/login-signup');
  };

  // TEMPORARY: for index navigation purposes
  const handleBackPress = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Animated.Text style={[styles.title, animatedTitleStyle]}>HabiBeats</Animated.Text>
        <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>subtitle</Animated.Text>
      </View>
      <Animated.View style={animatedButtonStyle}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#37bdd5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#0e1514',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#37bdd5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 30,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 80,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#0e1514',
    fontWeight: 'bold',
  },
});
