import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const AccountSettings = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Manage your account settings and preferences. Here's what you can do:
        </Text>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="person-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Profile Information</Text>
          </View>
          <Text style={styles.featureDescription}>
            Update your profile details including name, bio, and profile picture. Keep your information current to help others connect with you.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="notifications-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Notification Settings</Text>
          </View>
          <Text style={styles.featureDescription}>
            Customize your notification preferences. Choose what you want to be notified about and how you receive these notifications.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="lock-closed-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Privacy Settings</Text>
          </View>
          <Text style={styles.featureDescription}>
            Control who can see your profile, posts, and activity. Manage your blocked users and adjust your visibility settings.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureHeader}>
            <Ionicons name="shield-outline" size={24} color="#fc6c85" />
            <Text style={styles.featureTitle}>Account Security</Text>
          </View>
          <Text style={styles.featureDescription}>
            Change your password, enable two-factor authentication, and review your login activity to keep your account secure.
          </Text>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Need Help?</Text>
          <Text style={styles.noteText}>
            If you need assistance with your account settings or have any questions, please contact our support team. We're here to help!
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

export default AccountSettings;
