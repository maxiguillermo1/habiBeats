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
      {/* Define the profile settings screen with no header */}
      <Stack.Screen name="profilesettings" options={{ headerShown: false }} />
      {/* Define the edit profile screen with no header */}
      <Stack.Screen name="editprofile" options={{ headerShown: false }} />
      {/* Define the settings screen with no header */}
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      {/* Define the email notifications screen with no header */}
      <Stack.Screen name="settings/email-notifications" options={{ headerShown: false }} />
      {/* Define the push notifications screen with no header */}
      <Stack.Screen name="settings/push-notifications" options={{ headerShown: false }} />
      {/* Define the change password screen with no header */}
      <Stack.Screen name="settings/changepassword" options={{ headerShown: false }} />
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
    </Stack>
  );
}
