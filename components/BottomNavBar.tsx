// BottomNavBar.tsx
// Jesus Donate Contribution

// START of Bottom Navigation Bar UI/UX
// START of Jesus Donate Contribution

import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext, ThemeProvider } from '../context/ThemeContext';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

const BottomNavBar = () => {
  const router = useRouter();
  const currentPath = usePathname();
  // END of Jesus Donate Contribution

  // START of Mariann Grace Dizon Contribution
  // Get theme context and initialize dark mode state
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  // Effect hook to sync theme with user preferences in Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current authenticated user
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        
        // Get reference to user document
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Set up real-time listener for theme preference changes
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            // Get user's theme preference, default to light if not set
            const userTheme = userData.themePreference || 'light';

            // Toggle theme if current state doesn't match user preference
            if ((userTheme === 'dark' && !isDarkMode) || 
                (userTheme === 'light' && isDarkMode)) {
              toggleTheme();
            }

            // Update dark mode state
            setIsDarkMode(userTheme === 'dark');
          }
        });

        // Clean up listener on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Call fetch function
    fetchUserData();
  }, [isDarkMode, toggleTheme]);
  // END of Mariann Grace Dizon

  // START of Jesus Donate
  // Navigate to a specific route
  const navigateTo = (route: Href) => {
    router.back(); // Gets rid of previous page
    router.push(route); // Navigates to the new page
  };

  // Get the navigation item style based on the current path
  const getNavItemStyle = (path: string) => {
    return {
      ...styles.navItem,
      color: currentPath === path ? '#37bdd5' : isDarkMode ? '#fff' : '#000',
    };
  };

  // Check if the current path is an event page
  const isEventActive = () => {
    return ['/myevents', '/search', '/trending'].includes(currentPath);
  };

  // Render the bottom navigation bar with fewer icons
  // START of Mariann Grace Dizon Contribution (Dark Mode)
  return (
    <View style={styles.container}>
      <View style={[styles.bottomNav, isDarkMode && { backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <TouchableOpacity onPress={() => navigateTo('/events/search')}>
          <Ionicons 
            name="earth-outline" 
            size={18}
            style={getNavItemStyle('/events/search')}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigateTo('/messages')}>
          <Ionicons 
            name="chatbubble-ellipses-outline" 
            size={18}
            style={getNavItemStyle('/messages')}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/disposable-camera')}>
          <Ionicons 
            name="camera-outline" 
            size={18}
            style={getNavItemStyle('/disposable-camera')}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/match')}>
          <Ionicons 
            name="people-circle-outline" 
            size={18}
            style={getNavItemStyle('/match')}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/profile')}>
          <Ionicons 
            name="person-circle-outline" 
            size={18}
            style={getNavItemStyle('/profile')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
// END of Mariann Grace Dizon Contribution (Dark Mode)

// START of Jesus Donate Contribution
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  navItem: {
    color: 'black',
    marginHorizontal: 2,
  },
  activeNavItem: {
    color: '#37bdd5',
    marginHorizontal: 2,
  },
});

export default BottomNavBar;
// END of Bottom Navigation Bar UI/UX
// END of Jesus Donate Contribution
