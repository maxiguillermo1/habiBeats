// directmessage.tsx
// Mariann Grace Dizon

// START of Mariann Grace Dizon Contribution
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, getDocs } from 'firebase/firestore';
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
    console.log(recipientId, recipientName);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const navigation = useNavigation();
    const [profileImageUrl, setProfileImageUrl] = useState('');
    useEffect(() => {
        if (!auth.currentUser) return;

        // Query to get all messages for the current user and the recipient
        const q = query(
            collection(db, 'messages'),
            where('participants', 'array-contains', auth.currentUser.uid),
            orderBy('timestamp', 'desc')
        );
        
        // Listen for new messages
        const unsubscribe = onSnapshot(q, async (snapshot) => {

            // Fetch the recipient's profile image
            const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', recipientId)));
            if (!userDoc.empty) {
                setProfileImageUrl(userDoc.docs[0].data().profileImageUrl || '');
            }   

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

    // Function to send a message
    const sendMessage = async () => {
        if (newMessage.trim() === '' || !auth.currentUser) return;

        // Add the message to the database
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
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.navbar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.navbarNameContainer}>
                    <Image
                        source={{ uri: profileImageUrl }}
                        style={styles.profileImage}
                    />
                    <Text style={styles.navbarName}>{recipientName}</Text>
                </View>
            </View>
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
});

// Export the DirectMessageScreen component
export default DirectMessageScreen;
// END of Mariann Grace Dizon Contribution