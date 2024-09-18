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
      <TouchableOpacity onPress={() => navigateTo('/search')}>
        <Text style={[getNavItemStyle('/search'), styles.boldText]}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('/trending')}>
        <Text style={[getNavItemStyle('/trending'), styles.boldText]}>Trending</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('/myevents')}>
        <Text style={[getNavItemStyle('/myevents'), styles.boldText]}>My Events</Text>
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
  },
  navItem: {
    fontSize: 14,
    color: 'black',
    marginHorizontal: 20,
  },
  activeNavItem: {
    fontSize: 14,
    color: '#fc6c85',
    marginHorizontal: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default TopNavBar;

// END of Top Navigation Bar UI/UX
// END of Maxwell Guillermo Contribution