import { getFirestore, doc, updateDoc, getDoc, onSnapshot  } from 'firebase/firestore';
import { app, auth } from '../../firebaseConfig';
import { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';

export default function PauseNewInteraction() {
  const [isPaused, setIsPaused] = useState(false);
  const db = getFirestore(app);
  const navigation = useNavigation();

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

  // Fetch initial pause status
  useEffect(() => {
    if (auth.currentUser?.uid) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      // Add async function to fetch the data
      const fetchPauseStatus = async () => {
        try {
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            setIsPaused(docSnap.data().paused || false);
          }
        } catch (error) {
          console.error('Error fetching pause status:', error);
        }
      };
      
      fetchPauseStatus();
    }
  }, [auth.currentUser]);

  const togglePauseStatus = async () => {
    if (!auth.currentUser?.uid) return;

    const userDoc = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userDoc, {
        paused: !isPaused
      });
      setIsPaused(!isPaused);
    } catch (error) {
      console.error('Error updating pause status:', error);
    }
  };
  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>
              Pause New Matches
            </Text>
          </View>
          <Text style={[styles.description, isDarkMode && styles.darkText]}>
            would you like to temporarily pause being shown to other users?
          </Text>
          <View style={styles.statusWrapper}>
            <Text style={[styles.statusText, isDarkMode && styles.darkText]}>current status of account: </Text>
            <Text style={[
              styles.statusValue, 
              { color: isPaused ? '#de3c3c' : '#79ce54' }
            ]}>
              {isPaused ? 'Paused' : 'Active'}
            </Text>
          </View>
          <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>paused example: </Text>
          <Image 
            source={require('../../assets/images/IMG_9331.jpg')} 
            style={styles.statusImage}
          />

          <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>active example: </Text>
            <Image 
                source={require('../../assets/images/IMG_9332.jpg')} 
                style={styles.statusImage}
            />
        </View>
      </ScrollView>

      <View style={[styles.buttonContainer, isDarkMode && styles.darkContainer]}>
        <TouchableOpacity
          onPress={togglePauseStatus}
          style={[
            styles.button,
            { backgroundColor: isPaused ? '#79ce54' : '#de3c3c' }
          ]}
        >
          <Text style={styles.buttonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  contentWrapper: {
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    marginHorizontal: 20,
    paddingRight: 65,
  },
  backButton: {
    marginRight: 40,
    padding: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 20,
    color: '#0e1514',
    textAlign: 'center',
  },
  darkText: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    marginHorizontal: 20,
    color: '#7d7d7d',
    textAlign: 'left',
    marginTop: 30,
  },
  darkSubtitle: {
    color: '#888888',
  },
  description: {
    fontSize: 14,
    marginHorizontal: 20,
    color: '#0e1514',
    lineHeight: 20,
    textAlign: 'center',
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 60,
    marginTop: 40,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0e1514',
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff8f0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  statusImage: {
    width: '80%',
    height: 500,
    alignSelf: 'center',
    marginTop: 20,
    resizeMode: 'contain',
    borderWidth: 2,
    borderColor: '#fc6c85',
    borderRadius: 8,
    marginHorizontal: 'auto',
    padding: 40,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff8f0',
    paddingVertical: 20,
    paddingHorizontal: 20,
  }
});
