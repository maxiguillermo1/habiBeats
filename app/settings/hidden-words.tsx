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

const HiddenWords: React.FC = () => {
  // Get the navigation object
  const navigation = useNavigation<HiddenWordsScreenNavigationProp>();
  // State for the hidden word
  const [hiddenWord, setHiddenWord] = useState('');
  const [hiddenWords, setHiddenWords] = useState<string[]>([]);

  // Fetch existing hidden words on component mount
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

  // Handle adding a new hidden word
  const handleAddWord = async () => {
    if (!hiddenWord.trim() || !auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        hiddenWords: arrayUnion(hiddenWord.trim())
      });

      setHiddenWords([...hiddenWords, hiddenWord.trim()]);
      setHiddenWord('');
    } catch (error) {
      console.error('Error adding hidden word:', error);
    }
  };

  // Handle removing a hidden word
  const handleRemoveWord = async (wordToRemove: string) => {
    if (!auth.currentUser) return;

    try {
      const updatedWords = hiddenWords.filter(word => word !== wordToRemove);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        hiddenWords: updatedWords
      });

      setHiddenWords(updatedWords);
    } catch (error) {
      console.error('Error removing hidden word:', error);
    }
  };

  // Handle the back button press
  const handleBackPress = () => {
    navigation.navigate('settings' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hidden Words</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Add hidden words</Text>
        <Text style={styles.description}>
          We'll hide likes with comments containing any words you add here. This will not block words you see on profiles.
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
          <ScrollView style={styles.wordsList}>
            {hiddenWords.map((word, index) => (
              <View key={index} style={styles.wordItem}>
                <Text style={styles.wordText}>{word}</Text>
                <TouchableOpacity 
                  onPress={() => handleRemoveWord(word)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.noHiddenLikesButton}>
          <Text style={styles.noHiddenLikesText}>No hidden likes</Text>
          <Ionicons name="chevron-forward" size={24} color="#8e8e8e" />
        </TouchableOpacity>

        <Text style={styles.footer}>
          Wondering how Hidden Words works? <Text style={styles.learnMore}>Learn more</Text>
        </Text>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#37bdd5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  hiddenWordsContainer: {
    maxHeight: 200,
  },
  wordsList: {
    flex: 1,
  },
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 16,
    flex: 1,
  },
  removeButton: {
    padding: 4,
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