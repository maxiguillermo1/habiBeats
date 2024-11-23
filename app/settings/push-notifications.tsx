// push-notifications.tsx
// Maxwell Guillermo

// START of Push Notifications UI/UX
// START of Maxwell Guillermo Contribution

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemeContext } from '../../context/ThemeContext';
import { auth, db } from '../../firebaseConfig'; 
import { doc, onSnapshot } from 'firebase/firestore';

interface NotificationSetting {
  id: string;
  label: string;
  description?: string;
}

interface Settings {
  allNotifications: boolean;
  newLikes: boolean;
  newMatches: boolean;
  newMessages: boolean;
  promotions: boolean;
  announcements: boolean;
}

const PushNotificationsSettings: React.FC = () => {
  // START of Mariann Grace Dizon Contribution
  // Get theme from context
  const { theme } = useContext(ThemeContext);
  // State to track dark/light mode, initialized based on current theme
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  // Update isDarkMode whenever theme changes in context
  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  // Effect to sync theme with user's Firebase preferences
  useEffect(() => {
    // Return early if no authenticated user
    if (!auth.currentUser) return;

    // Get reference to current user's document
    const userDoc = doc(db, 'users', auth.currentUser.uid);

    // Subscribe to real-time updates of user's theme preference
    const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
      const userData = docSnapshot.data();
      // Default to light theme if no preference set
      const userTheme = userData?.themePreference || 'light';
      setIsDarkMode(userTheme === 'dark');
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth.currentUser]);
  // END of Mariann Grace Dizon Contribution

  const router = useRouter();
  const [settings, setSettings] = React.useState<Settings>({
    allNotifications: false,
    newLikes: true,
    newMatches: true,
    newMessages: true,
    promotions: false,
    announcements: true,
  });

  const notificationSettings: NotificationSetting[] = [
    { id: 'allNotifications', label: 'All Notifications' },
    { id: 'newLikes', label: 'New Likes' },
    { id: 'newMatches', label: 'New Matches' },
    { id: 'newMessages', label: 'New Messages' },
    { id: 'promotions', label: 'Promotions', description: 'Exclusive offers and news' },
    { id: 'announcements', label: 'Announcements', description: "What's new on Hinge" },
  ];

  const toggleSetting = (id: keyof Settings) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.customHeader, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.backButton, isDarkMode && styles.darkBackButton]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Push Notifications</Text>
        <View style={styles.placeholder}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notificationSettings.map((setting, index) => (
          <React.Fragment key={setting.id}>
            <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, isDarkMode && styles.darkText]}>{setting.label}</Text>
                {setting.description && (
                  <Text style={[styles.settingSubtext, isDarkMode && styles.darkSettingSubtext]}>
                    {setting.description}
                  </Text>
                )}
              </View>
              <Switch
                value={settings[setting.id as keyof Settings]}
                onValueChange={() => toggleSetting(setting.id as keyof Settings)}
                trackColor={{ false: isDarkMode ? "#444" : "#e0e0e0", true: "#34C759" }}
                thumbColor={isDarkMode ? "#bbb" : "#fff"}
                ios_backgroundColor={isDarkMode ? "#444" : "#e0e0e0"}
              />
            </View>
            {index === 0 && <View style={[styles.separator, isDarkMode && styles.darkSeparator]} />}
          </React.Fragment>
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
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  darkBackButton: {
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  darkText: {
    color: '#FFFFFF',
  },
  placeholder: {
    width: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    paddingRight: 8,
  },
  darkSettingItem: {
    borderBottomColor: '#333',
  },
  separator: {
    height: 125,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  darkSeparator: {
    borderBottomColor: '#333',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#000000',
  },
  settingSubtext: {
    fontSize: 11.5,
    color: '#888',
    marginTop: 2,
  },
  darkSettingSubtext: {
    color: '#666',
  },
});

export default PushNotificationsSettings;

// END of Push Notifications UI/UX
// END of Maxwell Guillermo Contribution    