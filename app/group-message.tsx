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

    // Fetch hidden words
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

    const sendMessage = async () => {
        if (newMessage.trim() === '' || !auth.currentUser) return;

        const message = newMessage;
        setNewMessage('');

        const groupRef = doc(db, 'groups', groupId as string);
        const currentUser = auth.currentUser;
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const senderName = userDoc.data()?.displayName || 'Unknown User';

        const newMessageObj = {
            message: message,
            senderId: currentUser.uid,
            senderName: senderName,
            timestamp: Timestamp.now()
        };

        await updateDoc(groupRef, {
            messages: arrayUnion(newMessageObj)
        });
    };

    const handleLongPress = (message: Message) => {
        if (message.senderId === auth.currentUser?.uid) {
            setSelectedMessage(message);
            setIsDeleteModalVisible(true);
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage || !auth.currentUser) return;

        try {
            const groupRef = doc(db, 'groups', groupId as string);
            const groupDoc = await getDoc(groupRef);
            
            if (!groupDoc.exists()) {
                throw new Error("Group not found");
            }

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

            setMessages(currentMessages);
            setIsDeleteModalVisible(false);
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
            Alert.alert("Error", "Failed to delete message. Please try again.");
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
});

export default GroupMessageScreen;
