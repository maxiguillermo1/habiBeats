// current-interaction-list.tsx  // change filename later
// shows current matches while allowing users to block and report the users on this page
// Reyna Aguirre
import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app, auth } from '../../firebaseConfig';

interface UserMatch {
  uid: string;
  displayName: string;
  profileImageUrl: string;
}

const MatchesList: React.FC = () => {
  const [likedMatches, setLikedMatches] = useState<UserMatch[]>([]);
  const [dislikedMatches, setDislikedMatches] = useState<UserMatch[]>([]);
  useEffect(() => {
    const fetchMatches = async () => {
      const db = getFirestore(app);
      const currentUserId = auth.currentUser?.uid;
  
      if (!currentUserId) return;
  
      const userDocRef = doc(db, 'users', currentUserId);
  
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const matches = userData.matches || {};
  
          // Get liked and disliked user IDs
          const likedUserIds = Object.keys(matches).filter((uid) => matches[uid] === 'liked');
          const dislikedUserIds = Object.keys(matches).filter((uid) => matches[uid] === 'disliked');
  
          // Fetch user details for both liked and disliked matches
          const likedMatchesData: UserMatch[] = await Promise.all(
            likedUserIds.map(async (uid) => {
              const matchDoc = await getDoc(doc(db, 'users', uid));
              const matchData = matchDoc.data();
              return {
                uid,
                displayName: matchData?.displayName || '',
                profileImageUrl: matchData?.profileImageUrl || '',
              };
            })
          );
  
          const dislikedMatchesData: UserMatch[] = await Promise.all(
            dislikedUserIds.map(async (uid) => {
              const matchDoc = await getDoc(doc(db, 'users', uid));
              const matchData = matchDoc.data();
              return {
                uid,
                displayName: matchData?.displayName || '',
                profileImageUrl: matchData?.profileImageUrl || '',
              };
            })
          );
  
          setLikedMatches(likedMatchesData);
          setDislikedMatches(dislikedMatchesData);
        }
      } catch (error) {
        console.error('Error fetching matches list: ', error);
      }
    };

    fetchMatches();
  }, []);

  const handleBlockUser = (uid: string) => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const db = getFirestore(app);
              const currentUserId = auth.currentUser?.uid;
              if (!currentUserId) return;
  
              const userDocRef = doc(db, 'users', currentUserId);
              const userDoc = await getDoc(userDocRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const matches = { ...userData.matches };
                
                // Update the status to 'blocked'
                matches[uid] = 'blocked';
                
                // Update the document
                await updateDoc(userDocRef, { matches });
                
                // Remove the blocked user from the UI
                setLikedMatches(prev => prev.filter(match => match.uid !== uid));
                setDislikedMatches(prev => prev.filter(match => match.uid !== uid));
              }
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Liked Profiles</Text>
      <FlatList
        data={likedMatches}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.matchItem}>
            <Image source={{ uri: item.profileImageUrl }} style={styles.profileLikedImage} />
            <Text style={styles.displayName}>{item.displayName}</Text>
            <TouchableOpacity onPress={() => handleBlockUser(item.uid)} style={styles.blockIcon}>
              <Ionicons name="warning" size={27} color="rgba(222, 60, 60, 0.8)" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.title}>Current Disliked Profiles</Text>
      <FlatList
        data={dislikedMatches}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.matchItem}>
            <Image source={{ uri: item.profileImageUrl }} style={styles.profileDislikedImage} />
            <Text style={styles.displayName}>{item.displayName}</Text>
            <TouchableOpacity onPress={() => handleBlockUser(item.uid)} style={styles.blockIcon}>
              <Ionicons name="warning" size={27} color="rgba(222, 60, 60, 0.8)" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#7d7d7d',
    marginBottom: 30,
    alignSelf: 'center',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileLikedImage: {
    width: 75,
    height: 75,
    borderRadius: 100,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 5,
    borderColor: '#79ce54',
  },
  profileDislikedImage: {
    width: 75,
    height: 75,
    borderRadius: 100,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 5,
    borderColor: '#de3c3c',
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1, // Takes up remaining space
  },
  blockIcon: {
    marginRight: 15,
  },
});

export default MatchesList;
