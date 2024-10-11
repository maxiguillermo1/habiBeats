import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const DeleteSurvey = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const auth = getAuth();
  const navigation = useNavigation();

  const surveyOptions = [
    'App not functional',
    "I don't need it anymore",
    "Didn't have a good experience",
  ];

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      Alert.alert('Please select a reason before submitting.');
      return;
    }

    try {
      const response = {
        uid: auth.currentUser?.uid || 'anonymous',
        reason: selectedOption,
        timestamp: Timestamp.now(),
      };
      await addDoc(collection(db, 'delete-survey-responses'), response);

      // Proceed to delete user account after saving survey response
      if (auth.currentUser) {
        await auth.currentUser.delete();
        Alert.alert('Account deleted', 'Your account has been successfully deleted.');
        navigation.navigate('login-signup' as never); // Navigate to login-signup screen
      } else {
        Alert.alert('Error', 'No user is currently signed in.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Could not complete the process. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>We are sad to see you go</Text>
      <Text style={styles.subheading}>Please let us know why you’re leaving:</Text>

      {surveyOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.optionContainer}
          onPress={() => handleOptionSelect(option)}
        >
          <View style={styles.bubble}>
            {selectedOption === option && <View style={styles.selectedBubble} />}
          </View>
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <Button title="Submit" onPress={handleSubmit} color="#fc6c85" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  bubble: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fc6c85',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedBubble: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#fc6c85',
  },
  optionText: {
    fontSize: 16,
  },
});

export default DeleteSurvey;
