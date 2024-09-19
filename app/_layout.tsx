// _layout.tsx
// Reyna Aguirre, Mariann Grace Dizon, Maxwell Guillermo, Jesus Donate

import React from 'react';
import { Stack } from 'expo-router';

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
    </Stack>
  );
}
