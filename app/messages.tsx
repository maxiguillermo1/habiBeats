// messages.tsx
// Jesus Donate & Mariann Grace Dizon

import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, Alert } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, Timestamp, deleteDoc, updateDoc, deleteField, DocumentSnapshot, DocumentData, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, Provider } from 'react-native-paper';
import { censorMessage } from './settings/hidden-words';
import { ThemeContext } from '../context/ThemeContext'; // Import ThemeContext

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
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [groupConversations, setGroupConversations] = useState([]);
  const [userHiddenWords, setUserHiddenWords] = useState<string[]>([]);
  const params = useLocalSearchParams();

  // START of Mariann Grace Dizon Contribution
      // Use theme context
      const { theme, toggleTheme } = useContext(ThemeContext);
      const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  
      // Update dark mode state when theme changes
      useEffect(() => {
          setIsDarkMode(theme === 'dark');
      }, [theme]);
  
      // Fetch user's theme preference from Firebase
      useEffect(() => {
          if (!auth.currentUser) return;
          const userDoc = doc(db, 'users', auth.currentUser.uid);
          const unsubscribe = onSnapshot(userDoc, (docSnapshot: DocumentSnapshot<DocumentData>) => {
              const userData = docSnapshot.data();
              
              // Ensure userData is defined before accessing themePreference
              const userTheme = userData?.themePreference || 'light';
              setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
          });
  
          return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
      }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

  useEffect(() => {
    // This if statement checks if we need to redirect to group-message after creating a group
    if (params.redirectTo === 'group-message' && params.groupId && params.groupName) {
      // Store the params we need
      const groupId = params.groupId as string;
      const groupName = params.groupName as string;
      
      // Clear the redirect params by pushing to messages without params
      router.replace('/messages');
      
      // Then navigate to group-message
      router.push({
        pathname: '/group-message',
        params: {
          groupId,
          groupName
        }
      });
    }
  }, [params]);

  // START of Jesus Donate Contributation
  // Fetch existing conversations from Firestore
  const fetchConversations = useCallback(async () => {
    if (!auth.currentUser) return;

    // loading state for conversations
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

        // If the other user exists, add the conversation to the data array
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

    // Set the conversations data to the state and end loading state
    setConversations(conversationsData);
    setIsLoadingConversations(false);
  }, []);
  // END of Jesus Donate Contributation

  // START of Jesus Donate Contributation
  // Fetch new matches from Firestore
  const fetchNewMatches = useCallback(async () => {
    if (!auth.currentUser) return;

    // loading state for new matches
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

        // If the user exists, add them to the new matches data
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

    // Set the new matches data to the state and end loading state
    setNewMatches(newMatchesData);
    setIsLoadingMatches(false);
  }, []);
  // END of Jesus Donate Contributation

  // START of Jesus Donate Contributation
  // Fetch conversations and new matches when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      fetchNewMatches();
    }, [fetchConversations, fetchNewMatches])
  );
  // END of Jesus Donate Contributation

  // START of Jesus Donate Contributation
  // Navigate to the direct message screen
  const navigateToDirectMessage = (recipientId: string, recipientName: string) => {
    router.push({
      pathname: '/directmessage',
      params: { recipientId, recipientName },
    });
  };
  // END of Jesus Donate Contributation

  // START of Jesus Donate Contributation
  // Calculate and return a human-readable time difference
  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    // Convert Firestore timestamp to Date if necessary
    const date = timestamp instanceof Date ? timestamp : 
                 timestamp.toDate ? timestamp.toDate() : 
                 new Date(timestamp);

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
  // END of Jesus Donate Contributation

  // START of Jesus Donate Contributation
  const handleLongPress = (conversation: any) => {
    // Only allow long press for direct messages (conversations with recipientId)
    if (conversation.recipientId) {
      setSelectedConversation(conversation);
      setIsDeleteModalVisible(true);
    }
  };
  // END of Jesus Donate Contributation

  // START of Jesus Donate Contributation
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
  // END of Jesus Donate Contributation


  useEffect(() => {
    if (!auth?.currentUser) return;

    // Store interval ID for cleanup
    let pollInterval: NodeJS.Timeout;

    const pollMessages = async () => {
      // Fetch direct messages
      const fetchConversations = async () => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().conversationIds) {
          // ... existing conversation fetching logic ...
        }
      };

      // Fetch group messages
      const fetchGroupConversations = async () => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().groupList) {
          const groupPromises = userDoc.data().groupList.map(async (group: any) => {
            const groupRef = doc(db, 'groups', group.groupId);
            const groupDoc = await getDoc(groupRef);
            
            if (groupDoc.exists()) {
              const groupData = groupDoc.data();
              const lastMessage = groupData.messages?.[groupData.messages.length - 1];
              return {
                groupId: group.groupId,
                groupName: group.groupName,
                lastMessage: lastMessage?.message || 'No messages yet',
                timestamp: lastMessage?.timestamp || group.timestamp,
                groupImage: groupData.groupImage || 'https://via.placeholder.com/50'
              };
            }
            return null;
          });

          const groups = (await Promise.all(groupPromises)).filter(group => group !== null);
          setGroupConversations(groups as any);
        }
      };

      await fetchConversations();
      await fetchGroupConversations();
    };

    // Initial fetch
    pollMessages();

    // Set up polling interval
    pollInterval = setInterval(pollMessages, 4000);

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    const fetchHiddenWords = async () => {
      if (!auth.currentUser) return;
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserHiddenWords(userDoc.data().hiddenWords || []);
      }
    };

    fetchHiddenWords();
  }, []);

  return (
    <Provider>
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff8f0' }]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Menu
              visible={groupMenuVisible}
              onDismiss={() => setGroupMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setGroupMenuVisible(true)} style={styles.menuButton}>
                  <Ionicons name="people" size={24} color={isDarkMode ? '#fba904' : '#fba904'} />
                </TouchableOpacity>
              }
              contentStyle={[styles.menuContent, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff8f0' }]}
            >
              <Menu.Item 
                onPress={() => {
                  setGroupMenuVisible(false);
                  router.push('/create-group');
                }} 
                title="Create Group"
                titleStyle={[styles.menuItemText, { color: isDarkMode ? 'white' : '#666' }]}
              />
              <Menu.Item 
                onPress={() => {
                  setGroupMenuVisible(false);
                  router.push('/view-groups');
                }} 
                title="View Groups"
                titleStyle={[styles.menuItemText, { color: isDarkMode ? 'white' : '#666' }]}
              />
            </Menu>
          </View>
          {isLoadingConversations ? (
            <ActivityIndicator size="large" color="#fba904" />
          ) : (
            <>
              {[...conversations, ...groupConversations]
                .filter((conv: any) => {
                  // For direct messages
                  if (conv.recipientId) {
                    return conv.lastMessage && conv.lastMessage.trim() !== '';
                  }
                  // For group messages
                  return conv.lastMessage && conv.lastMessage !== 'No messages yet';
                })
                .sort((a: any, b: any) => {
                  const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
                  const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
                  return timeB.getTime() - timeA.getTime();
                })
                .map((conv: any) => (
                  <TouchableOpacity 
                    key={conv.groupId || conv.recipientId} 
                    style={[styles.messageItem, styles.messageBox, { backgroundColor: isDarkMode ? '#2a2a2a' : 'transparent' }]}
                    onPress={() => {
                      if (conv.groupId) {
                        router.push({
                          pathname: '/group-message',
                          params: {
                            groupId: conv.groupId,
                            groupName: conv.groupName
                          }
                        });
                      } else {
                        navigateToDirectMessage(conv.recipientId, conv.friendName);
                      }
                    }}
                    onLongPress={() => handleLongPress(conv)}
                    delayLongPress={500}
                  >
                    <Image 
                      source={{ 
                        uri: conv.groupId ? conv.groupImage : conv.profileImageUrl || 'https://via.placeholder.com/50'
                      }} 
                      style={styles.avatar} 
                    />
                    <View style={styles.messageContent}>
                      <Text style={[styles.name, { color: isDarkMode ? 'white' : 'black' }]}>{conv.groupId ? conv.groupName : conv.friendName}</Text>
                      <Text style={[styles.lastMessage, { color: isDarkMode ? '#ccc' : '#666' }]} numberOfLines={1}>
                        {conv.senderId === auth.currentUser?.uid 
                          ? conv.lastMessage 
                          : censorMessage(conv.lastMessage, userHiddenWords)}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, { color: isDarkMode ? '#999' : '#999' }]}>
                      {getTimeAgo(conv.timestamp)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </>
          )}
          <View style={styles.largeSpacer} />
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: isDarkMode ? '#fc6c85' : '#fc6c85' }]}>Send your first message!</Text>
            {isLoadingMatches ? (
              <ActivityIndicator size="large" color="#fba904" />
            ) : newMatches.length > 0 ? (
              <View style={styles.newMatchesContainer}>
                {newMatches.map((match) => (
                  <TouchableOpacity 
                    key={match.userId} 
                    style={styles.newMatchItem}
                    onPress={() => navigateToDirectMessage(match.userId, match.name)}
                  >
                    <View style={styles.matchContent}>
                      <Image source={{ uri: match.profileImageUrl }} style={styles.matchAvatar} />
                      <Text style={[styles.matchName, { color: isDarkMode ? 'white' : 'black' }]}>{match.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.noMatchesText, { color: isDarkMode ? '#ccc' : '#666' }]}>No new matches</Text>
            )}
          </View>
        </ScrollView>
        <BottomNavBar />
        <Modal
          transparent={true}
          visible={isDeleteModalVisible}
          onRequestClose={() => setIsDeleteModalVisible(false)}
        >
          {/* Modal for deleting a conversation */}
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2d3235' : 'white' }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? 'white' : 'black' }]}>Delete Conversation</Text>
              <Text style={[styles.modalText, { color: isDarkMode ? 'white' : 'black' }]}>Are you sure you want to delete this conversation?</Text>
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
    </Provider>
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
    marginBottom: 100,
  },
  title: {
    fontSize: 12.5,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fc6c85',
    marginLeft: 0,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageBox: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(251, 169, 4, 0.1)',
    padding: 15,
    marginHorizontal: 0,
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 15,
  },
  messageContent: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 8,
    color: '#666',
  },
  timeText: {
    fontSize: 10,
    color: '#999',
    position: 'absolute',
    top: 15,
    right: 15,
  },
  newMatchItem: {
    alignItems: 'flex-start',
    width: 120,
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
  groupMessageButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 40,
    marginTop: 35,
  },
  menuContent: {
    backgroundColor: '#fff8f0',
    borderRadius: 8,
    marginTop: 35,
  },
  menuItemText: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  newMatchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
  },
  matchContent: {
    alignItems: 'center',
  },
  matchAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  matchName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  spacer: {
    height: 30,
  },
  largeSpacer: {
    height: 100,
  },
  contentContainer: {
    marginHorizontal: 15,
  },
  menuButton: {
    padding: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 35,
  },
});

export default Messages;