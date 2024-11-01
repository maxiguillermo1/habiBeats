import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { app, auth } from '../../firebaseConfig';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';

export default function PauseNewInteraction() {
  const [isPaused, setIsPaused] = useState(false);
  const db = getFirestore(app);

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>
            Pause New Matches
          </Text>
          <Text style={styles.description}>
            would you like to temporarily pause being shown to other users?
          </Text>
          <View style={styles.statusWrapper}>
            <Text style={styles.statusText}>current status of account: </Text>
            <Text style={[
              styles.statusValue, 
              { color: isPaused ? '#de3c3c' : '#79ce54' }
            ]}>
              {isPaused ? 'Paused' : 'Active'}
            </Text>
          </View>
          <Text style={styles.subtitle}>paused example: </Text>
          <Image 
            source={require('../../assets/images/IMG_9331.jpg')} 
            style={styles.statusImage}
          />

          <Text style={styles.subtitle}>active example: </Text>
            <Image 
                source={require('../../assets/images/IMG_9332.jpg')} 
                style={styles.statusImage}
            />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
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
  contentWrapper: {
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    marginTop: 80,
    fontSize: 18,
    fontWeight: 'bold',
    margin: 20,
    color: '#0e1514',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    marginHorizontal: 20,
    color: '#7d7d7d',
    textAlign: 'left',
    marginTop: 30,
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
    paddingBottom: 120, // Add padding to prevent content from being hidden behind button
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
