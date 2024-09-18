import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * EventCard Component
 * Displays an event card with an image, date, and venue.
 */
const EventCard: React.FC<{ image: any; date: string; venue: string }> = ({ image, date, venue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.image} />
        </View>
      </View>
      <Text style={styles.date}>{date}</Text>
      <View style={styles.venueContainer}>
        <Ionicons name="location-outline" size={10} color="#000000" />
        <Text style={styles.venue}>{venue}</Text>
      </View>
    </View>
  );
};

interface Event {
  image: any;
  date: string;
  venue: string;
  title: string;
}
const hardcodedEvents: Event[] = [
  { image: require('../assets/images/events/beabadoobee.png'), date: 'September 15', venue: 'Greek Theatre', title: "Beabadoobee - This Is How Tomorrow Moves Tour" },
  { image: require('../assets/images/events/bladee.png'), date: 'October 11', venue: 'Shrine Expo Hall', title: "Bladee - Drain Gang World Tour" },
  { image: require('../assets/images/events/charli.png'), date: 'October 16', venue: 'The Kia Forum', title: "Charli XCX - Sweat Tour" },
  { image: require('../assets/images/events/floggnaw.png'), date: 'November 8 - 9', venue: 'Dodger Stadium', title: "Camp Flog Gnaw Carnival" },
  { image: require('../assets/images/events/chief.png'), date: 'November 2', venue: 'Hollywood Palladium', title: "Chief Keef - 4NEM Tour" },
  { image: require('../assets/images/events/kaytranada.png'), date: 'October 26', venue: 'BMO Stadium', title: "Kaytranada - Timeless Tour" },
  { image: require('../assets/images/events/dontoliver.png'), date: 'October 19', venue: 'Crypto.com Area', title: "Don Toliver - Life of a Don Tour" },
  { image: require('../assets/images/events/kehlani.png'), date: 'October 30', venue: 'The Kia Forum', title: "Kehlani - Blue Water Road Trip" },
];

export const EventData = () => {
  const [eventData] = useState<Event[]>(hardcodedEvents);

  return (
    <ScrollView style={styles.suggestionsContainer} contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.sectionTitle}>Suggestions</Text>
      <View style={styles.grid}>
        {eventData.map((event, index) => (
          <EventCard
            key={index}
            image={event.image}
            date={event.date}
            venue={event.venue}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '35%',
    marginBottom: 15,
    marginHorizontal: 20,
    marginLeft: 15,
  },
  card: {
    backgroundColor: '#fff8f0',
    borderRadius: 0,
    overflow: 'hidden',
    aspectRatio: 1,
    padding: 12, // Increased padding to make the border bigger
  },
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  date: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fc6c85',
    marginTop: 8,
    textAlign: 'center',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  venue: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 3,
  },
  suggestionsContainer: {
    flex: 1,
    marginLeft: 15,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  scrollViewContent: {
    paddingBottom: 100, // Add extra padding at the bottom to allow scrolling past the last item
  },
  sectionTitle: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#79ce54',
    marginBottom: 25,
    marginTop: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default EventCard;
