import React from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EventInfoContainer = ({ title, date, venue }: { title: string; date: string; venue: string }) => (
  <View style={styles.eventInfoContainer}>
    <View style={styles.titleContainer}>
      <Ionicons name="star-outline" size={18} color="#000" style={styles.starIcon} />
      <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
    </View>
    <Text style={styles.date}>{date}</Text>
    <View style={styles.venueContainer}>
      <Ionicons name="location-outline" size={14} color="#666" />
      <Text style={styles.venue} numberOfLines={2} ellipsizeMode="tail">{venue}</Text>
    </View>
  </View>
);

const TrendingEventCard = () => {
  const trendingEvents = [
    {
      title: "Beabadoobee - This Is How Tomorrow Moves Tour",
      date: "September 15",
      venue: "Greek Theatre", 
      imageUrl: require('../assets/images/events/beabadoobee.png')
    },
    {
      title: "Kaytranada - Timeless Tour",
      date: "October 26",
      venue: "BMO Stadium",
      imageUrl: require('../assets/images/events/kaytranada.png')
    },
    
  
    {
      title: "Charli XCX - Sweat Tour",
      date: "October 16",
      venue: "The Kia Forum",
      imageUrl: require('../assets/images/events/charli.png')
    },
    {
      title: "Camp Flog Gnaw Carnival",
      date: "November 8 - 9",
      venue: "Dodger Stadium",
      imageUrl: require('../assets/images/events/floggnaw.png')
    },
    {
      title: "Kehlani - Blue Water Road Trip",
      date: "October 30",
      venue: "The Kia Forum",
      imageUrl: require('../assets/images/events/kehlani.png')
    },
    {
      title: "Chief Keef - 4NEM Tour",
      date: "November 2",
      venue: "Hollywood Palladium",
      imageUrl: require('../assets/images/events/chief.png')
    },
    {
      title: "Bladee - Drain Gang World Tour",
      date:  "October 11",
      venue: "Shrine Expo Hall",
      imageUrl: require('../assets/images/events/bladee.png')
    },
    {
      title: "Don Toliver - Life of a Don Tour",
      date: "October 19",
      venue: "Crypto.com Area",
      imageUrl: require('../assets/images/events/dontoliver.png')
    },
   
   
  ];

  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Trending Events</Text>
      {trendingEvents.map((event, index) => (
        <View key={index} style={styles.eventContainer}>
          <EventInfoContainer title={event.title} date={event.date} venue={event.venue} />
          <Image source={event.imageUrl} style={styles.image} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#79ce54',
    marginBottom: 0,
    marginLeft: 85,
    marginTop: 20,
 
  },
  eventContainer: {
    marginTop: 0,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    borderRadius: 10,
    padding: 15,
  },
  eventInfoContainer: {
    width: '100%',
    marginBottom: 10,
    // Remove or adjust marginLeft if it's causing the text to be cut off
    marginLeft: 150,
    paddingRight: '40%',
  },
  starIcon: {
    marginRight: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap', // Allow content to wrap
    width: '100%',    // Ensure it takes up the full width available
    marginRight: 100,  // Add some margin on the right side to create space between text and image
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    lineHeight: 16,
    flexWrap: 'wrap', // Allow text to wrap
  },

  date: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fba904',
    marginTop: 5,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    flexWrap: 'wrap', // Allow content to wrap
  },
  venue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 5,
    flex: 1,
    flexWrap: 'wrap', // Allow text to wrap
  },
  image: {
    width: 215,
    height: 215,
    resizeMode: 'cover',
  },
});

export default TrendingEventCard;