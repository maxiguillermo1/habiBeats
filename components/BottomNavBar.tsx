// BottomNavBar.tsx
// Jesus Donate Contribution

// START of Bottom Navigation Bar UI/UX
// START of Jesus Donate Contribution

import React from 'react';  
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';

const BottomNavBar = () => {
  const router = useRouter();
  const currentPath = usePathname();

  // Navigate to a specific route
  const navigateTo = (route: Href<string>) => {
    router.back(); // Gets rid of previous page
    router.push(route); // Navigates to the new page
  };

  // Get the navigation item style based on the current path
  const getNavItemStyle = (path: string) => {
    return currentPath === path ? styles.activeNavItem : styles.navItem;
  };

  // Check if the current path is an event page
  const isEventActive = () => {
    return ['/myevents', '/search', '/trending'].includes(currentPath);
  };

  // Render the bottom navigation bar
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity onPress={() => navigateTo('/events/search')}>
        <Text style={[
          isEventActive() ? styles.activeNavItem : styles.navItem,
          styles.boldText
        ]}>Events</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('/ai-chatbot')}>
        <Text style={[getNavItemStyle('/ai-chatbot'), styles.boldText]}>Habibi</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('/messages')}>
        <Text style={[getNavItemStyle('/messages'), styles.boldText]}>Messages</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('/match')}>
        <Text style={[getNavItemStyle('/match'), styles.boldText]}>Match</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('/profile')}>
        <Text style={[getNavItemStyle('/profile'), styles.boldText]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 70,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff8f0',
  },
  navItem: {
    fontSize: 14,
    color: 'black',
    marginHorizontal: 12,
  },
  activeNavItem: {
    fontSize: 14,
    color: '#37bdd5',
    marginHorizontal: 12,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default BottomNavBar;

// END of Bottom Navigation Bar UI/UX
// END of Jesus Donate Contribution