import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Stack } from 'expo-router';
import { ThemeContext } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

export default function DownloadData() {
  const [pdfSelected, setPdfSelected] = useState(false);
  const [jsonSelected, setJsonSelected] = useState(false);
  const router = useRouter();

    // START of Mariann Grace Dizon Contribution
    // Use theme context
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

    // Update dark mode state when theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark');
    }, [theme]);

    // Fetch user's theme preference from Firebase
    useEffect(() => {
        if (!auth.currentUser) return;
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
            const userData = docSnapshot.data();
            
            // Ensure userData is defined before accessing themePreference
            const userTheme = userData?.themePreference || 'light';
            setIsDarkMode(userTheme === 'dark'); // Set isDarkMode based on themePreference
        });

        return () => unsubscribe(); // Ensure unsubscribe is returned to clean up the listener
    }, [auth.currentUser]);
    // END of Mariann Grace Dizon Contribution

  // Creates a PDF file with the user's profile data
  const generatePDF = async (userData: any) => {
    const htmlContent = `
      <html>
        <body>
          <h1>Your Profile Data</h1>
          <h2>Personal Information</h2>
          <p>First Name: ${userData.firstName || 'Not set'}</p>
          <p>Last Name: ${userData.lastName || 'Not set'}</p>
          <p>Display Name: ${userData.displayName || 'Not set'}</p>
          <p>Age: ${userData.age || 'Not set'}</p>
          <p>Email: ${userData.email || 'Not set'}</p>
          <p>Location: ${userData.location || 'Not set'}</p>
          <p>Display Location: ${userData.displayLocation || 'Not set'}</p>
          <p>Gender: ${userData.gender || 'Not specified'}</p>
          <p>Gender Preference: ${userData.genderPreference || 'Not specified'}</p>
          <p>Pronouns: ${userData.pronouns?.join(', ') || 'Not specified'}</p>
          <p>Match Intention: ${userData.matchIntention || 'Not specified'}</p>
          
          <h2>Age Preferences</h2>
          <p>Minimum Age: ${userData.agePreference?.min || 'Not set'}</p>
          <p>Maximum Age: ${userData.agePreference?.max || 'Not set'}</p>

          <h2>Music Preferences</h2>
          <p>Music Genres: ${userData.musicPreference?.join(', ') || 'None specified'}</p>
          <p>Tune of Month: ${userData.tuneOfMonth || 'Not specified'}</p>
          <p>Favorite Performance: ${userData.favoritePerformance || 'Not specified'}</p>
          <p>Listen To: ${userData.listenTo || 'Not specified'}</p>
          <p>Favorite Music Artists: ${userData.favoriteMusicArtists || 'Not specified'}</p>
          <p>Favorite Album: ${userData.favoriteAlbum || 'Not specified'}</p>
          <p>Artist To See: ${userData.artistToSee || 'Not specified'}</p>

          <h2>Privacy Settings</h2>
          <p>Pronouns Visible: ${userData.pronounsVisible ? 'Yes' : 'No'}</p>
          <p>Last Name Visible: ${userData.lastNameVisible ? 'Yes' : 'No'}</p>
          <p>Location Visible: ${userData.locationVisible ? 'Yes' : 'No'}</p>
          <p>My Events Visible: ${userData.myEventsVisible ? 'Yes' : 'No'}</p>
          <p>Hidden Words: ${userData.hiddenWords?.join(', ') || 'None'}</p>

          <h2>Profile Prompts</h2> 
            ${Object.entries(userData.prompts || {}).map(([question, answer]) => 
                ` <div> 
                    <p><strong>Q: ${question}</strong></p> 
                    <p>A: ${answer}</p> 
                </div> `).join('')}
        </body>
      </html>
    `;

    // Prints the HTML content to a PDF file
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  // Downloads the user's profile data in the selected format
  const downloadData = async () => {
    if (!jsonSelected && !pdfSelected) {
      Alert.alert('Please select at least one format');
      return;
    }
    
    try {
      // Checks if the user is logged in
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to download your data');
        return;
      }

      // Gets the user's profile data from the database
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Checks if the user's profile data exists
      if (!userDoc.exists()) {
        Alert.alert('Error', 'Could not find user data');
        return;
      }

      const userData = userDoc.data();
      const timestamp = new Date().toISOString().split('T')[0];

      // Downloads the user's profile data in JSON format
      if (jsonSelected) {
        const jsonString = JSON.stringify(userData, null, 2);
        const jsonFilename = `user_data_${timestamp}.json`;
        const jsonPath = `${FileSystem.documentDirectory}${jsonFilename}`;

        await FileSystem.writeAsStringAsync(jsonPath, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(jsonPath);
        } else {
          await Sharing.shareAsync(jsonPath, {
            mimeType: 'application/json',
            dialogTitle: 'Download JSON Data',
          });
        }
      }

      // Downloads the user's profile data in PDF format
      if (pdfSelected) {
        const pdfUri = await generatePDF(userData);
        const pdfFilename = `user_data_${timestamp}.pdf`;

        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(pdfUri);
        } else {
          await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Download PDF Data',
          });
        }
      }

      // Alerts the user that the data has been downloaded successfully
      Alert.alert('Success', 'Your data has been downloaded successfully');
    } catch (error) {
      // Alerts the user that the data failed to download
      console.error('Error downloading data:', error);
      Alert.alert('Error', 'Failed to download data. Please try again.');
    }
  };
  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, isDarkMode && styles.backButtonDark]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Download Your Data</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.content, isDarkMode && styles.contentDark]}>
        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
          Select the format(s) in which you'd like to download your profile data:
        </Text>

        <TouchableOpacity 
          style={[styles.checkboxContainer, isDarkMode && styles.checkboxContainerDark]}
          onPress={() => setJsonSelected(!jsonSelected)}
        >
          <Checkbox
            status={jsonSelected ? 'checked' : 'unchecked'}
            onPress={() => setJsonSelected(!jsonSelected)}
            color={isDarkMode ? '#fba904' : undefined}
          />
          <View style={styles.checkboxText}>
            <Text style={[styles.formatTitle, isDarkMode && styles.formatTitleDark]}>JSON Format</Text>
            <Text style={[styles.formatDescription, isDarkMode && styles.formatDescriptionDark]}>
              Raw data format, useful for data backup or transfer
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.checkboxContainer, isDarkMode && styles.checkboxContainerDark]}
          onPress={() => setPdfSelected(!pdfSelected)}
        >
          <Checkbox
            status={pdfSelected ? 'checked' : 'unchecked'}
            onPress={() => setPdfSelected(!pdfSelected)}
            color={isDarkMode ? '#fba904' : undefined}
          />
          <View style={styles.checkboxText}>
            <Text style={[styles.formatTitle, isDarkMode && styles.formatTitleDark]}>PDF Format</Text>
            <Text style={[styles.formatDescription, isDarkMode && styles.formatDescriptionDark]}>
              Readable document format with your profile information
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.downloadButton,
            (!jsonSelected && !pdfSelected) && styles.downloadButtonDisabled,
            isDarkMode && styles.downloadButtonDark
          ]}
          onPress={downloadData}
          disabled={!jsonSelected && !pdfSelected}
        >
          <Text style={[styles.downloadButtonText, isDarkMode && styles.downloadButtonTextDark]}>Download</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  containerDark: {
    backgroundColor: '#0e1514',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerDark: {
    backgroundColor: '#0e1514',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitleDark: {
    color: '#fff',
  },
  backButton: {
    fontSize: 34,
    color: '#333',
  },
  backButtonDark: {
    color: '#fff',
  },
  placeholder: {
    width: 24,
  },
  content: {
    padding: 30,
  },
  contentDark: {
    backgroundColor: '#0e1514',
  },
  description: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 20,
  },
  descriptionDark: {
    color: '#aaa',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  checkboxContainerDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  checkboxText: {
    marginLeft: 12,
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  formatTitleDark: {
    color: '#fff',
  },
  formatDescription: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  formatDescriptionDark: {
    color: '#aaa',
  },
  downloadButton: {
    backgroundColor: '#fba904',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  downloadButtonDark: {
    backgroundColor: '#fba904',
  },
  downloadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButtonTextDark: {
    color: '#fff',
  },
});
