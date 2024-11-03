import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TicketMasterAPI, { BASE_URL, TICKETMASTER_API_KEY } from '../../api/ticket-master-api';
import { Linking } from 'react-native';

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

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        if (!eventData?.id) {
          console.log('Missing event ID:', eventData);
          setError('No event ID provided');
          return;
        }

        console.log('Fetching data for event ID:', eventData.id);
        const response = await TicketMasterAPI.getEventById(eventData.id);
        console.log('Raw API Response:', response);

        // Extract price ranges from the response
        let priceRanges = [];
        
        if (response.priceRanges && response.priceRanges.length > 0) {
          priceRanges = response.priceRanges;
        } else if (response._embedded?.events?.[0]?.priceRanges) {
          priceRanges = response._embedded.events[0].priceRanges;
        }

        // Get the URL from the response
        const ticketUrl = response.url || eventData?.url || response._embedded?.events?.[0]?.url;

        if (priceRanges.length > 0) {
          setTicketTypes(priceRanges.map((price: any) => ({
            type: price.type || 'Standard',
            min: price.min || null,
            max: price.max || null,
            currency: price.currency || 'USD',
            url: ticketUrl || ''
          })));
        } else {
          // If no price ranges found, try to get price from eventData
          const defaultPrice = eventData.priceRanges?.[0]?.min || null;
          setTicketTypes([{
            type: 'Standard',
            min: defaultPrice,
            max: defaultPrice,
            currency: 'USD',
            url: ticketUrl || ''
          }]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Detailed error:', error);
        setError('Failed to load ticket information');
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [eventData?.id]);

  const handleBuyTickets = async (ticket: any) => {
    try {
      // Get the URL from the ticket data or event data
      const ticketUrl = ticket.url || eventData?.url || eventData?.outlets?.[1]?.url;
      
      if (!ticketUrl) {
        setError('No ticket purchase link available');
        return;
      }

      const supported = await Linking.canOpenURL(ticketUrl);
      if (supported) {
        await Linking.openURL(ticketUrl);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#37bdd5" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.contentContainer}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Tickets</Text>
                <Text style={styles.eventName}>{eventData?.name}</Text>
                <Text style={styles.priceText}>Ticketmaster: {getTicketPrice()}</Text>
              </View>

              <View style={styles.imageContainer}>
                <Image 
                  source={require('../../assets/images/events/ticket-master-logo.jpg')}
                  style={styles.ticketMasterLogo}
                />
                <TouchableOpacity 
                  style={styles.buyButton}
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
    backgroundColor: '#fff8f0',
  },
  container: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    paddingTop: 0,
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