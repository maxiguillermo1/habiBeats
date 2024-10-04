// _layout.tsx
// Reyna Aguirre, Mariann Grace Dizon, Maxwell Guillermo, Jesus Donate

import React from 'react';
import { Stack } from 'expo-router';

// Define the types for your route parameters
export type RootStackParamList = {
  index: undefined;
  profile: undefined;
  profilesettings: undefined;
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
    </Stack>
  );
}
