// hidden-words.tsx
// Jesus Donate

// START of Hidden Words UI/UX
// START of Jesus Donate Contribution

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

// Define the root stack parameter list
type RootStackParamList = {
  Settings: undefined;
  // ... other routes
};

// Define the navigation prop for the hidden words screen
type HiddenWordsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

// Function to censor messages (new)
export const censorMessage = (message: string, hiddenWords: string[]): string => {
  if (!message || !hiddenWords || hiddenWords.length === 0) return message;
  
  let censoredMessage = message;
  const messageLower = message.toLowerCase();
  
  hiddenWords.forEach(word => {
    if (word.trim()) {
      const wordLower = word.trim().toLowerCase();
      let startIndex = 0;
      
      while ((startIndex = messageLower.indexOf(wordLower, startIndex)) !== -1) {
        const endIndex = startIndex + wordLower.length;
        const asterisks = '*'.repeat(endIndex - startIndex);
        censoredMessage = 
          censoredMessage.substring(0, startIndex) + 
          asterisks + 
          censoredMessage.substring(endIndex);
        startIndex = endIndex;
      }
    }
  });
  
  return censoredMessage;
};

const HiddenWords: React.FC = () => {
  const [hiddenWord, setHiddenWord] = useState('');
  const [hiddenWords, setHiddenWords] = useState<string[]>([]);
  const navigation = useNavigation<HiddenWordsScreenNavigationProp>();

  // Fetch hidden words when component mounts
  useEffect(() => {
    const fetchHiddenWords = async () => {
      if (!auth.currentUser) return;
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().hiddenWords) {
        setHiddenWords(userDoc.data().hiddenWords);
      }
    };

    fetchHiddenWords();
  }, []);

  // Add word to hidden words
  const handleAddWord = async () => {
    if (!hiddenWord.trim() || !auth.currentUser) return;

    try {
      const lowerCaseWord = hiddenWord.trim().toLowerCase();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        hiddenWords: arrayUnion(lowerCaseWord)
      });

      setHiddenWords([...hiddenWords, lowerCaseWord]);
      setHiddenWord('');
    } catch (error) {
      console.error('Error adding hidden word:', error);
    }
  };

  // Remove word from hidden words (new)
  const handleRemoveWord = async (wordToRemove: string) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updatedWords = hiddenWords.filter(word => word !== wordToRemove);
      
      await updateDoc(userRef, {
        hiddenWords: updatedWords
      });

      setHiddenWords(updatedWords);
    } catch (error) {
      console.error('Error removing hidden word:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hidden Words</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Add hidden words</Text>
        <Text style={styles.description}>
          We'll hide messages containing any words you add here.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a word, phrase or emoji"
            placeholderTextColor="#999"
            value={hiddenWord}
            onChangeText={setHiddenWord}
          />
          {hiddenWord.trim().length > 0 && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddWord}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hiddenWordsContainer}>
          <Text style={styles.listTitle}>Hidden Words List</Text>
          {hiddenWords.map((word, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.wordText}>{word}</Text>
              <TouchableOpacity 
                onPress={() => handleRemoveWord(word)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#fba904',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  hiddenWordsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  wordText: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  noHiddenLikesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  noHiddenLikesText: {
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
  },
  learnMore: {
    color: '#37bdd5',
  },
});

export default HiddenWords;

// END of Hidden Words UI/UX
// END of Jesus Donate Contribution