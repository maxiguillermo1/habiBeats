import React from "react";
import { Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter, Link } from "expo-router";

export default function Index() {
  const router = useRouter();
  const navigateTo = (route: string) => {
    router.push(route as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/login-signup")}>
        <Text style={styles.buttonText}>HabiBeats</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/profile")}>
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigateTo("/events")}>
        <Text style={styles.buttonText}>Events</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'white',
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