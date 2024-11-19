import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TicketMasterAPI, { BASE_URL, TICKETMASTER_API_KEY } from '../../api/ticket-master-api';
import { Linking } from 'react-native';
import { auth, db } from '../../firebaseConfig'; // Assuming you have a firebaseConfig file
import { doc, getDoc } from 'firebase/firestore';

interface PriceRange {
  type: string;
  min: number | null;
  max: number | null;
  currency: string;
  url?: string;
}

const EventTicketsPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const eventData = params.eventData ? JSON.parse(params.eventData as string) : null;
  const [ticketTypes, setTicketTypes] = useState<PriceRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsDarkMode(userData.themePreference === 'dark'); // Set dark mode based on themePreference
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };

    fetchThemePreference();
  }, []);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        if (!eventData?.name) {
          setError('Event information is missing');
          setLoading(false);
          return;
        }

        // Search for the event using name and venue
        const searchResponse = await TicketMasterAPI.searchEvents({
          keyword: eventData.name,
          size: 10,
          sort: 'relevance,desc'
        });

        console.log('Search response:', searchResponse);

        if (!searchResponse._embedded?.events) {
          setError('No ticket information available');
          setLoading(false);
          return;
        }

        // Find the best matching event
        const matchedEvent = searchResponse._embedded.events.find((event: any) => 
          event.name.toLowerCase().includes(eventData.name.toLowerCase()) &&
          event._embedded?.venues?.some((venue: any) => 
            venue.name.toLowerCase().includes(eventData.venue.toLowerCase())
          )
        );

        if (!matchedEvent) {
          setError('Event not found on Ticketmaster');
          setLoading(false);
          return;
        }

        // Extract price ranges and ticket URL
        const priceRanges = matchedEvent.priceRanges || [];
        const ticketUrl = matchedEvent.url;

        if (priceRanges.length > 0) {
          setTicketTypes(priceRanges.map((price: { type?: string; min?: number; max?: number; currency?: string }) => ({
            type: price.type || 'Standard',
            min: price.min || null,
            max: price.max || null,
            currency: price.currency || 'USD',
            url: ticketUrl
          })));
        } else {
          // Set default ticket type with just the URL if no price ranges available
          setTicketTypes([{
            type: 'Standard',
            min: null,
            max: null,
            currency: 'USD',
            url: ticketUrl
          }]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        setError('Failed to load ticket information');
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [eventData]);

  const handleBuyTickets = async (ticket: PriceRange) => {
    try {
      if (!ticket.url) {
        setError('No ticket purchase link available');
        return;
      }

      const supported = await Linking.canOpenURL(ticket.url);
      if (supported) {
        await Linking.openURL(ticket.url);
      } else {
        setError('Cannot open ticket purchase link');
      }
    } catch (err) {
      console.error('Error opening ticket URL:', err);
      setError('Failed to open ticket purchase link');
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'See Prices on Ticketmaster';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  const getTicketPrice = () => {
    if (ticketTypes.length > 0) {
      const lowestPrice = ticketTypes[0].min;
      if (lowestPrice === null) {
        return 'See Prices on Ticketmaster';
      }
      return formatPrice(lowestPrice, ticketTypes[0].currency);
    }
    return 'See Prices on Ticketmaster';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : '#fff8f0' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#ffffff' : '#007AFF'} />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={isDarkMode ? '#79ce54' : '#37bdd5'} style={styles.loader} />
          ) : error ? (
            <Text style={[styles.errorText, { color: isDarkMode ? '#ff4d4d' : 'red' }]}>{error}</Text>
          ) : (
            <View style={styles.contentContainer}>
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Tickets</Text>
                <Text style={[styles.eventName, { color: isDarkMode ? '#cccccc' : '#666' }]}>{eventData?.name}</Text>
                <Text style={[styles.priceText, { color: isDarkMode ? '#79ce54' : '#37bdd5' }]}>Ticketmaster: {getTicketPrice()}</Text>
              </View>

              <View style={styles.imageContainer}>
                <Image 
                  source={require('../../assets/images/events/ticket-master-logo.jpg')}
                  style={styles.ticketMasterLogo}
                />
                <TouchableOpacity 
                  style={[styles.buyButton, { backgroundColor: isDarkMode ? '#79ce54' : '#37bdd5' }]}
                  onPress={() => handleBuyTickets(ticketTypes[0])}
                >
                  <Text style={styles.buyButtonText}>Buy Tickets</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff8f0', // Default light mode color
  },
  container: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    paddingTop: 0,
    backgroundColor: '#fff8f0', // Default light mode color
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginTop: -50,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
    position: 'absolute',
    top: 10,
    left: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  eventName: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
    fontWeight: '700',
  },
  priceText: {
    fontSize: 15,
    color: '#37bdd5',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  imageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  ticketMasterLogo: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  buyButton: {
    backgroundColor: '#37bdd5',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '60%',
    marginTop: 10,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: '400',
    fontSize: 14,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default EventTicketsPage; 