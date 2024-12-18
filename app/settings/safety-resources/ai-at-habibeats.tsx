import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const AIAtHabibeats = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI at Habibeats</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Habibeats uses artificial intelligence to enhance your music discovery and social experience. Here's how our AI chatbot can help you:
        </Text>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="musical-notes-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Album Discovery</Text>
          </View>
          <Text style={styles.featureDescription}>
            Ask about any artist's albums, from their latest releases to their first works. Get detailed information about track listings and album highlights.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="heart-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Similar Artists</Text>
          </View>
          <Text style={styles.featureDescription}>
            Discover new artists based on your favorites. Our AI provides recommendations complete with popular tracks to help you explore similar music.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="volume-medium-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Lyrics Analysis</Text>
          </View>
          <Text style={styles.featureDescription}>
            Get insights into your favorite songs with our lyrics analysis feature. Understand the themes, meanings, and cultural significance behind the music you love.
          </Text>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Privacy Note</Text>
          <Text style={styles.noteText}>
            Our AI is designed to provide helpful music-related information while protecting your privacy. It will never share personal data or sensitive information about users.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20,
  },
  backButton: {
    fontSize: 32,
    color: '#37bdd5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0e1514',
  },
  placeholder: {
    width: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    lineHeight: 24,
  },
  featureSection: {
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#0e1514',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  noteSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f9fa',
    borderRadius: 15,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37bdd5',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default AIAtHabibeats;
