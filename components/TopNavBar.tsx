// TopNavBar.tsx
// Maxwell Guillermo 

// START of Top Navigation Bar UI/UX
// START of Maxwell Guillermo Contribution

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';

const TopNavBar = () => {
  const router = useRouter();
  const currentPath = usePathname();

  const navigateTo = (route: Href<string>) => {
    router.push(route);
  };

  const getNavItemStyle = (path: string) => {
    return currentPath === path ? styles.activeNavItem : styles.navItem;
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
    color: 'black',
  },
  activeNavItem: {
    fontSize: 14,
    color: '#fc6c85',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default TopNavBar;

// END of Top Navigation Bar UI/UX
// END of Maxwell Guillermo Contribution