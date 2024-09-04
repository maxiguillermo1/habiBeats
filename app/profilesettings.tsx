// Import necessary dependencies
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Switch, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Define the ProfileSettings component
export default function ProfileSettings() {
  // Initialize router for navigation
  const router = useRouter();
  // Get initial image values from route params
  const { initialProfileImage, initialFavoritePerformanceImage } = useLocalSearchParams();
  // State variables for various settings
  const [showLastName, setShowLastName] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [profileImage, setProfileImage] = useState<string>(initialProfileImage as string);
  const [favoritePerformanceImage, setFavoritePerformanceImage] = useState(initialFavoritePerformanceImage as string | null);
  const [hasChanges, setHasChanges] = useState(false);
  const [name, setName] = useState('Miles Morales');
  const [location, setLocation] = useState('Brooklyn, New York');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempLocation, setTempLocation] = useState(location);

  // Function to handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Function to handle image picking
  const handleImagePicker = async (setImageFunction: React.Dispatch<React.SetStateAction<string>>) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageFunction(result.assets[0].uri);
      setHasChanges(true);
    }
  };

  // Function to handle profile picture edit
  const handleEditProfilePicture = () => setModalVisible(true);

  // Function to handle saving changes
  const handleSave = () => {
    console.log('Saving changes...');
    router.replace({
      pathname: '/profile',
      params: { 
        updatedProfileImage: profileImage,
        updatedFavoritePerformanceImage: favoritePerformanceImage,
        updatedName: name,
        updatedLocation: location
      }
    });
  };

  // Function to handle logout
  const handleLogout = () => {
    // Add any logout logic here (e.g., clearing user session)
    router.replace('/login-signup');
  };

  const handleSaveNameChange = () => {
    setName(tempName);
    setIsEditingName(false);
    setHasChanges(true);
  };

  const handleSaveLocationChange = () => {
    setLocation(tempLocation);
    setIsEditingLocation(false);
    setHasChanges(true);
  };

  // Render the component
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>
        
        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImage }}
              style={styles.profilePicture}
            />
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePicture}>
              <Ionicons name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {isEditingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempName}
                onChangeText={setTempName}
              />
              <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveNameChange}>
                <Text style={styles.saveEditButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.nameInput}>{name}</Text>
          )}
          {isEditingLocation ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempLocation}
                onChangeText={setTempLocation}
              />
              <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveLocationChange}>
                <Text style={styles.saveEditButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.locationInput}>{location}</Text>
          )}
        </View>

        {/* Settings section */}
        <View style={styles.settingsSection}>
          {/* Notifications setting */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#767577", true: "#e66cab" }}
              thumbColor={notifications ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
          {/* Show Last Name setting */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Show Last Name</Text>
            <Switch
              value={showLastName}
              onValueChange={setShowLastName}
              trackColor={{ false: "#767577", true: "#e66cab" }}
              thumbColor={showLastName ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
          {/* Show Location setting */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Show Location</Text>
            <Switch
              value={showLocation}
              onValueChange={setShowLocation}
              trackColor={{ false: "#767577", true: "#e66cab" }}
              thumbColor={showLocation ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
          {/* Show My Events setting */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Show My Events</Text>
            <Switch
              value={showMyEvents}
              onValueChange={setShowMyEvents}
              trackColor={{ false: "#767577", true: "#e66cab" }}
              thumbColor={showMyEvents ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        </View>

       

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>logout</Text>
        </TouchableOpacity>

        {/* Modal for edit options */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalOption} onPress={() => { handleImagePicker(setProfileImage); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Profile Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setIsEditingLocation(true); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setIsEditingName(true); setModalVisible(false); }}>
                <Text style={styles.modalOptionText}>Change Display Name</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

// Define styles for the component
const styles = StyleSheet.create({
  // Style for the main container of the screen
  container: {
    flex: 1, // Fills the available space
    backgroundColor: 'white', // Sets the background color to white
  },
  // Style for the back button container
  backButton: {
    position: 'absolute', // Absolutely positioned to control placement
    top: 80, // Distance from the top of the screen
    left: 30, // Distance from the left of the screen
    zIndex: 1, // Ensures the button appears on top of other elements
  },
  // Style for the back button text
  backButtonText: {
    fontSize: 14, // Font size for the text
    color: '#f4a261', // Orange color for the text
    fontWeight: 'bold', // Makes the text bold
  },
  // Style for the profile section containing the image, name, and location
  profileSection: {
    alignItems: 'center', // Aligns content to the center horizontally
    marginTop: 120, // Adds margin above the section
    marginBottom: 30, // Adds margin below the section
  },
  // Style for the container of the profile image
  profileImageContainer: {
    position: 'relative', // Allows absolute positioning of child elements
  },
  // Style for the profile picture image
  profilePicture: {
    width: 100, // Width of the image
    height: 100, // Height of the image
    borderRadius: 50, // Makes the image circular by rounding the corners
    borderWidth: 3, // Adds a border around the image
    borderColor: '#e66cab', // Pink color for the border
  },
  // Style for the edit button that appears over the profile picture
  editButton: {
    position: 'absolute', // Absolutely positioned within the profile image container
    right: 0, // Places the button at the right edge of the container
    bottom: 0, // Places the button at the bottom of the container
    backgroundColor: '#e66cab', // Pink background for the button
    borderRadius: 15, // Rounds the corners to create a circular button
    width: 30, // Width of the button
    height: 30, // Height of the button
    justifyContent: 'center', // Centers the content vertically
    alignItems: 'center', // Centers the content horizontally
  },
  // Style for the name input text
  nameInput: {
    fontSize: 24, // Large font size for the name
    fontWeight: 'bold', // Makes the name text bold
    marginTop: 10, // Adds margin above the text
    textAlign: 'center', // Centers the text horizontally
  },
  // Style for the location input text
  locationInput: {
    fontSize: 16, // Slightly smaller font size for the location text
    color: '#666', // Grey color for the text
    marginTop: 5, // Adds margin above the text
    marginBottom: 20, // Adds margin below the text
    textAlign: 'center', // Centers the text horizontally
  },
  // Style for the section containing the settings switches
  settingsSection: {
    paddingHorizontal: 16, // Adds horizontal padding to the section
  },
  // Style for individual setting items (like the switches)
  settingItem: {
    flexDirection: 'row', // Aligns items in a row
    justifyContent: 'space-between', // Spaces out the label and switch evenly
    alignItems: 'center', // Vertically centers the label and switch
    paddingVertical: 12, // Adds padding above and below the item
    borderBottomWidth: 1, // Adds a bottom border
    borderBottomColor: '#e0e0e0', // Light grey color for the border
  },
  // Style for the setting labels (e.g., Notifications, Show Location)
  settingLabel: {
    fontSize: 16, // Font size for the labels
  },

  
  // Style for the logout button at the bottom
  logoutButton: {
    position: 'absolute', // Absolutely positioned at the bottom of the screen
    bottom: 40, // 40 units from the bottom of the screen
    left: 20, // 20 units from the left of the screen
    right: 20, // 20 units from the right of the screen
    backgroundColor: '#e07ab1', // Slightly different pink color for the button
    padding: 10, // Adds padding inside the button
    borderRadius: 25, // Rounds the button to a pill shape
    alignItems: 'center', // Centers the text inside the button horizontally
  },
  // Style for the text inside the logout button
  logoutButtonText: {
    color: 'white', // White text color
    fontSize: 12, // Small font size
    fontWeight: '500', // Medium font weight
    textTransform: 'lowercase', // Ensures the text is displayed in lowercase
  },
  // Style for the modal container (background of the modal)
  modalContainer: {
    flex: 1, // Fills the entire screen
    justifyContent: 'center', // Centers the modal vertically
    alignItems: 'center', // Centers the modal horizontally
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adds a transparent black overlay background
  },
  // Style for the content inside the modal
  modalContent: {
    width: 300, // Fixed width for the modal content
    backgroundColor: 'white', // White background color for the modal
    borderRadius: 20, // Rounds the corners of the modal
    padding: 20, // Adds padding inside the modal
    alignItems: 'center', // Centers the content inside the modal
    borderColor: '#f4a261', // Orange border color
    borderWidth: 1, // Border width of 1 unit
  },
  // Style for individual options inside the modal
  modalOption: {
    paddingVertical: 15, // Adds vertical padding to each option
    width: '100%', // Makes each option span the full width of the modal
    alignItems: 'center', // Centers the text inside each option
    borderBottomWidth: 1, // Adds a bottom border to each option
    borderBottomColor: '#e0e0e0', // Light grey color for the border
  },
  // Style for the text inside each modal option
  modalOptionText: {
    fontSize: 18, // Font size for the option text
    color: '#e07ab1', // Pink color for the option text
  },
  
  // Style for the container when editing text (name or location)
editContainer: {
  flexDirection: 'row', // Aligns elements in a row
  alignItems: 'center', // Vertically centers the elements
  marginTop: 5, // Adds margin above the container
  marginHorizontal: 20, // Adds margin to the left and right of the container
},
// Style for the text input field when editing name or location
editInput: {
  flex: 1, // Takes up available space in the container
  fontSize: 16, // Smaller font size for the input text
  borderWidth: 1, // Adds a border around the input field
  borderColor: '#e66cab', // Pink color for the border
  borderRadius: 8, // Rounds the corners of the input field
  padding: 6, // Smaller padding inside the input field
  marginRight: 5, // Smaller margin to the right of the input field
},
// Style for the save button when editing name or location
saveEditButton: {
  backgroundColor: '#e66cab', // Pink background color for the button
  paddingVertical: 6, // Smaller vertical padding
  paddingHorizontal: 10, // Smaller horizontal padding
  borderRadius: 20, // Rounds the button to a pill shape
  alignSelf: 'center', // Aligns button in line with the input text field
  height: 35, // Smaller height for the button
  justifyContent: 'center', // Centers text inside the button vertically
},
// Style for the text inside the save button
saveEditButtonText: {
  color: 'white', // White text color
  fontSize: 12, // Smaller font size for the text
  fontWeight: 'bold', // Makes the text bold
  textAlign: 'center', // Centers the text horizontally
},

});

