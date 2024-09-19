// directmessage.tsx
// Mariann Grace Dizon

// START of Mariann Grace Dizon Contribution
import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define the DirectMessageScreen component
const DirectMessageScreen = () => {
    // Initialize scrollViewRef
    const scrollViewRef = useRef<ScrollView>(null); 

    // Return the JSX for the DirectMessageScreen
    return (
        <View style={styles.container}>
            {/* User container */}
            <View style={styles.userContainer}>
                <Image source={{ uri: 'https://example.com/user-avatar.jpg' }} style={styles.profilePic} />
                <Text style={styles.userName}>Miles Morales</Text>
            </View>
            {/* ScrollView for messages */}
            <ScrollView style={styles.scrollView} ref={scrollViewRef} onContentSizeChange={(width, height) => {
                if (scrollViewRef.current) { // Check if scrollViewRef.current is not null
                    scrollViewRef.current.scrollToEnd({ animated: true });
                }
            }}>
                {/* Message bubbles */}
                <View style={[styles.messageContainer, { alignSelf: 'flex-start', backgroundColor: '#ffc4ce' }]}>
                    <Text style={[styles.messageText, { color: '#0e1514' }]}>What's up Gwen?</Text>
                </View>
                <View style={[styles.messageContainer, { alignSelf: 'flex-end', backgroundColor: '#fc6c85' }]}>
                    <Text style={[styles.messageText, { color: '#fff8f0' }]}> Hey Miles, nothing much!</Text>
                </View>
                {/* Additional messages can be dynamically added here */}
            </ScrollView>
            {/* Input area for sending messages */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Send a message..."
                    placeholderTextColor="#ffd582"
                />
                <TouchableOpacity style={styles.sendButton}>
                    <Ionicons name="send" size={15} color="#fff8f0"/>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Define the styles for the DirectMessageScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff8f0',
    },
    scrollView: {
        padding: 10,
        flex: 1,
        flexDirection: 'column-reverse', // Chat bubbles come from the bottom
        marginBottom: 100, // Added margin to separate from input area
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center the name
        marginTop: 10, // Adjusted margin to position at the top
        marginBottom: 10, // Added margin to separate from messages
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userName: {
        fontWeight: 'bold',
    },
    messageContainer: {
        backgroundColor: '#F1F1F1',
        borderRadius: 20,
        padding: 15,
        marginVertical: 5,
        maxWidth: '80%',
        alignSelf: 'flex-start',
    },
    messageText: {
        color: 'black',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#fff8f0',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        zIndex: 1000, // Ensure inputContainer is always on top
    },
    input: {
        flex: 1,
        borderWidth: 1,
        backgroundColor: 'white',
        borderColor: '#fba904',
        borderRadius: 20,
        padding: 13,
        marginRight: 10,
        marginBottom: 25,
    },
    sendButton: {
        backgroundColor: '#fba904',
        borderRadius: 20,
        padding: 14,
        marginBottom: 25,
    },
    sendButtonImage: {
        width: 20, // Set appropriate width
        height: 20, // Set appropriate height
    },
});

// Export the DirectMessageScreen component
export default DirectMessageScreen;
// END of Mariann Grace Dizon Contribution