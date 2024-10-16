// push-notifications.tsx
// Maxwell Guillermo

// START of Push Notifications UI/UX
// START of Maxwell Guillermo Contribution

import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation();
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
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <View style={styles.placeholder}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notificationSettings.map((setting, index) => (
          <React.Fragment key={setting.id}>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>{setting.label}</Text>
                {setting.description && (
                  <Text style={styles.settingSubtext}>{setting.description}</Text>
                )}
              </View>
              <Switch
                value={settings[setting.id as keyof Settings]}
                onValueChange={() => toggleSetting(setting.id as keyof Settings)}
                trackColor={{ false: "#e0e0e0", true: "#34C759" }}
                thumbColor="#fff"
                ios_backgroundColor="#e0e0e0"
              />
            </View>
            {index === 0 && <View style={styles.separator} />}
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
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
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
  separator: {
    height: 125,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    fontSize: 13.5,
    fontWeight: '400',
  },
  settingSubtext: {
    fontSize: 11.5,
    color: '#888',
    marginTop: 2,
  },
});

export default PushNotificationsSettings;

// END of Push Notifications UI/UX
// END of Maxwell Guillermo Contribution    