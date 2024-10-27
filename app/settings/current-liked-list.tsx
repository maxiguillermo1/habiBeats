// current-matches-list.tsx
// Reyna Aguirre
import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app, auth } from '../../firebaseConfig';

interface UserMatch {
  uid: string;
  displayName: string;
  profileImageUrl: string;
}

const MatchesList: React.FC = () => {
  const [likedMatches, setLikedMatches] = useState<UserMatch[]>([]);

  useEffect(() => {
    const fetchLikedMatches = async () => {
      const db = getFirestore(app);
      const currentUserId = auth.currentUser?.uid;

      if (!currentUserId) return;

      const userDocRef = doc(db, 'users', currentUserId);

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const matches = userData.matches || {};

          // Get all liked user IDs
          const likedUserIds = Object.keys(matches).filter((uid) => matches[uid] === 'liked');

          // Fetch user details for each liked match
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

          setLikedMatches(likedMatchesData);
        }
      } catch (error) {
        console.error('Error fetching matches list: ', error);
      }
    };

    fetchLikedMatches();
  }, []);

  const handleBlockUser = (uid: string) => {
    console.log(`Block user with UID: ${uid}`);
    // Add functionality to block the user as needed
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Liked Profiles</Text>
      <FlatList
        data={likedMatches}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.matchItem}>
            <Image source={{ uri: item.profileImageUrl }} style={styles.profileImage} />
            <Text style={styles.displayName}>{item.displayName}</Text>
            <TouchableOpacity onPress={() => handleBlockUser(item.uid)} style={styles.blockIcon}>
              <Ionicons name="close-circle" size={30} color="#d9534f" />
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
    color: '#37bdd5',
    marginBottom: 30,
    alignSelf: 'center',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 100,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#37bdd5',
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
