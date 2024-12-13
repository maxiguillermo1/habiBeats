import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import { doc, setDoc, collection, query, where, getDocs, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { ThemeContext } from '../context/ThemeContext';

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
  const [groupImage, setGroupImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [groupId, setGroupId] = useState('');
  const { user, userData } = useAuth();

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
    const newGroupId = doc(collection(db, 'groups')).id;
    setGroupId(newGroupId);
  }, []);

  // Fetch users from Firestore
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim() || !auth.currentUser) return;

    try {
      // First get current user's matches
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();
      const currentUserMatches = currentUserData?.matches || {};

      // Get UIDs of users that the current user has liked
      const likedUserIds = Object.entries(currentUserMatches)
        .filter(([_, status]) => status === 'liked')
        .map(([uid]) => uid);

      if (likedUserIds.length === 0) {
        setUsers([]);
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('displayName', '>=', searchQuery), 
        where('displayName', '<=', searchQuery + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      const usersData: User[] = [];

      // Check for mutual likes
      for (const doc of querySnapshot.docs) {
        const userData = doc.data() as User & { matches?: Record<string, string> };
        const userMatches = userData.matches || {};

        // Only include user if:
        // 1. They are not the current user
        // 2. Current user has liked them
        // 3. They have liked the current user back
        if (
          userData.uid !== auth.currentUser.uid && 
          likedUserIds.includes(userData.uid) && 
          userMatches[auth.currentUser.uid] === 'liked'
        ) {
          usersData.push({
            uid: userData.uid,
            displayName: userData.displayName,
            profileImageUrl: userData.profileImageUrl,
          });
        }
      }

      setUsers(usersData);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    }
  };

  // Toggle the selection of a user
  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some(u => u.uid === user.uid)) {
      setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const uploadImageToFirebase = async (uri: string) => {
    try {
      console.log("Starting group image upload to Firebase");
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `groupImage_${groupId}`;
      const storageRef = ref(storage, `groupImages/${filename}`);
      
      console.log("Uploading blob to Firebase Storage");
      await uploadBytes(storageRef, blob);
      
      console.log("Getting download URL");
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log("Image uploaded successfully, download URL:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image to Firebase:", error);
      throw error;
    }
  };

  const handleImagePicker = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const selectedAsset = result.assets[0];
        const downloadURL = await uploadImageToFirebase(selectedAsset.uri);
        setGroupImage(downloadURL);
        setUploading(false);
      }
    } catch (error) {
      console.error("Error in handleImagePicker:", error);
      Alert.alert("Error", "Failed to upload group image. Please try again.");
      setUploading(false);
    }
  };

  // Create a new group
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !auth.currentUser) return;

    try {
      let groupImageUrl = groupImage;

      // If no group image was uploaded, get current user's profile picture
      if (!groupImageUrl) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          groupImageUrl = userDoc.data().profileImageUrl;
        }
      }

      // Create a new group document in Firestore using the pre-generated groupId
      const groupRef = doc(db, 'groups', groupId);

      // Define the group data
      const groupData = {
        id: groupId,
        name: groupName,
        createdBy: auth.currentUser.uid,
        members: [...selectedUsers.map(u => u.uid), auth.currentUser.uid],
        createdAt: new Date(),
        messages: [],
        groupImage: groupImageUrl || ''
      };

      // Set the group data in the document
      await setDoc(groupRef, groupData);

      // Update groupList for all members including the creator
      const allMembers = [...selectedUsers.map(u => u.uid), auth.currentUser.uid];
      
      // Update each member's document with the new group
      const updatePromises = allMembers.map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          await updateDoc(userRef, {
            groupList: arrayUnion({
              groupId: groupId,
              groupName: groupName,
              groupOwner: user?.uid,
              timestamp: new Date()
            })
          });
        }
      });

      await Promise.all(updatePromises);

      // Replace the existing navigation code with this:
      router.replace({
        pathname: '/group-message',
        params: {
          groupId: groupId,
          groupName: groupName
        }
      });

    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff8f0' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkMode ? 'white' : 'black' }]}>Create Group</Text>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: isDarkMode ? '#2a2a2a' : 'white', color: isDarkMode ? 'white' : 'black' }]}
        placeholder="Group Name"
        placeholderTextColor={isDarkMode ? '#666' : '#999'}
        value={groupName}
        onChangeText={setGroupName}
      />

      <TextInput
        style={[styles.input, { backgroundColor: isDarkMode ? '#2a2a2a' : 'white', color: isDarkMode ? 'white' : 'black' }]}
        placeholder="Search Habibi"
        placeholderTextColor={isDarkMode ? '#666' : '#999'}
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchUsers(text);
        }}
        onFocus={() => setIsSearching(true)}
        onBlur={() => {
          if (searchQuery.trim() === '') {
            setIsSearching(false);
          }
        }}
      />

      <Text style={[styles.selectedCount, { color: isDarkMode ? '#ccc' : '#666' }]}>
        Selected: {selectedUsers.length} users
      </Text>

      <View style={styles.selectedUsersContainer}>
        {selectedUsers.map((user) => (
          <View key={user.uid} style={[styles.selectedUserItem, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' }]}>
            <Image source={{ uri: user.profileImageUrl }} style={styles.selectedUserAvatar} />
            <Text style={[styles.selectedUserName, { color: isDarkMode ? '#fff' : '#000' }]}>
              {user.displayName}
            </Text>
            <TouchableOpacity onPress={() => toggleUserSelection(user)}>
              <Ionicons name="close-circle" size={24} color="#fba904" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {isSearching && searchQuery.trim() !== '' && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { backgroundColor: isDarkMode ? '#2a2a2a' : 'transparent' }]}
              onPress={() => {
                toggleUserSelection(item);
                setSearchQuery('');
                setIsSearching(false);
              }}
            >
              <Image
                source={{ uri: item.profileImageUrl }}
                style={styles.avatar}
              />
              <Text style={[styles.userName, { color: isDarkMode ? 'white' : 'black' }]}>{item.displayName}</Text>
              {selectedUsers.some(u => u.uid === item.uid) && (
                <Ionicons name="checkmark-circle" size={24} color="#fba904" />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {!isSearching && (
        <>
          <TouchableOpacity 
            style={styles.imagePickerButton} 
            onPress={handleImagePicker}
          >
            {groupImage ? (
              <Image 
                source={{ uri: groupImage }} 
                style={styles.groupImagePreview} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={24} color="#666" />
                <Text style={styles.imagePlaceholderText}>Add Group Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {uploading && <ActivityIndicator size="large" color="#fba904" />}

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
        </>
      )}
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
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  groupImagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  selectedUsersContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectedUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  selectedUserName: {
    flex: 1,
    fontSize: 16,
  },
});

export default CreateGroup;