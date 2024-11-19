// events.tsx
// Maxwell Guillermo and Mariann Grace Dizon

// START of Events Page 
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import BottomNavBar from '../../components/BottomNavBar';
import { Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Assuming you have a firebaseConfig file

const Events = () => {
  
const [isDarkMode, setIsDarkMode] = useState(false);

  // START of Mariann Grace Dizon Contribution
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
        {/* Content for events would go here */}
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

export default Events;

// END of Events Page UI/IX
// END of Maxwell Guillermo Contribution
