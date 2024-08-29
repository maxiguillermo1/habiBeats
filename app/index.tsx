import React from "react";
import { Text, View, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  const handlePress = () => {
    router.push("/login-signup");
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>HabiBeats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.profileButton]} onPress={handleProfilePress}>
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#e66cab",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  profileButton: {
    backgroundColor: "#4a90e2",
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});