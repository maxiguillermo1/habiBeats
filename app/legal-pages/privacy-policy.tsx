
import React from 'react';
import { ScrollView, Text, View, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';

export default function PrivacyPolicy() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Privacy Policy</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Data Collection</Text>
            <Text style={styles.text}>
              We collect information you provide, including your name, email, location, gender, pronouns, music preferences, and profile photos. We also collect device information and usage data to improve your experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Location Services</Text>
            <Text style={styles.text}>
              We request access to your location to help you connect with nearby concert companions. You can control location visibility in your settings and choose whether to make it visible on your profile.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Push Notifications</Text>
            <Text style={styles.text}>
              With your consent, we send push notifications about matches, messages, and concert updates. You can manage notification preferences in settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.text}>
              Your personal information and messages are encrypted. We implement security measures to protect your data and never share it with third parties without your consent.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Profile Information</Text>
            <Text style={styles.text}>
              You control the visibility of your last name, location, and pronouns. Your email is required for account security but is never publicly displayed.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Access</Text>
            <Text style={styles.text}>
              You can download your profile data in PDF or JSON format. You may also request account deletion, which will remove all your personal information from our systems.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0e1514',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Sora-SemiBold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1514',
    marginBottom: 10,
    fontFamily: 'Sora-SemiBold',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
  },
});