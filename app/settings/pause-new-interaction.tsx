import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { app, auth } from '../../firebaseConfig';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>
          Pause New Matches
        </Text>
        <Text style={styles.description}>
          Would you like to temporarily pause being shown to other users?
        </Text>
        <View style={styles.statusWrapper}>
          <Text style={styles.statusText}>Current status of account: </Text>
          <Text style={styles.statusValue}>{isPaused ? 'Paused' : 'Active'}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        onPress={togglePauseStatus}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{isPaused ? 'Unpause' : 'Pause'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  contentWrapper: {
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  description: {
    color: '#4B5563',
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563EB',
    borderRadius: 6,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
