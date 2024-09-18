// trending.tsx
// Maxwell Guillermo 

// START of trending page UI/UX
// START of Maxwell Guillermo Contribution

import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TopNavBar from '../components/TopNavBar';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';
import TrendingEventCard  from '../components/TrendingEventCard';

const Trending = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <View style={styles.content}>
        {/* Content for trending page will go here */}

        <TrendingEventCard/>
      </View>
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
});

export default Trending;

// END of trending page UI/UX
// END of Maxwell Guillermo Contribution