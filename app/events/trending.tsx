// trending.tsx
// Maxwell Guillermo and Mariann Grace Dizon

// START of trending page UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import BottomNavBar from '../../components/BottomNavBar';
import { Stack } from 'expo-router';
import TrendingEventCard from '../../components/TrendingEventCard';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',    // "December"
    day: 'numeric',   // "2"
    year: 'numeric'   // "2024"
  });
};

const Trending = () => {
  // START of MAriann Grace Dizon Contribution
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsDarkMode(userData.themePreference === 'dark'); // Set dark mode based on themePreference
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);
  // END of Mariann Grace Dizon Contribution

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <View style={styles.content}>
        <TrendingEventCard formatDate={formatDate} />
      </View>
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0', // Default light mode color
  },
  content: {
    flex: 1,
  },
  // Add any other styles that need to change based on the theme
});

export default Trending;

// END of trending page UI/UX
// END of Maxwell Guillermo Contribution