import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
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
  const pan = useRef(new Animated.ValueXY()).current;
  console.log(message);
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(pan, {
        toValue: { x: 0, y: -200 },
        duration: 300,
        useNativeDriver: false,
      }).start(onClose);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 20,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.timing(pan, {
            toValue: { x: 0, y: -200 },
            duration: 300,
            useNativeDriver: false,
          }).start(onClose);
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (type === 'directmessage') {
    message = `New Message from ${data.recipientName}: ${message}`;
  }

  const handlePress = () => {
    switch (type) {
      case 'directmessage':
        console.log('Sender Name:', data.senderName);
        router.push({
          pathname: '/directmessage',
          params: { recipientId: data.senderId, recipientName: data.senderName },
        });
        break;
      case 'like':
        // navigation.navigate('ProfileScreen', { userId: data.userId });
        break;
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
    <Animated.View
      style={[styles.notificationContainer, { transform: [{ translateY: pan.y }] }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.notificationContent} onPress={handlePress}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.notificationText} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

export default InAppNotification;
