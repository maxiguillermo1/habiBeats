import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TopNavBar from '../components/TopNavBar';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';

const MyEvents = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <View style={styles.content}>
        {/* Content for my events page will go here */}
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

export default MyEvents;
