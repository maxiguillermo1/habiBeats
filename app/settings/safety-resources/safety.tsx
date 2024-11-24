import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

const SafetyAndPrivacy = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const safetyItems = [
    {
      title: "Profile Privacy",
      description: "Control who can see your profile and personal information. Manage your visibility settings and protect your privacy.",
      icon: "eye-off-outline", 
      color: "#fba904"
    },
    {
      title: "Blocking & Reporting",
      description: "Learn how to block and report users who violate our community guidelines. Your safety is our priority.",
      icon: "shield-outline",
      color: "#82327E"
    },
    {
      title: "Hidden Words",
      description: "Filter out potentially offensive comments and messages. Customize your content filtering preferences.",
      icon: "text-outline",
      color: "#fba904"
    },
    {
      title: "Location Safety",
      description: "Control your location sharing settings and learn best practices for location privacy while using the app.",
      icon: "location-outline",
      color: "#82327E"
    },
    {
      title: "Safe Meetups",
      description: "Guidelines for safely meeting people from the app in person. Learn about meetup safety features and best practices.",
      icon: "people-outline",
      color: "#fba904"
    },
    {
      title: "Data Protection",
      description: "Understand how we protect your personal data and what security measures we have in place to keep your information safe.",
      icon: "lock-closed-outline",
      color: "#82327E"
    },
    {
      title: "Account Verification",
      description: "Learn about our verification process and how it helps create a safer community by confirming user identities.",
      icon: "checkmark-circle-outline",
      color: "#fba904"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Manage your account settings and preferences. Here's what you can do:
        </Text>

        {safetyItems.map((item, index) => (
          <View key={index} style={styles.safetyItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  safetyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SafetyAndPrivacy;
