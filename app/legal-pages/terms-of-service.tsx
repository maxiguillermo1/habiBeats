import React from 'react';
import { ScrollView, Text, View, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';

export default function TermsOfService() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Terms of Service</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.text}>
              By accessing and using HabiBeats, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. User Eligibility</Text>
            <Text style={styles.text}>
              You must be at least 18 years old to use HabiBeats. By using the service, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Privacy Policy</Text>
            <Text style={styles.text}>
              Your use of HabiBeats is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Content</Text>
            <Text style={styles.text}>
              You retain all rights to any content you submit, post or display on HabiBeats. By submitting content, you grant HabiBeats a worldwide, non-exclusive license to use, copy, modify, and distribute your content.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Code of Conduct</Text>
            <Text style={styles.text}>
              Users must treat each other with respect and not engage in harassment, hate speech, or inappropriate behavior. HabiBeats reserves the right to suspend or terminate accounts that violate these guidelines.
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
