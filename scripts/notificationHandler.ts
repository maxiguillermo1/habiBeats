import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

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
  // Get the Firestore database instance
  const db = getFirestore();
  // Get the user's document reference
  const userDocRef = doc(db, 'users', userId);
  // Get the notifications collection reference
  const notificationsRef = collection(userDocRef, 'notifications');
  // Create a query to find unread notifications
  const q = query(notificationsRef, where('read', '==', false));
  
  try {
    // Execute the query and check if there are any unread notifications
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking unread notifications: ', error);
    return false;
  }
};

// Send a push notification to a specific user
export const sendPushNotification = async (expoPushToken: string, title: string, body: string, data?: any) => {
  // Define the message object
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
  };

  try {
    // Send the push notification to the Expo push server
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  const db = getFirestore();
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
  
  try {
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Set up notification handler for when app is in foreground
export const setNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// Add a listener for receiving notifications
export const addNotificationListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  // Add a listener for receiving notifications
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

// Add a listener for responding to notification taps
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  // Add a listener for responding to notification taps
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
};