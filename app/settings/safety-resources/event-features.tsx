import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EventFeatures = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Features Guide</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Discover how to make the most of Habibeats' event features to connect with fellow music lovers and share amazing experiences.
        </Text>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="calendar-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Creating Events</Text>
          </View>
          <Text style={styles.featureDescription}>
            Host your own music events! Whether it's a listening party, jam session, or concert meetup, you can easily create and manage events through the app.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="people-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Event Discovery</Text>
          </View>
          <Text style={styles.featureDescription}>
            Find events that match your music taste. Browse local events, filter by genre, and see which events your matches are attending.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="chatbubbles-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Event Chat</Text>
          </View>
          <Text style={styles.featureDescription}>
            Connect with other attendees before, during, and after events through dedicated event chat rooms. Share excitement, coordinate meetups, and stay in touch.
          </Text>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Safety Tips</Text>
          <Text style={styles.noteText}>
            While meeting fellow music lovers is exciting, always prioritize your safety. Meet in public places, tell friends about your plans, and trust your instincts.
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

export default EventFeatures;
