// messages.tsx
// Maxwell Guillermo

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';

// Component for displaying messages
const Messages = () => {
  // Array of recent messages
  const recentMessages = [
    { id: 1, name: 'Gwen Stacy', message: 'Hey! I\'d love to go to that concert with you. Is the venue...', time: '4 minutes ago', avatar: 'https://example.com/gwen-stacy-avatar.jpg' },
    { id: 2, name: 'Miles Spider', message: 'Thanks for the playlist recommendation! I really enjoyed...', time: '2 hours ago', avatar: 'https://example.com/miles-spider-avatar.jpg' },
  ];

  // Object for new match
  const newMatch = { id: 3, name: 'Peni Prabhakar', avatar: 'https://example.com/peni-prabhakar-avatar.jpg' };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Recent Messages</Text>
        {recentMessages.map((message) => (
          <TouchableOpacity key={message.id} style={styles.messageItem}>
            <Image source={{ uri: message.avatar }} style={styles.avatar} />
            <View style={styles.messageContent}>
              <Text style={styles.name}>{message.name}</Text>
              <Text style={styles.messageText} numberOfLines={1}>{message.message}</Text>
            </View>
            <Text style={styles.timeText}>{message.time}</Text>
          </TouchableOpacity>
        ))}
        
        <Text style={styles.title}>Send your first message!</Text>
        <TouchableOpacity style={styles.newMatchItem}>
          <Image source={{ uri: newMatch.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{newMatch.name}</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fba904',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  messageContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  newMatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default Messages;
