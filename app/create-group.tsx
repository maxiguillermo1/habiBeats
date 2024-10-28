import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image } from 'react-native';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface User {
  uid: string;
  displayName: string;
  profileImageUrl: string;
}

const CreateGroup = () => {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Fetch users from Firestore
  const searchUsers = async (query: string) => {
    if (!query.trim() || !auth.currentUser) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '>=', query), where('displayName', '<=', query + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    
    const usersData: User[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      if (userData.uid !== auth.currentUser?.uid) {
        usersData.push({
          uid: userData.uid,
          displayName: userData.displayName,
          profileImageUrl: userData.profileImageUrl,
        });
      }
    });
    setUsers(usersData);
  };

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some(u => u.uid === user.uid)) {
      setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !auth.currentUser) return;

    const groupData = {
      name: groupName,
      createdBy: auth.currentUser.uid,
      members: [...selectedUsers.map(u => u.uid), auth.currentUser.uid],
      createdAt: new Date(),
      messages: []
    };

    try {
      const groupRef = doc(collection(db, 'groups'));
      await setDoc(groupRef, groupData);
      router.push({
        pathname: '/group-message',
        params: { groupId: groupRef.id, groupName: groupName }
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Group</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />

      <TextInput
        style={styles.input}
        placeholder="Search Users"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchUsers(text);
        }}
      />

      <Text style={styles.selectedCount}>
        Selected: {selectedUsers.length} users
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => toggleUserSelection(item)}
          >
            <Image
              source={{ uri: item.profileImageUrl }}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{item.displayName}</Text>
            {selectedUsers.some(u => u.uid === item.uid) && (
              <Ionicons name="checkmark-circle" size={24} color="#fba904" />
            )}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[
          styles.createButton,
          (!groupName.trim() || selectedUsers.length === 0) && styles.disabledButton
        ]}
        onPress={createGroup}
        disabled={!groupName.trim() || selectedUsers.length === 0}
      >
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
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
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  selectedCount: {
    margin: 20,
    color: '#666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  userName: {
    flex: 1,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#fba904',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CreateGroup;