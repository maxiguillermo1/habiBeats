// messages.tsx
// Maxwell Guillermo

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

interface Conversation {
  id: string;
  friendName: string;
  lastMessage: string;
  timestamp: Date;
  profileImageUrl: string;
}

// Component for displaying messages
const Messages = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query to get all messages where the current user is a participant
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Map to store conversations
      const conversationsMap = new Map();

      for (const doc of snapshot.docs) {
        const message = doc.data();

        // Find the other participant in the conversation
        const otherParticipant = message.participants.find((id:string) => id !== auth.currentUser?.uid);
        
        // If the conversation is not already in the map, add it
        if (!conversationsMap.has(otherParticipant)) {

          // Fetch the other participant's profile data
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', otherParticipant)));
          let profileImageUrl = '';
          if (!userDoc.empty) {
            profileImageUrl = userDoc.docs[0].data().profileImageUrl || '';
          }
          console.log(profileImageUrl);

          // Add the conversation to the map
          conversationsMap.set(otherParticipant, {
            id: otherParticipant,
            friendName: message.senderId === auth.currentUser?.uid ? message.recipientName : message.senderName,
            lastMessage: message.text,
            timestamp: message.timestamp.toDate(),
            profileImageUrl: profileImageUrl
          });
        }
      }

      // Convert the map to an array and set it as the state
      setConversations(Array.from(conversationsMap.values()) as Conversation[]);
    });

    return () => unsubscribe();
  }, []);

  // Function to navigate to the direct message screen  
  const navigateToDirectMessage = (recipientId: string, recipientName: string) => {
    router.push({
      pathname: '/directmessage',
      params: { recipientId, recipientName }
    });
  };

  // Function to get the time ago from a date
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Recent Messages</Text>
        {conversations.map((conversation) => (
          <TouchableOpacity 
            key={conversation.id} 
            style={styles.messageItem}
            onPress={() => navigateToDirectMessage(conversation.id, conversation.friendName)}
          >
            <Image 
              source={{ uri: conversation.profileImageUrl }} 
              style={styles.avatar} 
            />
            <View style={styles.messageContent}>
              <Text style={styles.name}>{conversation.friendName}</Text>
              <Text style={styles.messageText} numberOfLines={1}>{conversation.lastMessage}</Text>
            </View>
            <Text style={styles.timeText}>{getTimeAgo(conversation.timestamp)}</Text>
          </TouchableOpacity>
        ))}
        
        <Text style={styles.title}>Send your first message!</Text>
        <TouchableOpacity style={styles.newMatchItem}>
          <Image source={{ uri: 'https://example.com/peni-prabhakar-avatar.jpg' }} style={styles.avatar} />
          <Text style={styles.name}>Peni Prabhakar</Text>
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
