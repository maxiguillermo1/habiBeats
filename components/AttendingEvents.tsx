// AttendingEvents.tsx
// Maxwell Guillermo 

// START of AttendingEvents UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { formatDate } from '../utils/dateUtils';

interface Event {
  title: string;
  date: string;
  venue: string;
  imageUrl: any; // Use a more specific type if possible
}

const AttendingEvents = () => {
  const [attendingEvents, setAttendingEvents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const loadAttendingEvents = async () => {
      try {
        const savedEvents = await AsyncStorage.getItem('attendingEvents');
        if (savedEvents) {
          setAttendingEvents(JSON.parse(savedEvents));
        }
      } catch (error) {
        console.error('Error loading attending events:', error);
      }
    };

    loadAttendingEvents();
  }, []);

  const handleEventPress = (event: Event) => {
    const eventData = {
      name: event.title,
      date: event.date,
      venue: event.venue,
      imageUrl: event.imageUrl,
      // Add any other fields needed for event-details
    };
    
    router.push({
      pathname: '/events/event-details',
      params: { eventData: JSON.stringify(eventData) }
    });
  };

  const renderEvent = (event: Event, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.eventCard}
      onPress={() => handleEventPress(event)}
    >
      <Image 
        source={{ uri: event.imageUrl }}
        style={styles.eventImage} 
      />
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={3} ellipsizeMode="tail">{event.title}</Text>
        <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
        <View style={styles.eventLocation}>
          <Ionicons name="location-outline" size={10} color="#888" />
          <Text style={styles.eventLocationText} numberOfLines={1} ellipsizeMode="tail">{event.venue}</Text>
        </View>
      </View>
      <Ionicons name="musical-note" size={14} color="#FF69B4" style={styles.musicIcon} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="musical-note" size={12} color="#FF69B4" />
        <Text style={styles.headerText}>Events Attending</Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {attendingEvents.map(renderEvent)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingHorizontal: 25,
    width: '80%',
    alignSelf: 'center',
    height: 310, // Increased from 280 to 320
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff8f0',
    borderRadius: 8,
    height: 90, // Slightly reduced height
  },
  eventImage: {
    width: 70,
    height: 70,
    
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center', // Changed from 'space-between' to 'center'
    height: '100%',
  },
  eventName: {
    fontSize: 11, // Kept original font size
    fontWeight: 'bold',
    lineHeight: 15, // Added line height for better readability
    marginBottom: 2, // Added small margin at the bottom
  },
  eventDate: {
    fontSize: 10,
    color: '#FF69B4',
    marginTop: 2, // Reduced top margin
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2, // Reduced top margin
  },
  eventLocationText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
  musicIcon: {
    marginLeft: 8,
  },
});

export default AttendingEvents;

// END of AttendingCards UI/UX
// END of Maxwell Guillermo Contribution