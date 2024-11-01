import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { doc, setDoc, collection, query, where, getDocs, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { Alert } from 'react-native';

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

  useEffect(() => {
    const newGroupId = doc(collection(db, 'groups')).id;
    setGroupId(newGroupId);
  }, []);

  // Fetch users from Firestore
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim() || !auth.currentUser) return;

    const usersRef = collection(db, 'users');
    // Create a query to find users with display names that start with the search query
    const q = query(usersRef, where('displayName', '>=', searchQuery), where('displayName', '<=', searchQuery + '\uf8ff'));
    // Execute the query and get the results
    const querySnapshot = await getDocs(q);

    // Convert the query results to an array of User objects
    const usersData: User[] = [];
    // Iterate over the query results
    querySnapshot.forEach((doc) => {
      // Get the user data from the document
      const userData = doc.data() as User;
      // Add the user to the array if the user is not the current user
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
              timestamp: new Date()
            })
          });
        }
      });

      await Promise.all(updatePromises);

      // Navigate back to messages page
      router.push({
        pathname: '/messages',
        params: {
          redirectTo: 'group-message',
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
        onFocus={() => setIsSearching(true)}
        onBlur={() => {
          if (searchQuery.trim() === '') {
            setIsSearching(false);
          }
        }}
      />

      <Text style={styles.selectedCount}>
        Selected: {selectedUsers.length} users
      </Text>

      {isSearching && searchQuery.trim() !== '' && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userItem}
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
              <Text style={styles.userName}>{item.displayName}</Text>
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
});

export default CreateGroup;