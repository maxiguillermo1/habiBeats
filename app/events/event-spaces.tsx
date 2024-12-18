import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Animated, Keyboard, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

// Add this interface for animated comments
interface AnimatedComment extends Comment {
  position: Animated.ValueXY;
  scale: Animated.Value;
  opacity: Animated.Value;
}

// Add this interface for the time remaining structure
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const EventSpacesPage = () => {
  const params = useLocalSearchParams();
  const eventData = params.eventData ? JSON.parse(params.eventData as string) : null;
  const router = useRouter();
  const navigation = useNavigation();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [animatedComments, setAnimatedComments] = useState<AnimatedComment[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isEventDay, setIsEventDay] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch theme preference
  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        setIsDarkMode(false);
        setUserName('attendee');
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);

  // Subscribe to comments
  useEffect(() => {
    if (!eventData?.id) return;

    const commentsRef = collection(db, 'events', eventData.id, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as Comment[];
      
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [eventData]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Add this function to create animated comment
  const createAnimatedComment = (comment: Comment) => {
    const position = new Animated.ValueXY({
      x: Math.random() * (screenWidth - 150),
      y: screenHeight - 200
    });
    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(1);

    const animatedComment: AnimatedComment = {
      ...comment,
      position,
      scale,
      opacity
    };

    // Animation sequence
    Animated.sequence([
      // Pop in
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      // Float up
      Animated.parallel([
        Animated.timing(position.y, {
          toValue: -200,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      // Remove comment after animation
      setAnimatedComments(current => 
        current.filter(c => c.id !== comment.id)
      );
    });

    return animatedComment;
  };

  const calculateTimeRemaining = (eventDate: Date): TimeRemaining => {
    const now = new Date();
    const diffTime = Math.max(0, eventDate.getTime() - now.getTime()); // Ensure non-negative
    
    return {
      days: Math.floor(diffTime / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diffTime % (1000 * 60)) / 1000)
    };
  };

  useEffect(() => {
    if (!eventData?.date) return;

    const eventDate = new Date(eventData.date);
    
    const updateCountdown = () => {
      const remaining = calculateTimeRemaining(eventDate);
      setTimeRemaining(remaining);
      
      // Check if countdown has reached zero
      if (remaining.days === 0 && remaining.hours === 0 && 
          remaining.minutes === 0 && remaining.seconds === 0) {
        setShowChat(true);
        setIsEventDay(true);
      }
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call

    return () => clearInterval(timer);
  }, [eventData?.date]);

  // Parse the timeUntilEvent string back to numbers for display
  const timeValues = !isEventDay ? JSON.parse(JSON.stringify(timeRemaining)) : null;

  // Modify the submit handler
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isEventDay || !eventData?.id) return;

    try {
      const commentsRef = collection(db, 'events', eventData.id, 'comments');
      await addDoc(commentsRef, {
        userId: 'user-id', // Replace with actual user ID
        userName,
        text: newComment,
        timestamp: new Date()
      });

      setNewComment('');
      Keyboard.dismiss();
      
      // Scroll to bottom after sending a new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Add this inside your return statement, before the ScrollView
  const renderAnimatedComments = () => (
    <>
      {animatedComments.map((comment) => (
        <Animated.View
          key={comment.id}
          style={[
            styles.floatingComment,
            {
              transform: [
                { translateX: comment.position.x },
                { translateY: comment.position.y },
                { scale: comment.scale }
              ],
              opacity: comment.opacity,
            }
          ]}
        >
          <Text style={styles.floatingCommentText}>{comment.text}</Text>
        </Animated.View>
      ))}
    </>
  );

  // Add this inside the return statement, after the eventImage
  const renderCountdownOrChat = () => (
    <View style={styles.countdownContainer}>
      {!showChat && (
        <>
          <Text style={styles.countdownSubtitle}>
            Event Space Opens :
          </Text>
          {timeValues && (
            <View style={styles.timeUnitsContainer}>
              <View style={styles.timeUnit}>
                <Text style={styles.numberText}>{timeValues.days}</Text>
                <Text style={styles.labelText}>days</Text>
              </View>
              <View style={styles.timeUnit}>
                <Text style={styles.numberText}>{timeValues.hours}</Text>
                <Text style={styles.labelText}>hours</Text>
              </View>
              <View style={styles.timeUnit}>
                <Text style={styles.numberText}>{timeValues.minutes}</Text>
                <Text style={styles.labelText}>minutes</Text>
              </View>
              <View style={styles.timeUnit}>
                <Text style={styles.numberText}>{timeValues.seconds}</Text>
                <Text style={styles.labelText}>seconds</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  // Update the comment rendering in the return statement
  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={[styles.commentBox, { 
      backgroundColor: isDarkMode ? '#333333' : '#ffffff'
    }]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.commentUser, { color: isDarkMode ? '#79ce54' : '#37bdd5' }]}>
          {comment.userName}
        </Text>
        <Text style={styles.commentTime}>
          {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
        </Text>
      </View>
      <Text style={[styles.commentText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
        {comment.text}
      </Text>
    </View>
  );

  // Add this function to handle back press
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push('/');  // Fallback to home/root if can't go back
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled
    >
      {renderAnimatedComments()}
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#ffffff' : '#007AFF'} />
        </TouchableOpacity>

        {/* Fixed Header Section */}
        <View style={[styles.headerSection, { 
          backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0',
          flexDirection: showChat ? 'row' : 'column',
          alignItems: showChat ? 'flex-start' : 'center',
          justifyContent: showChat ? 'space-between' : 'flex-start',
        }]}>
          <View style={[
            showChat ? styles.headerTextContainer : { alignItems: 'center' }
          ]}>
            <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Event Space
            </Text>
            
            {(eventData?.venue || eventData?.location) && (
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/events/event-location',
                  params: { venue: eventData.venue, location: eventData.location }
                })}
                style={[
                  styles.locationContainer,
                  !showChat && styles.centeredLocation
                ]}
              >
                {showChat && (
                  <Ionicons 
                    name="location-outline" 
                    size={14} 
                    color="#fc6c85" 
                    style={styles.locationIcon}
                  />
                )}
                <Text style={[
                  styles.locationText, 
                  { 
                    color: isDarkMode ? '#fc6c85' : '#fc6c85',
                    marginBottom: showChat ? 0 : 15 
                  }
                ]}>
                  {`${eventData.venue || ''} ${eventData.venue && eventData.location ? '-' : ''} ${eventData.location || ''}`}
                </Text>
              </TouchableOpacity>
            )}
            
            {eventData?.name && (
              <Text style={[styles.eventName, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {eventData.name}
              </Text>
            )}
          </View>

          {eventData?.imageUrl && (
            <View style={[
              styles.imageContainer, 
              showChat && styles.smallImageContainer
            ]}>
              <Image source={{ uri: eventData.imageUrl }} style={styles.eventImage} />
            </View>
          )}

          {!showChat && renderCountdownOrChat()}
        </View>

        {/* Scrollable Thread Section */}
        <View style={[styles.threadSection, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
          <ScrollView 
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.discussionContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#79ce54' : '#37bdd5'} style={styles.loader} />
              ) : (
                <View style={styles.commentsContainer}>
                  {comments.map(renderComment)}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {showChat && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkMode ? '#333333' : '#ffffff',
                color: isDarkMode ? '#ffffff' : '#000000'
              }]}
              placeholder="add a comment..."
              placeholderTextColor={isDarkMode ? '#999999' : '#666666'}
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitComment}>
              <Text style={styles.submitButtonText}>send</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 40,
    paddingTop: 100,
    paddingBottom: 15,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 20,
  },
  threadSection: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 999,
    padding: 15,
    backgroundColor: 'transparent',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 11,
    marginBottom: 15,
    paddingTop: 10,

  },
  locationText: {
    fontSize: 12,
    color: '#fc6c85',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  smallImageContainer: {
    width: 80,
    height: 80,
    alignSelf: 'flex-start',
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
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#fc6c85',
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
  floatingComment: {
    position: 'absolute',
    backgroundColor: 'rgba(252, 108, 133, 0.8)',
    padding: 10,
    borderRadius: 20,
    maxWidth: 150,
    zIndex: 1000,
  },
  floatingCommentText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  countdownSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 16,
    color: "#fc6c85",
  },
  timeUnitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 60,
  },
  numberText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    color: '#666666',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  locationIcon: {
    marginRight: 4,
  },
  centeredLocation: {
    alignItems: 'center',
    width: '100%',
  },
});

export default EventSpacesPage;
