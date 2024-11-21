import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { AndroidNotificationPriority } from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const appState = AppState.currentState;
    return {
      shouldShowAlert: appState !== 'active', // Show alert only if app is not active
      shouldPlaySound: appState !== 'active',
      shouldSetBadge: appState !== 'active',
    };
  },
});

// Register for push notifications
export async function registerForPushNotifications() {
  let token;

  if (!Device.isDevice) {
    alert('Push Notifications are not available on simulator');
    return;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If no existing permission, ask for permission
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  // Get Expo push token
  token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'b84f445c-ce92-4d11-8330-a9a9373e08c9', // Expo project ID from app.json
  })).data;

  // Set up special requirements for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: '../assets/sounds/notification_sound.wav',
    });
  }

  // Save the token to Firestore if user is authenticated
  if (auth.currentUser) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      expoPushToken: token
    });
  }

  return token;
}

// Send push notification
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
    priority: Platform.OS === 'android' ? 'high' : undefined,
    channelId: Platform.OS === 'android' ? 'default' : undefined,
    badge: 1,
    icon: '../assets/habibeats-logo.png',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    console.log('Push notification response:', responseData);

    if (!response.ok) {
      throw new Error(`Push notification failed: ${responseData.message}`);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Set up notification listeners
export function setupNotificationListeners() {
  // Handle notifications received while app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Handle notifications when they're tapped
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    // Handle navigation or other actions based on notification
  });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
}
