// current-interaction-list.tsx  // change filename later
// shows current matches while allowing users to block and report the users on this page
// Reyna Aguirre
import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app, auth } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Settings: undefined;
};

type LikedListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface UserMatch {
  uid: string;
  displayName: string;
  profileImageUrl: string;
}

const MatchesList: React.FC = () => {
  const navigation = useNavigation<LikedListScreenNavigationProp>();
  const [likedMatches, setLikedMatches] = useState<UserMatch[]>([]);
  const [dislikedMatches, setDislikedMatches] = useState<UserMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'Liked' | 'Disliked'>('Liked');
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

  const handleReportUser = (uid: string) => {
    Alert.alert(
      'Report User',
      'select reason:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Inappropriate Content',
          onPress: () => submitReport(uid, 'inappropriate_content'),
        },
        {
          text: 'Harassment',
          onPress: () => submitReport(uid, 'harassment'),
        },
        {
          text: 'Fake Profile',
          onPress: () => submitReport(uid, 'fake_profile'),
        },
        {
          text: 'Spam',
          onPress: () => submitReport(uid, 'spam'),
        },
      ],
      { cancelable: true }
    );
  };
  
  const submitReport = async (uid: string, reason: string) => {
    try {
      const db = getFirestore(app);
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;
  
      const userDocRef = doc(db, 'users', currentUserId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const matches = { ...userData.matches };
        const reports = { ...userData.reports } || {};
        
        // Update the matches status to 'reported'
        matches[uid] = 'reported';
        
        // Store the report details
        reports[uid] = {
          reason: reason,
          timestamp: new Date().toISOString(),
        };
        
        // Update the document with both matches and reports
        await updateDoc(userDocRef, { 
          matches,
          reports,
        });
        
        // Remove the reported user from the UI
        setLikedMatches(prev => prev.filter(match => match.uid !== uid));
        setDislikedMatches(prev => prev.filter(match => match.uid !== uid));
        
        Alert.alert('Success', 'user has been reported successfully');
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('Error', 'Failed to report user. Please try again.');
    }
  };

  const handleBackPress = () => {
    navigation.navigate('settings' as never);
  };

  const renderContent = () => {
    const data = activeTab === 'Liked' ? likedMatches : dislikedMatches;
    const imageStyle = activeTab === 'Liked' ? styles.profileLikedImage : styles.profileDislikedImage;
    const emptyMessage = activeTab === 'Liked' ? 'No liked profiles!' : 'No disliked profiles!';
    
    // Use a reliable default avatar URL
    const defaultImageUrl = 'https://ui-avatars.com/api/?name=User&background=random';

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View style={styles.matchItem}>
              <Image 
                source={{ 
                  uri: item.profileImageUrl || defaultImageUrl,
                  cache: 'force-cache' // Add caching to improve performance
                }} 
                style={imageStyle}
              />
              <Text style={styles.displayName}>{item.displayName}</Text>
              <TouchableOpacity onPress={() => handleBlockUser(item.uid)} style={styles.blockIcon}>
                <Ionicons name="remove-circle" size={23} color="rgba(222, 60, 60, 0.8)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReportUser(item.uid)} style={styles.blockIcon}>
                <Ionicons name="warning" size={23} color="rgba(222, 60, 60, 0.8)" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interaction List</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity onPress={() => setActiveTab('Liked')}>
          <Text style={activeTab === 'Liked' ? styles.activeTab : styles.inactiveTab}>Liked Profiles</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Disliked')}>
          <Text style={activeTab === 'Disliked' ? styles.activeTab : styles.inactiveTab}>Disliked Profiles</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
    marginBottom: 20,
  },
  activeTab: {
    fontSize: 13,
    fontWeight: '600',
    color: '#37bdd5',
    borderBottomWidth: 2,
    borderBottomColor: '#37bdd5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
  },
  inactiveTab: {
    fontSize: 13,
    color: '#888',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
  },
  content: {
    flexGrow: 1,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 7.5,
    borderRadius: 8,
  },
  profileLikedImage: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginLeft: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#79ce54',
  },
  profileDislikedImage: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginLeft: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#de3c3c',
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  blockIcon: {
    marginRight: 8,
  },
  listContainer: {
    marginHorizontal: 50,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
});

export default MatchesList;

