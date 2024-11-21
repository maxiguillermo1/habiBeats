// view-group.tsx
// Jesus Donate & Mariann Grace Dizon

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

// START of Jesus Donate Contribution
const ViewGroups = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            const userData = docSnapshot.data();
            
            // Ensure userData is defined before accessing themePreference
            const userTheme = userData?.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().groupList) {
      const groupPromises = userDoc.data().groupList.map(async (group: any) => {
        const groupRef = doc(db, 'groups', group.groupId);
        const groupDoc = await getDoc(groupRef);
        
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          const lastMessage = groupData.messages?.[groupData.messages.length - 1];
          return {
            ...group,
            groupImage: groupData.groupImage,
            lastMessage: lastMessage?.message || 'No messages yet',
            timestamp: lastMessage?.timestamp || groupData.createdAt,
            createdBy: groupData.createdBy,
            members: groupData.members
          };
        }
        return null;
      });

      const groupsData = (await Promise.all(groupPromises)).filter(group => group !== null);
      setGroups(groupsData);
    }
    setIsLoading(false);
  };

  const handleLeaveGroup = async (group: any) => {
    if (!auth.currentUser) return;

    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove user from group members
              const groupRef = doc(db, 'groups', group.groupId);
              const groupDoc = await getDoc(groupRef);
              
              if (!groupDoc.exists()) {
                throw new Error('Group not found');
              }

              // Get current members and remove the user
              const currentMembers = groupDoc.data().members || [];
              const updatedMembers = currentMembers.filter(
                (memberId: string) => memberId !== auth.currentUser!.uid
              );

              // Update group with new members list
              await updateDoc(groupRef, {
                members: updatedMembers
              });

              // Remove group from user's groupList
              const userRef = doc(db, 'users', auth.currentUser!.uid);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const currentGroupList = userDoc.data().groupList || [];
                const updatedGroupList = currentGroupList.filter(
                  (g: any) => g.groupId !== group.groupId
                );
                
                await updateDoc(userRef, {
                  groupList: updatedGroupList
                });
              }

              // Refresh groups list
              fetchGroups();
            } catch (error) {
              console.error("Error leaving group:", error);
              Alert.alert("Error", "Failed to leave group. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteGroup = async (group: any) => {
    if (!auth.currentUser || auth.currentUser.uid !== group.createdBy) {
      handleLeaveGroup(group);
      return;
    }

    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const groupRef = doc(db, 'groups', group.groupId);
              const groupDoc = await getDoc(groupRef);
              
              if (!groupDoc.exists()) {
                throw new Error('Group not found');
              }

              const members = groupDoc.data().members || [];

              // Remove group from all members' groupLists
              const removePromises = members.map(async (memberId: string) => {
                const userRef = doc(db, 'users', memberId);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                  const currentGroupList = userDoc.data().groupList || [];
                  const updatedGroupList = currentGroupList.filter(
                    (g: any) => g.groupId !== group.groupId
                  );
                  
                  await updateDoc(userRef, {
                    groupList: updatedGroupList
                  });
                }
              });

              // Wait for all member updates to complete
              await Promise.all(removePromises);

              // Delete the group document
              await deleteDoc(groupRef);

              // Refresh groups list
              fetchGroups();
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete group. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff8f0' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkMode ? 'white' : 'black' }]}>Your Groups</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.groupId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.groupItem, { backgroundColor: isDarkMode ? '#2a2a2a' : 'transparent' }]}
            onPress={() => router.push({
              pathname: '/group-message',
              params: {
                groupId: item.groupId,
                groupName: item.groupName
              }
            })}
          >
            <Image 
              source={{ uri: item.groupImage || 'https://via.placeholder.com/50' }}
              style={styles.groupImage}
            />
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: isDarkMode ? 'white' : 'black' }]}>{item.groupName}</Text>
              <Text style={[styles.lastMessage, { color: isDarkMode ? '#ccc' : '#666' }]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            <View style={styles.rightContent}>
              <Text style={[styles.timestamp, { color: isDarkMode ? '#999' : '#666' }]}>
                {item.timestamp?.toDate?.() 
                  ? item.timestamp.toDate().toLocaleDateString() 
                  : new Date(item.timestamp).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (auth.currentUser?.uid === item.createdBy) {
                    handleDeleteGroup(item);
                  } else {
                    handleLeaveGroup(item);
                  }
                }}
                style={styles.actionButton}
              >
                <Ionicons 
                  name={auth.currentUser?.uid === item.createdBy ? "trash" : "exit"} 
                  size={20} 
                  color="#ff4444" 
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  actionButton: {
    padding: 5,
  },
});

export default ViewGroups;
// END of Jesus Donate Contribution