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
      title: t('safety.profile_privacy.title'),
      description: t('safety.profile_privacy.description'),
      icon: "eye-off-outline",
      color: "#fba904"
    },
    {
      title: t('safety.blocking.title'),
      description: t('safety.blocking.description'),
      icon: "shield-outline",
      color: "#82327E"
    },
    {
      title: t('safety.hidden_words.title'),
      description: t('safety.hidden_words.description'),
      icon: "text-outline",
      color: "#fba904"
    },
    {
      title: t('safety.location.title'),
      description: t('safety.location.description'),
      icon: "location-outline",
      color: "#82327E"
    },
    {
      title: t('safety.meeting.title'),
      description: t('safety.meeting.description'),
      icon: "people-outline",
      color: "#fba904"
    },
    {
      title: t('safety.data.title'),
      description: t('safety.data.description'),
      icon: "lock-closed-outline",
      color: "#82327E"
    },
    {
      title: t('safety.verification.title'),
      description: t('safety.verification.description'),
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
        <Text style={styles.headerTitle}>{t('safety.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          {t('safety.description')}
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
