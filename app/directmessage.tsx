// directmessage.tsx
// Jesus Donate & Mariann Grace Dizon

import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { doc, setDoc, updateDoc, arrayUnion, onSnapshot, Timestamp, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { censorMessage } from './settings/hidden-words';
import { sendPushNotification } from '../scripts/pushNotification';
import { addNotification } from '../scripts/notificationHandler';
import { ThemeContext, ThemeProvider } from '../context/ThemeContext';

// Define the message structure
interface Message {
    id: string;
    message: string;
    senderId: string;
    recipientId: string;
    timestamp: number;
}

// Define the DirectMessageScreen component
const DirectMessageScreen = () => {
    const { recipientId, recipientName } = useLocalSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const navigation = useNavigation();
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
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

    // Fetch hidden words from current user
    useEffect(() => {
        if (!auth.currentUser) return;
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            setUserHiddenWords(docSnapshot.data()?.hiddenWords || []);
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, []);

    // START of Jesus Donate Contribution
    // Fetches the messages from the database
    useEffect(() => {
        if (!auth.currentUser) return;

        // Loading screen is on
        setIsLoading(true);

        const conversationId = [auth.currentUser.uid, recipientId].sort().join('-');
        const conversationRef = doc(db, 'conversations', conversationId);

        const unsubscribe = onSnapshot(conversationRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const conversationData = docSnapshot.data();
                // Sort the messages by timestamp
                setMessages(conversationData.messages?.sort((a: Message, b: Message) => a.timestamp - b.timestamp) || []);
                // Fetch the profile image url of the recipient
                if (!profileImageUrl) {
                    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', recipientId)));
                    if (!userDoc.empty) {
                        setProfileImageUrl(userDoc.docs[0].data().profileImageUrl || '');
                    }
                }
            } else { // If the conversation does not exist, create it
                await setDoc(conversationRef, {
                    messages: []
                });
            }
            // Loading screen is off
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [recipientId, profileImageUrl]);

    // START of Jesus Donate Contribution
    // Sends a message to the recipient
    const sendMessage = async () => {
        const message = newMessage;
        setNewMessage('');

        if (message.trim() === '' || !auth.currentUser) return;

        const conversationId = [auth.currentUser.uid, recipientId].sort().join('-');
        const conversationRef = doc(db, 'conversations', conversationId);

        // Create the new message object
        const newMessageObj = {
            message: message,
            senderId: auth.currentUser.uid,
            recipientId: recipientId,
            timestamp: Timestamp.now()
        };

        // Check if the conversation already exists
        const conversationDoc = await getDoc(conversationRef);
        const isNewConversation = conversationDoc.data()?.messages.length === 0;
        console.log("Is new conversation:", isNewConversation);

        if (isNewConversation) {
            // Create new conversation document
            await setDoc(conversationRef, {
                messages: [newMessageObj]
            });

            // Update both users' conversationIds
            await updateUsersConversationIds(auth.currentUser.uid, recipientId as string, conversationId);
        } else {
            // Add message to existing conversation
            await updateDoc(conversationRef, {
                messages: arrayUnion(newMessageObj)
            });
        }

        // Get recipient's user document
        const recipientDoc = await getDoc(doc(db, 'users', recipientId as string));
        const recipientData = recipientDoc.data();
        const recipientToken = recipientData?.expoPushToken;

        // Add notification to recipient's notifications collection
        await addNotification(
            recipientId as string,
            `${auth.currentUser?.displayName || 'Someone'} sent you a message`,
            'directmessage',
            {
                screen: 'directmessage',
                recipientId: recipientId,
                recipientName: recipientName,
                senderId: auth.currentUser?.uid,
                senderName: auth.currentUser?.displayName,
                messageText: message.substring(0, 100)
            }
        );

        if (recipientToken) {
            try {
                await sendPushNotification(
                    recipientToken,
                    'New Message',
                    `${auth.currentUser?.displayName || 'Someone'} sent you a message`,
                    {
                        screen: 'directmessage',
                        recipientId: recipientId,
                        senderId: auth.currentUser?.uid,
                        messageText: message.substring(0, 100) // First 100 chars of message
                    }
                );
            } catch (error) {
                console.error('Error sending push notification:', error);
            }
        }
    };
    // END of Jesus Donate Contribution

    // START of Jesus Donate Contribution
    // Updates the conversationIds of the users in the database
    const updateUsersConversationIds = async (userId1: string, userId2: string, conversationId: string) => {
        const updateUser = async (userId: string, otherUserId: string) => {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            // If the user exists, update the conversationIds
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const conversationIds = userData.conversationIds || {};
                
                // If the other user is not in the conversationIds, add them
                if (!conversationIds[otherUserId]) {
                    await updateDoc(userRef, {
                        [`conversationIds.${otherUserId}`]: conversationId
                    });
                }
            }
        };

        // Update the conversationIds for both users
        await Promise.all([
            updateUser(userId1, userId2),
            updateUser(userId2, userId1)
        ]);
    };
    // END of Jesus Donate Contribution

    // START of Jesus Donate Contribution
    // When the user long presses on a message, the delete modal is shown
    const handleLongPress = (message: Message) => {
        if (message.senderId === auth.currentUser?.uid) {
            setSelectedMessage(message);
            setIsDeleteModalVisible(true);
        }
    };

    // START of Jesus Donate Contribution
    // Deletes a message from the conversation sent by the current user
    const handleDeleteMessage = async () => {
        if (!selectedMessage || !auth.currentUser) return;

        // Get the conversation id
        const conversationId = [auth.currentUser.uid, recipientId].sort().join('-');
        const conversationRef = doc(db, 'conversations', conversationId);

        try {
            // Fetch the current messages from Firestore
            const conversationDoc = await getDoc(conversationRef);
            if (!conversationDoc.exists()) {
                throw new Error("Conversation not found");
            }

            const currentMessages = conversationDoc.data().messages || [];

            // Find the index of the message to delete
            const messageIndex = currentMessages.findIndex(
                (msg: Message) => 
                    msg.message === selectedMessage.message && 
                    msg.senderId === selectedMessage.senderId
            );

            if (messageIndex === -1) {
                throw new Error("Message not found");
            }

            // Remove the message from the array
            currentMessages.splice(messageIndex, 1);

            // Update Firestore with the new messages array
            await updateDoc(conversationRef, { messages: currentMessages });

            // Update local state
            setMessages(currentMessages);
            setIsDeleteModalVisible(false);
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
            Alert.alert("Error", "Failed to delete message. Please try again.");
        }
    };
    // END of Jesus Donate Contribution

    // START of Jesus Donate Contribution
    // Scrolls to the bottom of the flatlist
    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // END of Jesus Donate Contribution

    // START of Jesus Donate Contribution
    // Loading screen rendered while the conversation is loading
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }]}>
                    <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#007AFF'} />
                    <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#333' }]}>Loading conversation...</Text>
                </View>
            </SafeAreaView>
        );
    }
    // END of Jesus Donate Contribution

    // START of rendering the DirectMessageScreen component
    // START of Mariann Grace Dizon Contribution and Jesus Donate
    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }]}>
            <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }]}>
                <Stack.Screen 
                    options={{ 
                        headerShown: false,
                        contentStyle: { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }
                    }} 
                />
                
                {/* Header */}
                <View style={[styles.header, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }]}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={18} color={isDarkMode ? 'white' : 'black'} />
                    </TouchableOpacity>
                    
                    <View style={styles.profileHeader}>
                        <Image 
                            source={{ uri: profileImageUrl || 'https://via.placeholder.com/80' }} 
                            style={styles.headerProfileImage} 
                        />
                        <Text style={[styles.headerName, { color: isDarkMode ? 'white' : 'black' }]}>{recipientName}</Text>
                    </View>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onLongPress={() => handleLongPress(item)}>
                            <View style={[
                                styles.messageRow,
                                item.senderId === auth.currentUser?.uid ? styles.sentMessageRow : styles.receivedMessageRow
                            ]}>
                                {item.senderId !== auth.currentUser?.uid && (
                                    <Image
                                        source={{ uri: profileImageUrl }}
                                        style={styles.messageAvatar}
                                    />
                                )}
                                <View style={[
                                    styles.messageBubble,
                                    item.senderId === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage,
                                    { backgroundColor: isDarkMode ? '#3a3a3a' : '#F0F0F0' }
                                ]}>
                                    <Text style={[styles.messageText, { color: isDarkMode ? 'white' : 'black' }]}>
                                        {item.senderId === auth.currentUser?.uid 
                                            ? item.message 
                                            : censorMessage(item.message, userHiddenWords)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.messageList}
                />

                {/* Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={90}
                >
                    <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFF8F0' }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDarkMode ? '#1a1a1a' : '#FFFFFF', color: isDarkMode ? 'white' : 'black' }]}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Send a message"
                            placeholderTextColor={isDarkMode ? '#999' : '#666'}
                            onSubmitEditing={sendMessage}
                            returnKeyType="send"
                            multiline={false}
                        />
                    </View>
                </KeyboardAvoidingView>

                {/* Delete Modal */}
                <Modal
                    transparent={true}
                    visible={isDeleteModalVisible}
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2d3235' : 'white' }]}>
                            <Text style={[styles.modalTitle, { color: isDarkMode ? 'white' : 'black' }]}>Delete Message</Text>
                            <Text style={[styles.modalText, { color: isDarkMode ? 'white' : 'black' }]}>Are you sure you want to delete this message?</Text>
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
    // END of rendering the DirectMessageScreen component
    // END of Mariann Grace Dizon Contribution and Jesus Donate
};

// START of Mariann Grace Dizon Contribution
// Define the styles for the DirectMessageScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    header: {
        width: '100%',
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF8F0',
    },
    backButton: {
        position: 'absolute',
        left: 10,
        top: 0,
        padding: 10,
        zIndex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: -35,
    },
    headerProfileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 10,
    },
    headerName: {
        fontSize: 10,
        paddingTop: 5,
        fontWeight: '600',
        color: '#000000',
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 5,
        paddingHorizontal: 15,
    },
    sentMessageRow: {
        justifyContent: 'flex-end',
    },
    receivedMessageRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 10,
    },
    messageBubble: {
        maxWidth: '70%',
        padding: 12,
        borderRadius: 20,
        marginVertical: 2,
    },
    sentMessage: {
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-end',
        marginLeft: 60,
    },
    receivedMessage: {
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-start',
        marginRight: 60,
    },
    messageText: {
        fontSize: 16,
        color: '#000000',
    },
    messageList: {
        flexGrow: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        paddingBottom: 20,
        backgroundColor: '#FFF8F0',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        fontSize: 14,
        backgroundColor: '#FFFFFF',
        minHeight: 36,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
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
        alignItems: 'center', // Center items horizontally
        elevation: 5,
        width: '80%', // Set a specific width
        maxWidth: 300, // Maximum width
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center', // Center the title text
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center', // Center the buttons
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 10, // Add some horizontal margin between buttons
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
    navbar: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#fff8f0',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    navbarNameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
    },
    profileImage: {
        width: 55,
        height: 55,
        borderRadius: 30,
        marginRight: 15,
    },
    navbarName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    messageInput: {
        backgroundColor: '#FFFFFF',  // White background for input
        padding: 15,
        borderRadius: 25,
        marginHorizontal: 15,
        marginBottom: 20,
        marginTop: 'auto',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    }
});

export default DirectMessageScreen;