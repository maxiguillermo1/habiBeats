// index.tsx
// Reyna Aguirre, Mariann Grace Dizon, Maxwell Guillermo, Jesus Donate

import React from "react";
import { Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter, Link } from "expo-router"; // Importing useRouter and Link from expo-router for navigation

// Function to navigate to a specific route using the router instance
export default function Index() {
  const router = useRouter(); // Using useRouter hook to get the router instance
  const navigateTo = (route: string) => {
    router.push(route as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation buttons to different routes */}
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/landing")}>
        <Text style={styles.buttonText}>HabiBeats</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/login-signup")}>
        <Text style={styles.buttonText}>LogIn</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/profile")}>
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/search")}>
        <Text style={styles.buttonText}>Events</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/messages")}>
        <Text style={styles.buttonText}>Messages</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/directmessage")}>
        <Text style={styles.buttonText}>Direct Message</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/match")}>
        <Text style={styles.buttonText}>Match</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/myevents")}>
        <Text style={styles.buttonText}>My Events</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/search")}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/trending")}>
        <Text style={styles.buttonText}>Trending</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles for the Index component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'white',
  },
  habiBeatsButton: {
    backgroundColor: "#ff69b4",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  habiBeatsButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#e66cab",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});