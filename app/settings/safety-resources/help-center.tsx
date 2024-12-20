import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const HelpCenter = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Defines the help categories and their routes
  const helpCategories = [
    { 
      title: 'Tips for Matching',
      route: 'settings/safety-resources/tips-for-matching'
    },
    {
      title: 'FAQ',
      route: 'settings/safety-resources/faq'
    },
    {
      title: 'Safety, Security, and Privacy',
      route: 'settings/safety-resources/safety'
    },
    { 
      title: 'AI at Habibeats',
      route: 'settings/safety-resources/ai-at-habibeats'
    },
    {
      title: 'Support',
      route: 'settings/safety-resources/support'
    },
    {
      title: 'Account Settings',
      route: 'settings/safety-resources/account-settings'
    },
    {
      title: 'Event Features Guide',
      route: 'settings/safety-resources/event-features'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Center</Text>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {helpCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryButton}
            onPress={() => router.push(category.route as never)}
          >
            <Text style={styles.categoryText}>{category.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  categoryButton: {
    backgroundColor: '#fba904',
    padding: 20,
    borderRadius: 25,
    marginVertical: 12,
    alignItems: 'center',
  },
  categoryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HelpCenter;
