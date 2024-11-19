// myevents.tsx
// Maxwell Guillermo 

// START of my events page UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import BottomNavBar from '../../components/BottomNavBar';
import { Stack } from 'expo-router';
import AttendingEvents from '../../components/AttendingEvents';
import FavoriteEvents from '../../components/FavoriteEvents';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const MyEvents = () => {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <ScrollView style={styles.content}>
        <Text style={[styles.pageTitle, { color: isDarkMode ? '#FF69B4' : '#FF69B4' }]}>My Events</Text>
        <AttendingEvents />
        <View style={styles.spacer} />
        <FavoriteEvents />
      </ScrollView>
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
  pageTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 27,
    marginBottom: 8,
    marginLeft: 81,
    color: '#FF69B4', // Default color
  },
  spacer: {
    height: -5,
  },
});

export default MyEvents;

// END of my events page UI/UX
// END of Maxwell Guillermo Contribution