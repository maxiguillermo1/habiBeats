// index.tsx
// Reyna Aguirre, Mariann Grace Dizon, Maxwell Guillermo, Jesus Donate

import React, { useContext } from "react";
import { Text, TouchableOpacity, StyleSheet, SafeAreaView, View, ScrollView, Image } from "react-native";
import { ThemeProvider, ThemeContext } from '../context/ThemeContext';
import { useRouter } from "expo-router"; // Importing useRouter from expo-router for navigation

// Function to navigate to a specific route using the router instance
export default function Index() {
  const router = useRouter(); // Using useRouter hook to get the router instance
  // Add theme context
  const { theme, currentTheme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';

  const navigateTo = (route: string) => {
    router.push(route as never);
  };

  const menuItems = [
    {
      category: "Authentication",
      color: "#37bdd5",
      items: [
        { name: "Landing", route: "/landing" },
        { name: "Login/Signup", route: "/login-signup" },
        { name: "Sign Up", route: "/signup" },
        { name: "Forgot Password", route: "/forgot-password" },
        { name: "Forgot Password Confirmation", route: "/forgot-password-confirmation" }
      ]
    },
    {
      category: "User Profile",
      color: "#fba904",
      items: [
        { name: "Profile", route: "/profile" },
        { name: "Edit Profile", route: "/editprofile" },
        { name: "Disposable Camera", route: "/disposable-camera" },
        { name: "Disposable Gallery", route: "/disposable-gallery" },
        { name: "Discography", route: "/discography" },
      ]
    },
    {
      category: "Core Features",
      color: "#fc6c85",
      items: [
        { name: "Search", route: "/events/search" },
        { name: "Match", route: "/match" },
        { name: "Messages", route: "/messages" },
        { name: "Direct Message", route: "/direct-message" },
        { name: "Events", route: "/events" },
        { name: "My Events", route: "/my-events" },
        { name: "Trending", route: "/events/trending" }
      ] 
    },
    {
      category: "Settings",
      color: "#79ce54",
      items: [
        { name: "Settings", route: "/settings" },
        { name: "Email Notifications", route: "/settings/email-notifications" },
        { name: "Push Notifications", route: "/settings/push-notifications" },
        { name: "Change Password", route: "/settings/change-password" },
        { name: "Change Email", route: "/settings/change-email" },
        { name: "Block List", route: "/settings/block-list" },
        { name: "Hidden Words", route: "/settings/hidden-words" },
        { name: "Download Data", route: "/settings/download-data" },
      ]
    },
  ];

  return (
    <ThemeProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#151718' : '#fff8f0' }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/transparent_long_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {menuItems.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categoryContainer}>
              <Text style={[styles.categoryTitle, { color: category.color }]}>{category.category}</Text>
              {category.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => navigateTo(item.route)}
                >
                  <Text style={[styles.menuText, { color: isDarkMode ? '#fff' : '#333' }]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemeProvider>
  );
}

// Styles for the Index component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 310,
    height: 70,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});