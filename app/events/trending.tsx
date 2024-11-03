// trending.tsx
// Maxwell Guillermo 

// START of trending page UI/UX
// START of Maxwell Guillermo Contribution

import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import BottomNavBar from '../../components/BottomNavBar';
import { Stack } from 'expo-router';
import TrendingEventCard  from '../../components/TrendingEventCard';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',    // "December"
    day: 'numeric',   // "2"
    year: 'numeric'   // "2024"
  });
};

const Trending = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <View style={styles.content}>
        <TrendingEventCard formatDate={formatDate} />
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