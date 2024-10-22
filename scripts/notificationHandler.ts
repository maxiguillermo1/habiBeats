import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, doc } from 'firebase/firestore';

// Define the type for the push token, which can be a string or undefined
type PushToken = string | undefined;

export async function registerForPushNotificationsAsync(): Promise<PushToken> {
  let token: PushToken;

  // Check if the user has a physical device
  if (Device.isDevice) {
    // Check if the user has already granted permission for push notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus: string = existingStatus;

    if (existingStatus !== 'granted') {
      // If the user has not granted permission, request permission
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return undefined; // Return undefined if no token is available
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'b84f445c-ce92-4d11-8330-a9a9373e08c9',
    });
    token = tokenData.data;
  } else {
    // If the user does not have a physical device, alert them
    alert('Must use physical device for Push Notifications');
    return undefined;
  }

  // If the user is on Android, set the notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  console.log('Push token:', token);
  return token;
}


// Add a notification to the user's notifications collection
export const addNotification = async (userId: string, message: string) => {
  const db = getFirestore();
  const userDocRef = doc(db, 'users', userId);
  const notificationsRef = collection(userDocRef, 'notifications');
  
  try {
    const newNotificationRef = await addDoc(notificationsRef, {
      message,
      timestamp: serverTimestamp(),
      read: false,
    });
    console.log('Notification added successfully with ID:', newNotificationRef.id);
    return newNotificationRef.id;
  } catch (error) {
    console.error('Error adding notification: ', error);
    throw error;
  }
};

// Checks if there are any unread notifications
export const hasUnreadNotifications = async (userId: string): Promise<boolean> => {
  const db = getFirestore();
  const userDocRef = doc(db, 'users', userId);
  const notificationsRef = collection(userDocRef, 'notifications');
  const q = query(notificationsRef, where('read', '==', false));
  
  try {
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking unread notifications: ', error);
    return false;
  }
};