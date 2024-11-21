// _layout.tsx
// Reyna Aguirre, Mariann Grace Dizon, Maxwell Guillermo, Jesus Donate

import React from 'react';
import { Stack } from 'expo-router';

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
  // Return the Stack navigation layout
  return (
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
    </Stack>
  );
}
