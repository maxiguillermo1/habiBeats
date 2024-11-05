import React from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import TermsOfService from './terms-of-service';

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <TermsOfService />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingTop: 60,
  },
  backButton: {
    fontSize: 32,
    color: '#fba904',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0e1514',
    fontFamily: 'Sora-SemiBold',
  },
  placeholder: {
    width: 20,
  },
  content: {
    flex: 1,
  },
});