// Import necessary dependencies
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Switch, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

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

  const handleSaveLocationChange = (data: any, details: any) => {
    if (details) {
      setTempLocation(details.formatted_address);
    }
  };

  const handleSaveLocation = () => {
    setLocation(tempLocation);
    setIsEditingLocation(false);
    setHasChanges(true);
  };

  // Render the component
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                <TouchableOpacity style={styles.editButton} onPress={handleSaveNameChange}>
                  <Text style={styles.editButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.nameInput}>{name}</Text>
            )}
            {isEditingLocation ? (
              <View style={styles.editContainer}>
                <GooglePlacesAutocomplete
                  placeholder='Search for a location'
                  onPress={handleSaveLocationChange}
                  query={{
                    key: 'YOUR_GOOGLE_MAPS_API_KEY',
                    language: 'en',
                  }}
                  styles={{
                    container: styles.googleAutocompleteContainer,
                    textInputContainer: styles.googleAutocompleteInputContainer,
                    textInput: styles.googleAutocompleteInput,
                  }}
                  renderRightButton={() => (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity style={styles.searchButton} onPress={() => {}}>
                        <Ionicons name="search" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveButton} onPress={handleSaveLocation}>
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
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
        </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 80,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#f4a261',
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e66cab',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#e66cab',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  locationInput: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#e07ab1',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderColor: '#f4a261',
    borderWidth: 1,
  },
  modalOption: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#e07ab1',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginHorizontal: 20,
    width: '90%',
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e66cab',
    borderRadius: 8,
    padding: 6,
    marginRight: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  googleAutocompleteContainer: {
    flex: 1,
    width: '100%',
  },
  googleAutocompleteInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  googleAutocompleteInput: {
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e66cab',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#e66cab',
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
