import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';

export default function Profile() {
  // Placeholder data - replace with actual user data
  const user = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    profilePicture: 'https://via.placeholder.com/150',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user.profilePicture }}
          style={styles.profilePicture}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>My Stats</Text>
        {/* Add user stats here */}
        <Text style={styles.sectionTitle}>My Habits</Text>
        {/* Add list of user's habits here */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
});
