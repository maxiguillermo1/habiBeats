// FavoriteEvents.tsx
// Maxwell Guillermo 

// START of FavoriteEvents UI/UX
// START of Maxwell Guillermo Contribution

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Event {
  title: string;
  date: string;
  venue: string;
  imageUrl: any; // Use a more specific type if possible
}

const favoriteEvents = [
    {
        title: "Camp Flog Gnaw Carnival",
        date: "November 8 - 9",
        venue: "Dodger Stadium - Los Angeles",
        imageUrl: require('../assets/images/events/floggnaw.png')
      },
      {
        title: "Chief Keef - 4NEM Tour",
        date: "November 2",
        venue: "Hollywood Palladium",
        imageUrl: require('../assets/images/events/chief.png')
      },
      {
        title: "Kaytranada - Timeless Tour",
        date: "October 26",
        venue: "BMO Stadium",
        imageUrl: require('../assets/images/events/kaytranada.png')
      },
      {
        title: "Don Toliver - Life of a Don Tour",
        date: "October 19",
        venue: "Crypto.com Area",
        imageUrl: require('../assets/images/events/dontoliver.png')
      },
      {
        title: "Kehlani - Blue Water Road Trip",
        date: "October 30",
        venue: "The Kia Forum",
        imageUrl: require('../assets/images/events/kehlani.png')
      },
];

const FavoriteEvents = () => {
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
      <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star" size={12} color="#FFD700" />
        <Text style={styles.headerText}>Favorites</Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {favoriteEvents.map(renderEvent)}
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
    height: 280,
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
    height: 90,
  },
  eventImage: {
    width: 70,
    height: 70,
    
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    height: '100%',
  },
  eventName: {
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 15,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 10,
    color: '#FF69B4',
    marginTop: 2,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  eventLocationText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
  starIcon: {
    marginLeft: 8,
  },
});

export default FavoriteEvents;

// END of FavoriteEvents UI/UX
// END of Maxwell Guillermo Contribution