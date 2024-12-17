// block-list.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, app, auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { ThemeContext } from '../../context/ThemeContext';

interface UserMatch {
  uid: string;
  displayName: string;
  profileImageUrl: string;
  reports?: {
    [uid: string]: {
      reason: string;
      timestamp: any; 
    };
  };
}

const BlockList = () => {
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
    
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Reported' | 'Blocked'>('Blocked');
  const [blockedMatches, setBlockedMatches] = useState<UserMatch[]>([]);
  const [reportedMatches, setReportedMatches] = useState<UserMatch[]>([]);

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

          // Get blocked user IDs
          const blockedUserIds = Object.keys(matches).filter((uid) => matches[uid] === 'blocked');
          const reportedUserIds = Object.keys(matches).filter((uid) => matches[uid] === 'reported');

          // Fetch user details for each blocked match
          const blockedMatchesData: UserMatch[] = await Promise.all(
            blockedUserIds.map(async (uid) => {
              const matchDoc = await getDoc(doc(db, 'users', uid));
              const matchData = matchDoc.data();
              return {
                uid,
                displayName: matchData?.displayName || '',
                profileImageUrl: matchData?.profileImageUrl || '',
              };
            })
          );

           // Fetch user details for reported matches
           const reportedMatchesData = await Promise.all(
            reportedUserIds.map(async (uid) => {
              const matchDoc = await getDoc(doc(db, 'users', uid));
              const matchData = matchDoc.data();
              return {
                uid,
                displayName: matchData?.displayName || '',
                profileImageUrl: matchData?.profileImageUrl || '',
                reports: userData.reports ? { [uid]: userData.reports[uid] } : undefined
              };
            })
          );

          setBlockedMatches(blockedMatchesData);
          setReportedMatches(reportedMatchesData);
        }
      } catch (error) {
        console.error('Error fetching blocked or reported matches: ', error);
      }
    };

    fetchMatches();
  }, []);

  const handleUnblockUser = (uid: string) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        { text: 'Cancel', style: 'cancel' },
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
                
                // Remove the user from the blocked list
                delete matches[uid];

                // Update the document
                await updateDoc(userDocRef, { matches });

                // Update the state
                setBlockedMatches((prev) => prev.filter((match) => match.uid !== uid));
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleBackPress = () => {
    router.push('/settings');
  };

  const renderContent = () => {

    if (activeTab === 'Reported' && reportedMatches.length > 0) {
      return (
        <FlatList
          data={reportedMatches}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={styles.matchItem}>
              <Image source={{ uri: item.profileImageUrl }} style={styles.profileImage} />
              <Text style={styles.displayName}>{item.displayName}</Text>
              <Text style={styles.reportReason}>{item.reports?.[item.uid]?.reason}</Text>
            </View>
          )}
        />
      );
    } else if (activeTab === 'Reported' && reportedMatches.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyMessage}>no reported users!</Text>
        </View>
      );
    } else if (activeTab === 'Blocked' && blockedMatches.length > 0) {
      return (
        <FlatList
          data={blockedMatches}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={styles.matchItem}>
              <Image source={{ uri: item.profileImageUrl }} style={styles.profileImage} />
              <Text style={styles.displayName}>{item.displayName}</Text>
              <TouchableOpacity onPress={() => handleUnblockUser(item.uid)} style={styles.blockIcon}>
                <Ionicons name="close-circle-outline" size={24} color="#de3c3c" />
              </TouchableOpacity>
            </View>
          )}
        />
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyMessage}>no blocked users!</Text>
        </View>
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#fff8f0',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff8f0' : '#fff8f0',
    },
    headerRight: {
      width: 24,
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
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#bb86fc' : '#37bdd5',
      borderBottomWidth: 2,
      borderBottomColor: isDarkMode ? '#bb86fc' : '#37bdd5',
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginHorizontal: 20,
    },
    inactiveTab: {
      fontSize: 16,
      color: isDarkMode ? '#888' : '#888',
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginHorizontal: 20,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 40,
    },
    matchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    displayName: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    blockIcon: {
      paddingHorizontal: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyMessage: {
      fontSize: 16,
      color: isDarkMode ? '#888' : '#888',
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: 30,
      paddingBottom: 30,
      textAlign: 'center',
      color: isDarkMode ? '#888' : '#888',
      fontSize: 12,
    },
    learnMore: {
      color: isDarkMode ? '#bb86fc' : '#37bdd5',
    },
    userInfo: {
      flex: 1,
      marginRight: 10,
    },
    reportReason: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity onPress={() => setActiveTab('Reported')}>
          <Text style={activeTab === 'Reported' ? styles.activeTab : styles.inactiveTab}>Reported</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Blocked')}>
          <Text style={activeTab === 'Blocked' ? styles.activeTab : styles.inactiveTab}>Blocked</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>

      <Text style={styles.footer}>
        Wondering how Block List works? <Text style={styles.learnMore}>Learn more</Text>
      </Text>
    </SafeAreaView>
  );
};

export default BlockList;
