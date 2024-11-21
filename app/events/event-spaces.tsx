import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { formatDate } from '../../utils/dateUtils';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: any;
}

const EventSpacesPage = () => {
  const params = useLocalSearchParams();
  const eventData = params.eventData ? JSON.parse(params.eventData as string) : null;
  const router = useRouter();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');

  // Fetch theme preference
  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsDarkMode(userData.themePreference === 'dark');
          setUserName(userData.username || 'Anonymous');
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);

  // Subscribe to comments
  useEffect(() => {
    if (!eventData?.name) return;

    const commentsRef = collection(db, 'eventComments');
    const q = query(
      commentsRef,
      where('eventId', '==', eventData.name),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(newComments);
    });

    return () => unsubscribe();
  }, [eventData]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'eventComments'), {
        eventId: eventData.name,
        userId: auth.currentUser.uid,
        userName: userName,
        text: newComment.trim(),
        timestamp: new Date()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <ScrollView>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#ffffff' : '#007AFF'} />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Event Space
            </Text>
            {eventData?.name && (
              <Text style={[styles.eventName, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {eventData.name}
              </Text>
            )}
            
            {(eventData?.venue || eventData?.location) && (
              <TouchableOpacity onPress={() => router.push({
                pathname: '/events/event-location',
                params: { venue: eventData.venue, location: eventData.location }
              })}>
                <Text style={[styles.locationText, { color: isDarkMode ? '#fc6c85' : '#fc6c85' }]}>
                  {`${eventData.venue || ''} ${eventData.venue && eventData.location ? '-' : ''} ${eventData.location || ''}`}
                </Text>
              </TouchableOpacity>
            )}

            {eventData?.imageUrl && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: eventData.imageUrl }} style={styles.eventImage} />
              </View>
            )}

            <View style={styles.discussionContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#79ce54' : '#37bdd5'} style={styles.loader} />
              ) : (
                <View style={styles.commentsContainer}>
                  {comments.map((comment) => (
                    <View key={comment.id} style={[styles.commentBox, { 
                      backgroundColor: isDarkMode ? '#333333' : '#ffffff'
                    }]}>
                      <Text style={[styles.commentUser, { color: isDarkMode ? '#79ce54' : '#37bdd5' }]}>
                        {comment.userName}
                      </Text>
                      <Text style={[styles.commentText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                        {comment.text}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: isDarkMode ? '#333333' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000'
          }]}
          placeholder="Add a comment..."
          placeholderTextColor={isDarkMode ? '#999999' : '#666666'}
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitComment}>
          <Text style={styles.submitButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 40,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
    color: '#fc6c85',
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discussionContainer: {
    flex: 1,
  },
  commentsContainer: {
    gap: 12,
  },
  commentBox: {
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  submitButton: {
    backgroundColor: '#37bdd5',
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
});

export default EventSpacesPage;
