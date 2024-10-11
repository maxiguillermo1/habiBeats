// messages.tsx
// Jesus Donate

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, Alert } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter } from 'expo-router';
import { doc, getDoc, Timestamp, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

// Define structure for conversation data
interface Conversation {
  recipientId: string;
  friendName: string;
  lastMessage: string;
  timestamp: Date;
  profileImageUrl: string;
}

// Define structure for new match data
interface NewMatch {
  userId: string;
  name: string;
  profileImageUrl: string;
}

// Main component for displaying messages and new matches
const Messages = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMatches, setNewMatches] = useState<NewMatch[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Fetch existing conversations from Firestore
  const fetchConversations = useCallback(async () => {
    if (!auth.currentUser) return;

    setIsLoadingConversations(true);

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Check if current user is auth
    if (!userDoc.exists()) {
      setIsLoadingConversations(false);
      return;
    }

    // Get user's conversationIds
    const userData = userDoc.data();
    const conversationIds = userData.conversationIds || {};

    
    const conversationsData: Conversation[] = [];

    // Iterate through conversation IDs and fetch conversation details
    for (const [recipientId, conversationId] of Object.entries(conversationIds)) {
      const conversationRef = doc(db, 'conversations', conversationId as string);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        const otherUserRef = doc(db, 'users', recipientId);
        const otherUserDoc = await getDoc(otherUserRef);

        if (otherUserDoc.exists()) {
          const otherUserData = otherUserDoc.data();
          conversationsData.push({
            recipientId: otherUserData.uid,
            friendName: otherUserData.displayName || `${otherUserData.firstName} ${otherUserData.lastName}`,
            lastMessage: conversationData.messages[conversationData.messages.length - 1]?.message || '',
            timestamp: conversationData.messages[conversationData.messages.length - 1]?.timestamp.toDate() || new Date(),
            profileImageUrl: otherUserData.profileImageUrl || '',
          });
        }
      }
    }

    // Sort conversations by timestamp in descending order (most recent is on top)
    conversationsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setConversations(conversationsData);
    setIsLoadingConversations(false);
  }, []);

  // Fetch new matches from Firestore
  const fetchNewMatches = useCallback(async () => {
    if (!auth.currentUser) return;

    setIsLoadingMatches(true);

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      setIsLoadingMatches(false);
      return;
    }

    const userData = userDoc.data();
    const conversationIds = userData.conversationIds || {};
    const matches = userData.matches || {};

    // Store new matches data
    const newMatchesData: NewMatch[] = [];

    // Iterate through matches and fetch details for new matches
    for (const [userId, status] of Object.entries(matches)) {
      // checks if the user has liked the current user and if they are not already in a conversation
      if (status === 'liked' && !conversationIds[userId]) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          newMatchesData.push({
            userId: userData.uid,
            name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
            profileImageUrl: userData.profileImageUrl || '',
          });
        }
      }
    }

    setNewMatches(newMatchesData);
    setIsLoadingMatches(false);
  }, []);

  // Fetch conversations and new matches when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      fetchNewMatches();
    }, [fetchConversations, fetchNewMatches])
  );

  // Navigate to the direct message screen
  const navigateToDirectMessage = (recipientId: string, recipientName: string) => {
    router.push({
      pathname: '/directmessage',
      params: { recipientId, recipientName },
    });
  };

  // Calculate and return a human-readable time difference
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

  const handleLongPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;
    const recipientId = selectedConversation.recipientId;
    const conversationId = [currentUserId, recipientId].sort().join('-');

    try {
      // Delete the conversation document
      await deleteDoc(doc(db, 'conversations', conversationId));

      // Update current user's conversationIds
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        [`conversationIds.${recipientId}`]: deleteField()
      });

      // Update recipient's conversationIds
      const recipientRef = doc(db, 'users', recipientId);
      await updateDoc(recipientRef, {
        [`conversationIds.${currentUserId}`]: deleteField()
      });

      // Remove the conversation from the local state
      setConversations(conversations.filter(conv => conv.recipientId !== recipientId));

      setIsDeleteModalVisible(false);
      setSelectedConversation(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      Alert.alert("Error", "Failed to delete conversation. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Recent Messages</Text>
        {isLoadingConversations ? (
          <ActivityIndicator size="large" color="#fba904" />
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <TouchableOpacity 
              key={conversation.recipientId} 
              style={styles.messageItem}
              onPress={() => navigateToDirectMessage(conversation.recipientId, conversation.friendName)}
              onLongPress={() => handleLongPress(conversation)}
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
          ))
        ) : (
          <Text style={styles.noMessagesText}>No recent messages</Text>
        )}
        
        <Text style={styles.title}>Send your first message!</Text>
        {isLoadingMatches ? (
          <ActivityIndicator size="large" color="#fba904" />
        ) : newMatches.length > 0 ? (
          newMatches.map((match) => (
            <TouchableOpacity 
              key={match.userId} 
              style={styles.newMatchItem}
              onPress={() => navigateToDirectMessage(match.userId, match.name)}
            >
              <Image source={{ uri: match.profileImageUrl }} style={styles.avatar} />
              <Text style={styles.name}>{match.name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noMatchesText}>No new matches</Text>
        )}
      </ScrollView>
      <BottomNavBar />
      <Modal
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Conversation</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this conversation?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteConversation}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Define styles for the Messages component
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
  noMessagesText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  noMatchesText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Messages;