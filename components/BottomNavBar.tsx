import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';

const BottomNavBar = () => {
  const router = useRouter();
  const currentPath = usePathname();

  const navigateTo = (route: Href<string>) => {
    router.push(route);
  };

  const getNavItemStyle = (path: string) => {
    return currentPath === path ? styles.activeNavItem : styles.navItem;
  };

  const isEventActive = () => {
    return ['/events', '/search', '/trending'].includes(currentPath);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity onPress={() => navigateTo('/events')}>
        <Text style={[
          isEventActive() ? styles.activeNavItem : styles.navItem,
          styles.boldText
        ]}>Event</Text>
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
    paddingBottom: 20,
    paddingTop: 10,
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  },
  navItem: {
    fontSize: 14,
    color: 'black',
    marginHorizontal: 20,
  },
  activeNavItem: {
    fontSize: 14,
    color: '#FF69B4',
    marginHorizontal: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default BottomNavBar;