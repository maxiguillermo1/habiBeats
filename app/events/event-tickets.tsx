import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
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
          setError('No event ID provided');
          return;
        }

        const response = await TicketMasterAPI.getEventById(eventData.id);
        console.log('Ticketmaster Response:', JSON.stringify(response));

        const priceData = await TicketMasterAPI.getEventPrices(eventData.id);
        console.log('Price Response:', JSON.stringify(priceData));

        if (priceData && priceData.priceRanges) {
          setTicketTypes([{
            type: 'Standard',
            min: priceData.priceRanges[0].min,
            max: priceData.priceRanges[0].max,
            currency: priceData.priceRanges[0].currency
          }]);
        } else {
          setTicketTypes([{
            type: 'Standard',
            min: null,
            max: null,
            currency: 'USD',
            url: response.url || ''
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
  }, [eventData?.id]);

  const handleBuyTickets = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setError('Cannot open ticket purchase link');
      }
    } catch (err) {
      console.error('Error opening ticket URL:', err);
      setError('Failed to open ticket purchase link');
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Tickets</Text>
          <Text style={styles.eventName}>{eventData?.name}</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#37bdd5" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.ticketContainer}>
              {ticketTypes.map((ticket, index) => (
                <View key={index} style={styles.ticketWrapper}>
                  <View style={styles.ticketOption}>
                    <Text style={styles.ticketType}>{ticket.type}</Text>
                    <Text style={styles.priceRange}>
                      {formatPrice(ticket.min, ticket.currency)} - {formatPrice(ticket.max, ticket.currency)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.buyButton}
                    onPress={() => eventData?.url && handleBuyTickets(eventData.url)}
                  >
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {ticketTypes.length === 0 && !error && (
                <Text style={styles.noTicketsText}>No tickets available at this time</Text>
              )}
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
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  eventName: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  ticketContainer: {
    gap: 20,
  },
  ticketWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  ticketOption: {
    backgroundColor: 'white',
    padding: 15,
    width: 150,
    height: 150,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceRange: {
    fontSize: 20,
    color: '#37bdd5',
    marginVertical: 10,
  },
  buyButton: {
    backgroundColor: '#37bdd5',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '80%',
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  noTicketsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default EventTicketsPage; 