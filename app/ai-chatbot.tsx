// ai-chatbot.tsx
// Reyna Aguirre

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';

const Chatbot = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Chatbot</Text>
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 20,
    color: '#fba904',
  }
});

export default Chatbot;