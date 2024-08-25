import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image } from "react-native";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>HabiBeats</Text>
        <Image
          source={require('../assets/images/habibeats-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.boldText]}
            placeholder="••••••"
            placeholderTextColor="#E0E0E0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={[styles.input, styles.boldText]}
            placeholder="••••••"
            placeholderTextColor="#E0E0E0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>sign in</Text>
        </TouchableOpacity>
        <View style={styles.bottomLinks}>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>forgot password</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.signUp}>sign up</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: "#e66cab",
    padding: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  forgotPassword: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  signUp: {
    color: '#FFA500',
    fontSize: 14,
  },
});