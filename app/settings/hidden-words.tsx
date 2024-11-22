// hidden-words.tsx
// Jesus Donate

// START of Hidden Words UI/UX
// START of Jesus Donate Contribution

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
    
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

  // Censors the message by replacing the hidden words with asterisks
  hiddenWords.forEach(word => {
    if (word.trim()) {
      const wordLower = word.trim().toLowerCase();
      let startIndex = 0;
      // Replaces the hidden words with asterisks
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

// Function to check if a message contains any hidden words
export const containsHiddenWords = (message: string, hiddenWords: string[]): boolean => {
  if (!message || !hiddenWords || hiddenWords.length === 0) return false;
  
  const messageLower = message.toLowerCase();
  return hiddenWords.some(word => {
    const wordLower = word.trim().toLowerCase();
    return messageLower.includes(wordLower);
  });
};

// Function to get all instances of hidden words in a message
export const findHiddenWordsInMessage = (message: string, hiddenWords: string[]): string[] => {
  if (!message || !hiddenWords || hiddenWords.length === 0) return [];
  
  const messageLower = message.toLowerCase();
  return hiddenWords.filter(word => {
    const wordLower = word.trim().toLowerCase();
    return messageLower.includes(wordLower);
  });
};

// Function to validate a word before adding to hidden words
export const validateHiddenWord = (word: string): boolean => {
  if (!word || word.trim().length === 0) return false;
  if (word.trim().length > 50) return false; // Max length check
  return true;
};

// Function to sanitize hidden words before storing
export const sanitizeHiddenWord = (word: string): string => {
  return word.trim().toLowerCase();
};

// A component that allows the user to add and remove hidden words
const HiddenWords: React.FC = () => {
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

  // Adds a word to the hidden words list
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

  // Removes a word from the hidden words list
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
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkHeaderTitle]}>Hidden Words</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>Add hidden words</Text>
        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          We'll hide messages containing any words you add here.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isDarkMode && styles.darkInput]}
            placeholder="Add a word, phrase or emoji"
            placeholderTextColor={isDarkMode ? '#ccc' : '#999'}
            value={hiddenWord}
            onChangeText={setHiddenWord}
          />
          {hiddenWord.trim().length > 0 && (
            <TouchableOpacity 
              style={[styles.addButton, isDarkMode && styles.darkAddButton]}
              onPress={handleAddWord}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.hiddenWordsContainer, isDarkMode && styles.darkHiddenWordsContainer]}>
          <Text style={[styles.listTitle, isDarkMode && styles.darkListTitle]}>Hidden Words List</Text>
          {hiddenWords.map((word, index) => (
            <View key={index} style={[styles.wordItem, isDarkMode && styles.darkWordItem]}>
              <Text style={[styles.wordText, isDarkMode && styles.darkWordText]}>{word}</Text>
              <TouchableOpacity 
                onPress={() => handleRemoveWord(word)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={isDarkMode ? '#ff6b6b' : '#ff4444'} />
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
  darkContainer: {
    backgroundColor: '#1a1a1a',
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
    color: '#000',
  },
  darkHeaderTitle: {
    color: '#fff',
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
    color: '#000',
  },
  darkSectionTitle: {
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 20,
  },
  darkDescription: {
    color: '#ccc',
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
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fba904',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  darkAddButton: {
    backgroundColor: '#ffbb33',
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
  darkHiddenWordsContainer: {
    backgroundColor: '#444',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  darkListTitle: {
    color: '#fff',
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
  darkWordItem: {
    borderBottomColor: '#555',
  },
  wordText: {
    fontSize: 16,
    color: '#333',
  },
  darkWordText: {
    color: '#fff',
  },
  removeButton: {
    padding: 5,
  },
});

export default HiddenWords;

// END of Hidden Words UI/UX
// END of Jesus Donate Contribution