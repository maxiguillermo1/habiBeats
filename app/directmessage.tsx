// directmessage.tsx
// Mariann Grace Dizon

// START of Mariann Grace Dizon Contribution
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useLocalSearchParams } from 'expo-router';

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
    console.log(recipientId, recipientName);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'messages'),
            where('participants', 'array-contains', auth.currentUser.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                message: doc.data().text,
                senderId: doc.data().senderId,
                recipientId: doc.data().recipientId,
                timestamp: doc.data().timestamp,
            }));
            setMessages(newMessages as Message[]);
        });

        return () => unsubscribe();
    }, []);

    const sendMessage = async () => {
        if (newMessage.trim() === '' || !auth.currentUser) return;

        await addDoc(collection(db, 'messages'), {
            text: newMessage,
            senderId: auth.currentUser.uid, // user sends the message
            senderName: auth.currentUser.displayName,
            recipientName: recipientName, 
            recipientId: recipientId, // habibi is the recipient
            timestamp: Timestamp.now(),
            participants: [auth.currentUser.uid, recipientId]
        });

        setNewMessage('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={item.senderId === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage}>
                        <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                )}
                inverted
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
});

// Export the DirectMessageScreen component
export default DirectMessageScreen;
// END of Mariann Grace Dizon Contribution