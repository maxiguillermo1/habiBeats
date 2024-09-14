import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TopNavBar from '../components/TopNavBar';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';

const Search = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <View style={styles.content}>
        {/* Content for search page would go here */}
      </View>
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  content: {
    flex: 1,
  },
});

export default Search;
