// email-notifications.tsx
// Maxwell Guillermo

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { auth, db } from '../../firebaseConfig'; 
import { doc, onSnapshot } from 'firebase/firestore';

interface NotificationSetting {
  id: string;
  label: string;
  description?: string;
  warning?: string;
}

interface Settings {
  allEmails: boolean;
  newLikes: boolean;
  newMatches: boolean;
  newMessages: boolean;
  promotions: boolean;
  announcements: boolean;
}

const EmailNotification: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = React.useState<Settings>({
    allEmails: false,
    newLikes: false,
    newMatches: false,
    newMessages: false,
    promotions: false,
    announcements: false,
  });

  const notificationSettings: NotificationSetting[] = [
    { id: 'allEmails', label: 'All Emails', warning: 'By having this set to off, you may miss a connection.' },
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
    navigation.goBack();
  };

    // START of Mariann Grace Dizon Contribution
    // Use theme context
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

    // Update dark mode state when theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark');
    }, [theme]);

    // Fetch user's theme preference from Firebase
    useEffect(() => {
        if (!auth.currentUser) return;
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            const userData = docSnapshot.data();
            
            // Ensure userData is defined before accessing themePreference
            const userTheme = userData?.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.customHeader, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.backButton, isDarkMode && styles.darkBackButton]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Email Notifications</Text>
        <View style={styles.placeholder}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notificationSettings.map((setting, index) => (
          <React.Fragment key={setting.id}>
            <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, isDarkMode && styles.darkText]}>{setting.label}</Text>
                {setting.id === 'allEmails' && (
                  <Text style={styles.warningText}>{setting.warning}</Text>
                )}
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
                thumbColor="#fff"
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
    color: '#0a84ff',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
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
    color: '#000',
  },
  settingSubtext: {
    fontSize: 11.5,
    color: '#888',
    marginTop: 2,
  },
  darkSettingSubtext: {
    color: '#666',
  },
  warningText: {
    fontSize: 9.5,
    color: '#ff3b30',
    marginTop: 2,
  },
});

export default EmailNotification;

// END of Email Notifications UI/UX
// END of Maxwell Guillermo Contribution