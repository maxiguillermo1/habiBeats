// directmessage.tsx
// Jesus Donate & Mariann Grace Dizon

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { doc, setDoc, updateDoc, arrayUnion, onSnapshot, Timestamp, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

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
    }, [recipientId]);
    // END of Jesus Donate Contribution

    // START of Jesus Donate Contribution
    // Sends a message to the recipient
    const sendMessage = async () => {
        const message = newMessage
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
    // END of Jesus Donate Contribution

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
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading conversation...</Text>
                </View>
            </SafeAreaView>
        );
    }
    // END of Jesus Donate Contribution

    // START of rendering the DirectMessageScreen component
    // START of Mariann Grace Dizon Contribution and Jesus Donate
    return (
        <View style={{ flex: 1, backgroundColor: '#fff8f0' }}>
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                {/* This view is for the navbar which contains the back button, profile image, and name of the recipient */}
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <View style={styles.navbarNameContainer}>
                        <Image
                            source={{ uri: profileImageUrl || 'placeholder.png' }}
                            style={styles.profileImage}
                        />
                        <Text style={styles.navbarName}>{recipientName}</Text>
                    </View>
                </View>

                {/* This is the flatlist that displays the messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        // When the user long presses on a message, the delete modal is shown
                        <TouchableOpacity
                            onLongPress={() => handleLongPress(item)}
                            delayLongPress={500}
                        >
                            <View style={item.senderId === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage}>
                                <Text style={styles.messageText}>{item.message}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.messageList}
                />
                {/* This is the input container for the message input and send button */}
                <KeyboardAvoidingView
                    style={styles.inputContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TextInput
                        style={styles.input}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Type a message..."
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
                {/* This is the delete modal that is shown when the user long presses on a message */}
                <Modal
                    transparent={true}
                    visible={isDeleteModalVisible}
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Delete Message</Text>
                            <Text style={styles.modalText}>Are you sure you want to delete this message?</Text>
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
        backgroundColor: '#fff8f0',
        marginLeft: 10,  // Keep the left margin
        marginRight: 10, // Keep the right margin
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff8f0',
        marginLeft: -10,  // Compensate for container margin
        marginRight: -10, // Compensate for container margin
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
    navbar: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#fff8f0',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 10,
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
});

export default DirectMessageScreen; // Export the DirectMessageScreen component
// END of Mariann Grace Dizon Contribution