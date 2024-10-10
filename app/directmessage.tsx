// directmessage.tsx
// Mariann Grace Dizon

// START of Mariann Grace Dizon Contribution
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { doc, setDoc, updateDoc, arrayUnion, onSnapshot, Timestamp, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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

    useEffect(() => {
        if (!auth.currentUser) return;

        setIsLoading(true);

        const conversationId = [auth.currentUser.uid, recipientId].sort().join('-');
        const conversationRef = doc(db, 'conversations', conversationId);

        const unsubscribe = onSnapshot(conversationRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const conversationData = docSnapshot.data();
                setMessages(conversationData.messages?.sort((a: Message, b: Message) => a.timestamp - b.timestamp) || []);

                if (!profileImageUrl) {
                    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', recipientId)));
                    if (!userDoc.empty) {
                        setProfileImageUrl(userDoc.docs[0].data().profileImageUrl || '');
                    }
                }
            } else {
                await setDoc(conversationRef, {
                    messages: []
                });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [recipientId]);

    const sendMessage = async () => {
        if (newMessage.trim() === '' || !auth.currentUser) return;

        const conversationId = [auth.currentUser.uid, recipientId].sort().join('-');
        const conversationRef = doc(db, 'conversations', conversationId);

        const newMessageObj = {
            message: newMessage,
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

        setNewMessage('');
    };

    const updateUsersConversationIds = async (userId1: string, userId2: string, conversationId: string) => {
        const updateUser = async (userId: string, otherUserId: string) => {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const conversationIds = userData.conversationIds || {};
                
                if (!conversationIds[otherUserId]) {
                    await updateDoc(userRef, {
                        [`conversationIds.${otherUserId}`]: conversationId
                    });
                }
                console.log(`Conversation ID for ${otherUserId}:`, conversationIds[otherUserId]);
            }
        };

        await Promise.all([
            updateUser(userId1, userId2),
            updateUser(userId2, userId1)
        ]);
    };

    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
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
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={item.senderId === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage}>
                        <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                )}
                contentContainerStyle={styles.messageList}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Define the styles for the DirectMessageScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 10,
        margin: 5,
        maxWidth: '70%',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#A5E5EA',
        borderRadius: 20,
        padding: 10,
        margin: 5,
        maxWidth: '70%',
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    navbar: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: 'white',
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
        width: 50,
        height: 50,
        borderRadius: 25,
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
});

// Export the DirectMessageScreen component
export default DirectMessageScreen;
// END of Mariann Grace Dizon Contribution