// hidden-words.tsx
// Maxwell Guillermo

// START of Hidden Words UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Settings: undefined;
  // ... other routes
};

type HiddenWordsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const HiddenWords: React.FC = () => {
  const navigation = useNavigation<HiddenWordsScreenNavigationProp>();
  const [hiddenWord, setHiddenWord] = useState('');

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
        <TextInput
          style={styles.input}
          placeholder="Add a word, phrase or emoji"
          placeholderTextColor="#999"
          value={hiddenWord}
          onChangeText={setHiddenWord}
        />
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
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 20,
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
// END of Maxwell Guillermo Contribution