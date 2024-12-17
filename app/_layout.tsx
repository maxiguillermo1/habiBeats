// _layout.tsx
// Reyna Aguirre, Mariann Grace Dizon, Maxwell Guillermo, Jesus Donate

import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import InAppNotification from '../components/InAppNotification';
import { onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import initUserStatusService from './services/userStatusService';
import { NavigationContainer } from '@react-navigation/native';


interface Notification {
  id: string;
  message: string;
  type: string;
  data: any;
}

// Define the types for your route parameters
export type RootStackParamList = {
  index: undefined;
  profile: undefined;
  profilesettings: undefined;
  editprofile: undefined;
  DirectMessage: { recipientId: string; recipientName: string };
  GroupMessage: { groupId: string; groupName: string };
};

// Define the RootLayout component
export default function RootLayout() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;
    let cleanupUserStatusService: (() => void) | undefined;

    // Check if the user is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Track current user state
      
      if (user) {
        console.log('User is logged in', user.uid);
        cleanupUserStatusService = initUserStatusService();
        
        // Get the notifications collection for the user
        const notificationsRef = collection(db, 'users', user.uid, 'notifications');
        // Get the notifications that have not been seen
        const q = query(notificationsRef, where('seen', '==', false));

        // Listen for changes to the notifications
        unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            setNotification({
              id: doc.id,
              message: data.message,
              type: data.type,
              data: data.data,
            });
            console.log(`Inside _layout.tsx: ${data.message}`);

            // Mark the notification as seen
            updateDoc(doc.ref, { seen: true });
          });
        });
      } else {
        // User is logged out
        console.log('User is logged out');
        // Clear any existing notifications
        setNotification(null);
        
        // Clean up Firestore listener if it exists
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
        }
        
        // Clean up user status service if it exists
        if (cleanupUserStatusService) {
          cleanupUserStatusService();
        }
      }
    });

    // Cleanup function
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      if (cleanupUserStatusService) {
        cleanupUserStatusService();
      }
    };
  }, []); // Empty dependency array since we want this to run once on mount

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Only show notifications if there's a logged-in user
  return (
    <NavigationContainer>
      <Stack>
        {/* Define the index screen with no header */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Define the profile screen with no header */}
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        {/* Define the edit profile screen with no header */}
        <Stack.Screen name="editprofile" options={{ headerShown: false }} />
        {/* Define the settings screen with no header */}
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        {/* Define the discography screen with no header */}
        <Stack.Screen name="discography" options={{ headerShown: false }} />
        {/* Define the messages screen with no header */}
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        {/* Define the email notifications screen with no header */}
        <Stack.Screen name="settings/email-notifications" options={{ headerShown: false }} />
        {/* Define the push notifications screen with no header */}
        <Stack.Screen name="settings/push-notifications" options={{ headerShown: false }} />
        {/* Define the change password screen with no header */}
        <Stack.Screen name="settings/change-password" options={{ headerShown: false }} />
        {/* Define the block list screen with no header */}
        <Stack.Screen name="settings/block-list" options={{ headerShown: false }} />
        {/* Define the hidden words screen with no header */}
        <Stack.Screen name="settings/hidden-words" options={{ headerShown: false }} />
        {/* Define the delete survey screen with no header */}
        <Stack.Screen name="post-delete-survey" options={{ headerShown: false }} />
        {/* Define the events search screen with no header */}
        <Stack.Screen name="events/search" options={{ headerShown: false }} />
        {/* Define the events event-details screen with no header */}
        <Stack.Screen name="events/event-details" options={{ headerShown: false }} />
        {/* Define the events myevents screen with no header */}
        <Stack.Screen name="events/myevents" options={{ headerShown: false }} />
        {/* Define the current liked list screen with no header */}
        <Stack.Screen name="settings/current-liked-list" options={{ headerShown: false }} />
        {/* Define the pause new interaction screen with no header */}
        <Stack.Screen name="settings/pause-new-interaction" options={{ headerShown: false }} />
        {/* Define the ai chatbot screen with no header */}
        <Stack.Screen name="ai-chatbot" options={{ headerShown: false }} />
        {/* Define the disposable camera screen with no header */}
        <Stack.Screen name="disposable-camera" options={{ headerShown: false }} />
        {/* Define the event tickets screen with no header */}
        <Stack.Screen name="events/event-tickets" options={{ headerShown: false }} />
        {/* Define the event location screen with no header */}
        <Stack.Screen name="events/event-location" options={{ headerShown: false }} />
         {/* Define the artist details screen with no header */}
        <Stack.Screen name="events/artist-details" options={{ headerShown: false }} />
        {/* Define the disposable gallery screen with no header */}
        <Stack.Screen name="disposable-gallery" options={{ headerShown: false }} />
        {/* Define the event spaces screen with no header */}
        <Stack.Screen name="events/event-spaces" options={{ headerShown: false }} /> 
        {/* Define the help center screen with no header */}
        <Stack.Screen name="settings/safety-resources/help-center" options={{ headerShown: false }} />
          
        
      </Stack>
      {currentUser && notification && (
        <InAppNotification
          message={notification.message}
          type={notification.type}
          data={notification.data}
          onClose={handleCloseNotification}
        />
      )}
    </NavigationContainer>
  );
}
