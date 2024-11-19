// TopNavBar.tsx
// Maxwell Guillermo 

// START of Top Navigation Bar UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { auth, db } from '../firebaseConfig'; // Assuming you have a firebaseConfig file
import { doc, getDoc } from 'firebase/firestore';

const TopNavBar = () => {
  const router = useRouter();
  const currentPath = usePathname();
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

  const navigateTo = (route: Href<string>) => {
    router.push(route);
  };

  const getNavItemStyle = (path: string) => {
    return currentPath === path
      ? [styles.activeNavItem, { color: '#fc6c85' }]
      : [styles.navItem, { color: isDarkMode ? '#fff' : '#000' }];
  };

  return (
    <View style={styles.topNav}>
      <TouchableOpacity style={styles.sideItem} onPress={() => navigateTo('/events/search')}>
        <Text style={[getNavItemStyle('/events/search'), styles.boldText]}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.centerItem} onPress={() => navigateTo('/events/trending')}>
        <Text style={[getNavItemStyle('/events/trending'), styles.boldText]}>Trending</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sideItem} onPress={() => navigateTo('/events/myevents')}>
        <Text style={[getNavItemStyle('/events/myevents'), styles.boldText]}>My Events</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 40,
    width: '100%',
    gap: 5,
  },
  sideItem: {
    width: '20%',
    alignItems: 'center',
  },
  centerItem: {
    width: '20%',
    alignItems: 'center',
  },
  navItem: {
    fontSize: 14,
  },
  activeNavItem: {
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default TopNavBar;

// END of Top Navigation Bar UI/UX
// END of Maxwell Guillermo Contribution