// BottomNavBar.tsx
// Jesus Donate Contribution

// START of Bottom Navigation Bar UI/UX
// START of Jesus Donate Contribution

import React from 'react';  
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
    <View style={styles.container}>
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigateTo('/events/search')}>
          <Ionicons 
            name="earth-outline" 
            size={18}
            style={[
              isEventActive() ? styles.activeNavItem : styles.navItem
            ]}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigateTo('/ai-chatbot')}>
          <Ionicons 
            name="heart-circle-outline" 
            size={18}
            style={[getNavItemStyle('/ai-chatbot')]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/discography')}>
          <Ionicons 
            name="compass-outline" 
            size={18}
            style={[getNavItemStyle('/discography')]}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigateTo('/disposable-camera')}
          style={styles.cameraButton}
        >
          <Ionicons 
            name="camera-outline" 
            size={22}
            style={[getNavItemStyle('/disposable-camera')]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/messages')}>
          <Ionicons 
            name="chatbubble-ellipses-outline" 
            size={18}
            style={[getNavItemStyle('/messages')]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/match')}>
          <Ionicons 
            name="people-circle-outline" 
            size={18}
            style={[getNavItemStyle('/match')]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/profile')}>
          <Ionicons 
            name="person-circle-outline" 
            size={18}
            style={[getNavItemStyle('/profile')]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  cameraButton: {
    backgroundColor: '#fff8f0',
    padding: 4,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  }
});

export default BottomNavBar;

// END of Bottom Navigation Bar UI/UX
// END of Jesus Donate Contribution
