import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

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

  return (
    <TouchableOpacity style={styles.notificationContainer} onPress={handlePress}>
      <Text style={styles.notificationText}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  notificationText: {
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
});

export default InAppNotification;
