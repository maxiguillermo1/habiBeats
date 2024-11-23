import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const TipsForMatching = () => {
  const router = useRouter();

  const tips = [
    {
      title: "Complete Your Profile",
      description: "Add your favorite artists, genres, and concert experiences. A detailed profile increases your chances of meaningful matches.",
      icon: "person-circle-outline"
    },
    {
      title: "Verify Your Profile",
      description: "Get verified to show others you're a real concert enthusiast. This builds trust in the community.",
      icon: "checkmark-circle-outline"
    },
    {
      title: "Be Specific About Music",
      description: "List your specific music interests and favorite concert venues. This helps match you with people who share your exact tastes.",
      icon: "musical-notes-outline"
    },
    {
      title: "Start With Common Ground",
      description: "When matching, look for shared artists and genres. These make great conversation starters!",
      icon: "people-outline"
    },
    {
      title: "Stay Safe",
      description: "Always meet in public places for the first time, preferably at the concert venue. Share your plans with friends.",
      icon: "shield-checkmark-outline"
    },
    {
      title: "Be Respectful",
      description: "Treat others with respect. Everyone's here to enjoy music and make connections.",
      icon: "heart-outline"
    },
    {
      title: "Update Your Status",
      description: "Keep your concert-going status current. Let others know which events you're interested in attending.",
      icon: "calendar-outline"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tips for Matching</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Follow these tips to make the most of your matching experience and stay safe while meeting concert companions.
        </Text>

        {tips.map((tip, index) => (
          <View key={index} style={styles.tipContainer}>
            <View style={styles.tipHeader}>
              <Ionicons name={tip.icon as any} size={24} color="#82327E" />
              <Text style={styles.tipTitle}>{tip.title}</Text>
            </View>
            <Text style={styles.tipDescription}>{tip.description}</Text>
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
  tipContainer: {
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
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingLeft: 34,
  },
});

export default TipsForMatching;
