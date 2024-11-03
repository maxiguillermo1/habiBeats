// myevents.tsx
// Maxwell Guillermo 

// START of my events page UI/UX
// START of Maxwell Guillermo Contribution

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import BottomNavBar from '../../components/BottomNavBar';
import { Stack } from 'expo-router';
import AttendingEvents from '../../components/AttendingEvents';
import FavoriteEvents from '../../components/FavoriteEvents';

const MyEvents = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>My Events</Text>
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
    backgroundColor: '#fff8f0', // Updated background color
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
    color: '#FF69B4',
  },
  spacer: {
    height: -5,
  },
});

export default MyEvents;

// END of my events page UI/UX
// END of Maxwell Guillermo Contribution