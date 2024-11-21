import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface InAppNotificationProps {
  message: string;
  type: string;
  data: any;
  onClose: () => void;
}

const InAppNotification: React.FC<InAppNotificationProps> = ({ message, type, data, onClose }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    switch (type) {
      case 'directmessage':
        router.push({
            pathname: '/directmessage',
            params: { recipientId: data.recipientId, recipientName: data.recipientName },
          });
        break;
      case 'like':
        // navigation.navigate('ProfileScreen', { userId: data.userId });
        break;
      // Add more cases for different notification types
      default:
        break;
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'directmessage':
        return <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />;
      case 'like':
        return <Ionicons name="heart-outline" size={24} color="#FF2D55" />;
      case 'welcome':
        return <Ionicons name="happy-outline" size={24} color="#34C759" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#007AFF" />;
    }
  };

  return (
    <TouchableOpacity style={styles.notificationContainer} onPress={handlePress}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default InAppNotification;
