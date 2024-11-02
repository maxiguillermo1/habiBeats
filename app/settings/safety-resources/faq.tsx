import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

const FAQ = () => {
  const navigation = useNavigation();
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      question: "How do I match with other users?",
      answer: "Our app uses a unique matching algorithm based on musical preferences, favorite artists, and performance styles. Complete your profile with your musical interests to get better matches!",
      isOpen: false
    },
    {
      question: "How can I change my profile information?",
      answer: "Go to Settings > Edit Profile to update your name, location, profile picture, and other personal information. You can also customize your profile's border animation here.",
      isOpen: false
    },
    {
      question: "How do I manage my privacy settings?",
      answer: "Navigate to Settings > Safety, Security, and Privacy to control your visibility, last name display, location sharing, and other privacy options.",
      isOpen: false
    },
    {
      question: "Can I pause new matches temporarily?",
      answer: "Yes! Go to Settings > Pause New Matches to temporarily stop being shown to other users while maintaining your existing matches.",
      isOpen: false
    },
    {
      question: "How do I control notifications?",
      answer: "You can customize both push and email notifications in Settings under Push Notifications and Email Notifications sections.",
      isOpen: false
    },
    {
      question: "What are Hidden Words?",
      answer: "Hidden Words is a feature that filters out messages containing specific words or phrases you've chosen to avoid. Manage your list in Settings > Hidden Words.",
      isOpen: false
    },
    {
      question: "How does the music preference matching work?",
      answer: "We match users based on their selected music genres (EDM, Hip Hop, Pop, etc.) and favorite artists. The more genres you select and artists you add, the better matches you'll receive. You can update these preferences anytime in your profile settings.",
      isOpen: false
    },
    {
      question: "What are Profile Prompts and how do I use them?",
      answer: "Profile Prompts are questions about your concert experiences and preferences that help others get to know you better. You can choose from questions like 'What's your favorite post-event hangout spot?' or 'What's the most memorable concert you've attended?' Answer these in your profile to spark conversations!",
      isOpen: false
    },
    {
      question: "How do I find concert companions?",
      answer: "You can find concert companions by matching with users who share your music taste. When viewing matches, look for users with similar favorite artists and genres. You can also like specific parts of their profile (like favorite performances or artists) to show what you have in common.",
      isOpen: false
    },
    {
      question: "What's the 'Tune of the Month' feature?",
      answer: "Tune of the Month is a feature where you can showcase your current favorite song. It appears on your profile with album artwork and artist information, giving potential matches a glimpse of your current music taste. Update it regularly to keep your profile fresh!",
      isOpen: false
    },
    {
      question: "Can I specify my intentions for matching?",
      answer: "Yes! During signup, you can specify whether you're looking for friends, flirting, or both. This helps ensure you match with people who have similar intentions for concert companionship.",
      isOpen: false
    },
    {
      question: "How do I verify my profile?",
      answer: "You can verify your profile through our Selfie Verification feature, accessible in Settings > Selfie Verification. This helps build trust in our community and shows other users that you're a real concert enthusiast!",
      isOpen: false
    }
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(faqs.map((faq, i) => ({
      ...faq,
      isOpen: i === index ? !faq.isOpen : false
    })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequently asked questions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity 
              style={styles.questionContainer}
              onPress={() => toggleFAQ(index)}
            >
              <Text style={styles.questionText}>{faq.question}</Text>
              <Text style={styles.toggleIcon}>
                {faq.isOpen ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {faq.isOpen && (
              <Text style={styles.answerText}>{faq.answer}</Text>
            )}
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
    paddingBottom: 100,
  },
  faqItem: {
    marginBottom: 15,
    backgroundColor: '#fba904',
    borderRadius: 8,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionText: {
    fontSize: 16,
    flex: 1,
    paddingRight: 10,
  },
  toggleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  answerText: {
    padding: 15,
    paddingTop: 0,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default FAQ;