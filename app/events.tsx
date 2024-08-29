import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';


const Events = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        {/* Content for events would go here */}
      </View>
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#f4a261',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingTop: 80,
    paddingBottom: 60, // Add padding to account for the bottom navbar
  },
});

export default Events;
