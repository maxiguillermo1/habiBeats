import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const SafetyAndPrivacy = () => {
  const navigation = useNavigation();

  const safetyItems = [
    {
      title: "Profile Privacy",
      description: "Control who sees your profile information and activity status. You can hide your last name, location, and online status.",
      icon: "eye-off-outline",
      color: "#fba904"
    },
    {
      title: "Blocking & Reporting",
      description: "Block users or report inappropriate behavior. Blocked users cannot see your profile or send you messages.",
      icon: "shield-outline",
      color: "#82327E"
    },
    {
      title: "Hidden Words",
      description: "Filter out messages containing specific words or phrases you don't want to see. Customize your list in settings.",
      icon: "text-outline",
      color: "#fba904"
    },
    {
      title: "Location Sharing",
      description: "Choose when and with whom to share your location. Your exact location is never shared without your consent.",
      icon: "location-outline",
      color: "#82327E"
    },
    {
      title: "Safe Meeting Tips",
      description: "Always meet in public places, tell friends about your plans, and trust your instincts. Use our in-app safety features.",
      icon: "people-outline",
      color: "#fba904"
    },
    {
      title: "Data Protection",
      description: "Your personal information and messages are encrypted. We never share your data with third parties.",
      icon: "lock-closed-outline",
      color: "#82327E"
    },
    {
      title: "Account Verification",
      description: "Verify your profile to show others you're a real person and build trust in the community.",
      icon: "checkmark-circle-outline",
      color: "#fba904"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Your safety and privacy are our top priorities. Learn about our safety features and guidelines below.
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
