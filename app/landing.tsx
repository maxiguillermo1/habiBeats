// landing.tsx
// Reyna Aguirre 

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

export default function Landing() {
  const router = useRouter();

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const imageOpacity = useSharedValue(0);
  const imageTranslateY = useSharedValue(50);

// Animated Flow for Logo, Subtitle, Image, and Button
  useEffect(() => {
    logoOpacity.value = withSpring(1);
    logoTranslateY.value = withSpring(0);
    subtitleOpacity.value = withDelay(150, withSpring(1));
    subtitleTranslateY.value = withDelay(150, withSpring(0));
    imageOpacity.value = withDelay(300, withSpring(1));
    imageTranslateY.value = withDelay(300, withSpring(0));
    buttonOpacity.value = withDelay(450, withSpring(1));
    buttonTranslateY.value = withDelay(450, withSpring(0));
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ translateY: logoTranslateY.value }],
    };
  });

  const animatedSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateY.value }],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [{ translateY: imageTranslateY.value }],
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
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <Image 
            source={require('../assets/images/transparent_long_logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>finding your music connection</Animated.Text>
      </View>
      <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
        <Image 
          source={require('../assets/images/boy_landing_graphic.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 120, // FIXME: padding at the bottom to move content up
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 310,
    height: 70,
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#0e1514',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  image: {
    width: 215,
    height: 215,
  },
  continueButton: {
    backgroundColor: 'rgba(121, 206, 84, 1)', // light green
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
    color: '#fba904',
    fontWeight: 'bold',
  },
});
