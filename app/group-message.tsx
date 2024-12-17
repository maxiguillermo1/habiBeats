import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { doc, setDoc, updateDoc, arrayUnion, onSnapshot, Timestamp, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { censorMessage } from './settings/hidden-words';
import { ThemeContext } from '../context/ThemeContext';

interface Message {
    id: string;
    message: string;
    senderId: string;
    senderName: string;
    timestamp: number;
}

interface GroupMember {
    uid: string;
    displayName: string;
    profileImageUrl: string;
}

interface User {
    uid: string;
    displayName: string;
    profileImageUrl: string;
}

const GroupMessageScreen = () => {
    const { groupId, groupName } = useLocalSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const navigation = useNavigation();
    const [groupImage, setGroupImage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [userHiddenWords, setUserHiddenWords] = useState<string[]>([]);
    const [isGroupInfoVisible, setIsGroupInfoVisible] = useState(false);
    const [isGroupCreator, setIsGroupCreator] = useState(false);
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

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
        if (!auth.currentUser || !groupId) return;

        setIsLoading(true);
        const groupRef = doc(db, 'groups', groupId as string);

        const unsubscribe = onSnapshot(groupRef, async (snapshot) => {
            if (snapshot.exists()) {
                const groupData = snapshot.data();
                setMessages(groupData.messages || []);
                setGroupImage(groupData.groupImage || 'https://via.placeholder.com/50');

                // Fetch group members
                if (groupData.members) {
                    const memberPromises = groupData.members.map(async (memberId: string) => {
                        const userRef = doc(db, 'users', memberId);
                        const userData = (await getDoc(userRef)).data();
                        if (userData) {
                            return {
                                uid: memberId,
                                displayName: userData.displayName,
                                profileImageUrl: userData.profileImageUrl
                            };
                        }
                        return null;
                    });

                    const members = await Promise.all(memberPromises);
                    setGroupMembers(members.filter((member): member is GroupMember => member !== null));
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [groupId]);

    // Effect to check if the current user is the group creator
    useEffect(() => {
        if (!auth.currentUser || !groupId) return;
        
        const groupRef = doc(db, 'groups', groupId as string);
        getDoc(groupRef).then((doc) => {
            if (doc.exists()) {
                setIsGroupCreator(doc.data().createdBy === auth.currentUser?.uid);
            }
        });
    }, [groupId]);

    // Effect to fetch user's hidden words from Firestore
    useEffect(() => {
        const fetchHiddenWords = async () => {
            if (!auth.currentUser) return;
            
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            // If the user document exists and contains hidden words, set the state
            if (userDoc.exists() && userDoc.data().hiddenWords) {
                setUserHiddenWords(userDoc.data().hiddenWords);
            }
        };

        fetchHiddenWords();
    }, []);

    // Function to send a new message to the group
    const sendMessage = async () => {
        if (newMessage.trim() === '' || !auth.currentUser) return;

        const message = newMessage;
        setNewMessage('');

        const groupRef = doc(db, 'groups', groupId as string);
        const currentUser = auth.currentUser;
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const senderName = userDoc.data()?.displayName || 'Unknown User';

        // Create new message object with sender info and timestamp
        const newMessageObj = {
            message: message,
            senderId: currentUser.uid,
            senderName: senderName,
            timestamp: Timestamp.now()
        };

        // Update the group document with the new message
        await updateDoc(groupRef, {
            messages: arrayUnion(newMessageObj)
        });
    };

    // Handler for long-pressing a message (enables deletion for own messages)
    const handleLongPress = (message: Message) => {
        if (message.senderId === auth.currentUser?.uid) {
            setSelectedMessage(message);
            setIsDeleteModalVisible(true);
        }
    };

    // Function to delete a selected message
    const handleDeleteMessage = async () => {
        if (!selectedMessage || !auth.currentUser) return;

        try {
            const groupRef = doc(db, 'groups', groupId as string);
            const groupDoc = await getDoc(groupRef);
            
            if (!groupDoc.exists()) {
                throw new Error("Group not found");
            }

            // Find and remove the selected message from the messages array
            const currentMessages = groupDoc.data().messages || [];
            const messageIndex = currentMessages.findIndex(
                (msg: Message) => 
                    msg.message === selectedMessage.message && 
                    msg.senderId === selectedMessage.senderId
            );

            if (messageIndex === -1) {
                throw new Error("Message not found");
            }

            currentMessages.splice(messageIndex, 1);
            await updateDoc(groupRef, { messages: currentMessages });

            // Update local state and reset selection
            setMessages(currentMessages);
            setIsDeleteModalVisible(false);
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
            Alert.alert("Error", "Failed to delete message. Please try again.");
        }
    };

    // Function to remove a member from the group (group creator only)
    const handleRemoveMember = async (memberUid: string) => {
        if (!isGroupCreator || !auth.currentUser || !groupId) return;

        try {
            const groupRef = doc(db, 'groups', groupId as string);
            const groupDoc = await getDoc(groupRef);
            
            if (!groupDoc.exists()) return;

            // Remove member from group's members array
            const updatedMembers = groupDoc.data().members.filter((uid: string) => uid !== memberUid);
            await updateDoc(groupRef, { members: updatedMembers });

            // Remove group from member's groupList in their user document
            const memberRef = doc(db, 'users', memberUid);
            const memberDoc = await getDoc(memberRef);
            
            if (memberDoc.exists()) {
                const updatedGroupList = memberDoc.data().groupList.filter(
                    (group: any) => group.groupId !== groupId
                );
                await updateDoc(memberRef, { groupList: updatedGroupList });
            }

            Alert.alert('Success', 'Member removed from group');
        } catch (error) {
            console.error('Error removing member:', error);
            Alert.alert('Error', 'Failed to remove member');
        }
    };

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
                setSearchResults([]);
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

            // Check for mutual likes and existing members
            for (const doc of querySnapshot.docs) {
                const userData = doc.data() as User & { matches?: Record<string, string> };
                const userMatches = userData.matches || {};

                // Only include user if:
                // 1. They are not the current user
                // 2. Current user has liked them
                // 3. They have liked the current user back
                // 4. They are not already in the group
                if (
                    userData.uid !== auth.currentUser.uid && 
                    likedUserIds.includes(userData.uid) && 
                    userMatches[auth.currentUser.uid] === 'liked' &&
                    !groupMembers.some(member => member.uid === userData.uid)
                ) {
                    usersData.push({
                        uid: userData.uid,
                        displayName: userData.displayName,
                        profileImageUrl: userData.profileImageUrl,
                    });
                }
            }

            setSearchResults(usersData);
        } catch (error) {
            console.error('Error searching users:', error);
            Alert.alert('Error', 'Failed to search users');
        }
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;

        try {
            const groupRef = doc(db, 'groups', groupId as string);
            
            // Add new members to the group
            await updateDoc(groupRef, {
                members: arrayUnion(...selectedUsers.map(user => user.uid))
            });

            // Add group to each new member's groupList
            const updatePromises = selectedUsers.map(async (user) => {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    groupList: arrayUnion({
                        groupId: groupId,
                        groupName: groupName,
                        groupOwner: auth.currentUser?.uid,
                        timestamp: new Date()
                    })
                });
            });

            await Promise.all(updatePromises);

            // Reset states and close modal
            setSelectedUsers([]);
            setSearchQuery('');
            setIsAddingMembers(false);
            Alert.alert('Success', 'New members added to the group');
        } catch (error) {
            console.error('Error adding members:', error);
            Alert.alert('Error', 'Failed to add members');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#fff8f0' }}>
            <SafeAreaView style={isDarkMode ? styles.darkContainer : styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={isDarkMode ? styles.darkHeader : styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Image 
                            source={{ uri: groupImage }} 
                            style={styles.groupImage} 
                        />
                        <Text style={isDarkMode ? styles.darkGroupName : styles.groupName}>{groupName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsGroupInfoVisible(true)}>
                        <Ionicons name="information-circle-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
                    </TouchableOpacity>
                </View>

                {/* Add FlatList for messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onLongPress={() => handleLongPress(item)}
                            delayLongPress={500}
                        >
                            <View style={item.senderId === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage}>
                                <Text style={isDarkMode ? styles.darkSenderName : styles.senderName}>{item.senderName}</Text>
                                <Text style={styles.messageText}>
                                    {item.senderId === auth.currentUser?.uid 
                                        ? item.message 
                                        : censorMessage(item.message, userHiddenWords)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.messageList}
                />

                {/* Add input container */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={isDarkMode ? styles.darkInputContainer : styles.inputContainer}>
                        <TextInput
                            style={isDarkMode ? styles.darkInput : styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={isDarkMode ? '#B0BEC5' : '#666'}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={sendMessage}
                        >
                            <Text style={styles.sendButtonText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                {/* Add delete modal */}
                <Modal
                    transparent={true}
                    visible={isDeleteModalVisible}
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={isDarkMode ? styles.darkModalContent : styles.modalContent}>
                            <Text style={isDarkMode ? styles.darkModalTitle : styles.modalTitle}>Delete Message</Text>
                            <Text style={isDarkMode ? styles.darkModalText : styles.modalText}>Are you sure you want to delete this message?</Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setIsDeleteModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.deleteButton]}
                                    onPress={handleDeleteMessage}
                                >
                                    <Text style={styles.modalButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Group Info Modal */}
                <Modal
                    transparent={true}
                    visible={isGroupInfoVisible}
                    onRequestClose={() => setIsGroupInfoVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={[
                            isDarkMode ? styles.darkModalContent : styles.modalContent,
                            styles.groupInfoModal
                        ]}>
                            <View style={styles.groupInfoHeader}>
                                <Text style={isDarkMode ? styles.darkModalTitle : styles.modalTitle}>
                                    Group Members ({groupMembers.length})
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setIsGroupInfoVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={groupMembers}
                                keyExtractor={(item) => item.uid}
                                renderItem={({ item }) => (
                                    <View style={styles.memberItem}>
                                        <Image 
                                            source={{ uri: item.profileImageUrl }} 
                                            style={styles.memberAvatar}
                                        />
                                        <Text style={[
                                            styles.memberName,
                                            { color: isDarkMode ? '#fff' : '#000' }
                                        ]}>
                                            {item.displayName}
                                        </Text>
                                        {isGroupCreator && item.uid !== auth.currentUser?.uid && (
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    Alert.alert(
                                                        'Remove Member',
                                                        `Are you sure you want to remove ${item.displayName}?`,
                                                        [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            { 
                                                                text: 'Remove', 
                                                                style: 'destructive',
                                                                onPress: () => handleRemoveMember(item.uid)
                                                            }
                                                        ]
                                                    );
                                                }}
                                                style={styles.removeMemberButton}
                                            >
                                                <Ionicons name="remove-circle-outline" size={24} color="#ff6b6b" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            />
                            {isGroupCreator && (
                                <>
                                    <TouchableOpacity
                                        style={styles.addMembersButton}
                                        onPress={() => setIsAddingMembers(true)}
                                    >
                                        <Text style={styles.addMembersButtonText}>Add Members</Text>
                                    </TouchableOpacity>

                                    <Modal
                                        transparent={true}
                                        visible={isAddingMembers}
                                        onRequestClose={() => setIsAddingMembers(false)}
                                    >
                                        <View style={styles.modalContainer}>
                                            <View style={[styles.modalContent, styles.addMembersModal]}>
                                                <Text style={styles.modalTitle}>Add New Members</Text>
                                                
                                                <TextInput
                                                    style={styles.searchInput}
                                                    placeholder="Search users..."
                                                    value={searchQuery}
                                                    onChangeText={(text) => {
                                                        setSearchQuery(text);
                                                        searchUsers(text);
                                                    }}
                                                />

                                                <FlatList
                                                    data={searchResults}
                                                    keyExtractor={(item) => item.uid}
                                                    renderItem={({ item }) => (
                                                        <TouchableOpacity
                                                            style={styles.userItem}
                                                            onPress={() => {
                                                                if (selectedUsers.some(u => u.uid === item.uid)) {
                                                                    setSelectedUsers(selectedUsers.filter(u => u.uid !== item.uid));
                                                                } else {
                                                                    setSelectedUsers([...selectedUsers, item]);
                                                                }
                                                            }}
                                                        >
                                                            <Image source={{ uri: item.profileImageUrl }} style={styles.userAvatar} />
                                                            <Text style={styles.userName}>{item.displayName}</Text>
                                                            {selectedUsers.some(u => u.uid === item.uid) && (
                                                                <Ionicons name="checkmark-circle" size={24} color="#fba904" />
                                                            )}
                                                        </TouchableOpacity>
                                                    )}
                                                />

                                                <View style={styles.modalButtons}>
                                                    <TouchableOpacity
                                                        style={[styles.modalButton, styles.cancelButton]}
                                                        onPress={() => {
                                                            setIsAddingMembers(false);
                                                            setSelectedUsers([]);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <Text style={styles.buttonText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.modalButton, styles.addButton]}
                                                        onPress={handleAddMembers}
                                                    >
                                                        <Text style={styles.buttonText}>Add Selected</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </Modal>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff8f0',
        marginLeft: 10,
        marginRight: 10,
    },
    darkContainer: {
        flex: 1,
        backgroundColor: '#121212',
        marginLeft: 10,
        marginRight: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff8f0',
        marginLeft: -10,
        marginRight: -10,
    },
    darkInputContainer: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#121212',
        marginLeft: -10,
        marginRight: -10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#fff',
    },
    darkInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
        color: '#FFFFFF',
        backgroundColor: '#1E1E1E',
    },
    sendButton: {
        backgroundColor: '#37bdd5',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#fff8f0',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#fba904',
        borderRadius: 20,
        padding: 10,
        margin: 5,
        maxWidth: '70%',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#facb6e',
        borderRadius: 20,
        padding: 10,
        margin: 5,
        maxWidth: '70%',
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 17,
    },
    header: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#fff8f0',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    darkHeader: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#121212',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 15,
    },
    groupImage: {
        width: 50,
        height: 50,
        borderRadius: 20,
        marginRight: 10,
    },
    groupName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    darkGroupName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
    },
    darkSenderName: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    messageList: {
        flexGrow: 1,
        justifyContent: 'flex-end',
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
        width: '80%',
        maxWidth: 300,
    },
    darkModalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    darkModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    darkModalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 10, 
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
    navbarGroupContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        marginTop: 10,
    },
    groupInfo: {
        flex: 1,
    },
    memberCount: {
        fontSize: 12,
        color: '#666',
    },
    groupInfoButton: {
        padding: 10,
    },
    groupInfoModal: {
        height: '50%',
        width: '90%',
    },
    groupInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 10,
    },
    closeButton: {
        padding: 5,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        justifyContent: 'space-between',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    memberName: {
        fontSize: 16,
    },
    removeMemberButton: {
        padding: 5,
    },
    addMembersButton: {
        backgroundColor: '#fba904',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
    addMembersButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    addMembersModal: {
        height: '70%',
        width: '90%',
        padding: 20,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginVertical: 10,
        width: 200
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        width: 210,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    userName: {
        flex: 1,
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#fba904',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default GroupMessageScreen;
