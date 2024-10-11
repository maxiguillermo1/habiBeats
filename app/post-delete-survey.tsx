import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet, Alert, Image } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const DeleteSurvey = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const auth = getAuth();
  const navigation = useNavigation();

  const surveyOptions = [
    "the app is not functional",
    "i don't use it anymore",
    "i didn't have a good experience",
  ];

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      Alert.alert('please select a reason before submitting.');
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
        const userId = auth.currentUser.uid;

        // Delete user document from Firestore
        const userDocRef = doc(db, 'users', userId); 
        await deleteDoc(userDocRef);

        // Delete user from Firebase Authentication
        await auth.currentUser.delete();

        Alert.alert('Account Deleted', 'your account has been successfully deleted.');
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
      <Image 
        source={require('../assets/images/habibeats_delete_account_graphic.png')} 
        style={styles.image} 
      />
      <Text style={styles.heading}>we are sad to see you go !</Text>
      <Text style={styles.subheading}>please let us know why you’re leaving :</Text>

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

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
  },
  image: {
    width: 200, // Adjust width
    height: 200, // Adjust height
    marginBottom: 20, // Space between image and heading
  },
  heading: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    paddingBottom: 20,
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '80%',
    justifyContent: 'flex-start'
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#fc6c85', 
    borderColor: '#fc6c85', 
    borderWidth: 2, 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 30, 

  },
  submitButtonText: {
    color: '#fff8f0', // Text color
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DeleteSurvey;
