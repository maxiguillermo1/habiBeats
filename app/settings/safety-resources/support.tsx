import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import axios from 'axios';

interface ChatMessage {
  isUser: boolean;
  message: string;
}

const Support = () => {
  const router = useRouter();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const GEMINI_API_KEY = 'AIzaSyD6l21NbFiYT1QtW6H6iaIQMvKxwMAQ604';

  const handleEmailSupport = () => {
    Linking.openURL('mailto:habibeatsteam@gmail.com?subject=Habibeats Support Request');
  };

  const generateSupportResponse = async (input: string) => {
    setIsLoading(true);
    const prompt = `As Habibeats' support assistant, help with: ${input}. Provide user-friendly guidance about features and usage, but never reveal technical details or internal workings.`;

    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        {
          params: { key: GEMINI_API_KEY },
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, 
        { isUser: true, message: input },
        { isUser: false, message: aiResponse }
      ]);
    } catch (error) {
      console.error('Error generating support response:', error);
      setMessages(prev => [...prev,
        { isUser: true, message: input },
        { isUser: false, message: 'Sorry, I encountered an error. Please try emailing our support team.' }
      ]);
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    generateSupportResponse(userInput);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      {!showChat ? (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need help? We're here for you!</Text>
            <Text style={styles.description}>
              Choose how you'd like to get support below.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.supportOption}
            onPress={() => setShowChat(true)}
          >
            <View style={styles.optionContent}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fba904" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Chat with Support Assistant</Text>
                <Text style={styles.optionDescription}>
                  Get instant help with features and common questions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.supportOption}
            onPress={handleEmailSupport}
          >
            <View style={styles.optionContent}>
              <Ionicons name="mail-outline" size={24} color="#fba904" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Email Support</Text>
                <Text style={styles.optionDescription}>
                  Contact our team directly at habibeatsteam@gmail.com
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, index) => (
              <View key={index} style={[
                styles.messageContainer,
                msg.isUser ? styles.userMessage : styles.botMessage
              ]}>
                <Text style={styles.messageText}>{msg.message}</Text>
              </View>
            ))}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type your question..."
              placeholderTextColor="#999"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0e1514" />
              ) : (
                <Ionicons name="arrow-up" size={24} color="#0e1514" />
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 20,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 15,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
    marginBottom: 60,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#82327E',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
});

export default Support;
