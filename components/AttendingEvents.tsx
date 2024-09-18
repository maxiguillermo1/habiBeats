import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Event {
  title: string;
  date: string;
  venue: string;
  imageUrl: any; // Use a more specific type if possible
}

const attendingEvents = [
  {
    title: "Beabadoobee - This Is How Tomorrow Moves Tour",
    date: "September 15",
    venue: "Greek Theatre", // Fixed typo: "Greak" to "Greek"
    imageUrl: require('../assets/images/events/beabadoobee.png')
  },
  {
    title: "Bladee - Drain Gang World Tour",
    date:  "October 1",
    venue: "Shrine Expo Hall",
    imageUrl: require('../assets/images/events/bladee.png')
  },
  {
    title: "Charli XCX - Sweat Tour",
    date: "October 16",
    venue: "The Kia Forum",
    imageUrl: require('../assets/images/events/charli.png')
  },
];

const AttendingEvents = () => {
  const renderEvent = (event: Event, index: number) => (
    <View key={index} style={styles.eventCard}>
      <Image source={event.imageUrl} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={3} ellipsizeMode="tail">{event.title}</Text>
        <Text style={styles.eventDate}>{event.date}</Text>
        <View style={styles.eventLocation}>
          <Ionicons name="location-outline" size={10} color="#888" />
          <Text style={styles.eventLocationText} numberOfLines={1} ellipsizeMode="tail">{event.venue}</Text>
        </View>
      </View>
      <Ionicons name="musical-note" size={14} color="#FF69B4" style={styles.musicIcon} />
    </View>
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
    height: 280, // Increased height to fully show 3 events
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
