import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { getGooglePlacesAPIRequest } from '../../api/google-places-api';

const EventLocationPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { venue, location, eventName } = params;
  
  const [coordinates, setCoordinates] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [locationDetails, setLocationDetails] = useState({
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const searchQuery = Array.isArray(venue) ? venue[0] : venue || '';
        
        if (!searchQuery) {
          console.error('No venue provided');
          return;
        }
        
        console.log('Searching for venue:', searchQuery);
        const response = await getGooglePlacesAPIRequest(searchQuery);
        
        if (response.results && response.results.length > 0) {
          const place = response.results[0];
          console.log('Found venue:', place.formatted_address);
          
          const newCoordinates = {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setCoordinates(newCoordinates);
          
          const addressComponents = place.address_components || [];
          let city = '';
          let state = '';
          
          for (const component of addressComponents) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
          }
          
          setLocationDetails({
            address: place.formatted_address,
            city: city || '',
            state: state || '',
          });
        } else {
          console.error('No results found for venue');
        }
      } catch (error) {
        console.error('Error fetching venue location:', error);
      }
    };

    if (venue) {
      fetchLocation();
    }
  }, [venue]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>Event Location</Text>
        {eventName && <Text style={styles.eventName}>{eventName}</Text>}
        
        <View style={styles.venueDetails}>
          {venue && <Text style={styles.venueText}>{venue}</Text>}
          {locationDetails.address && (
            <Text style={styles.locationText}>{locationDetails.address}</Text>
          )}
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={coordinates}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            zoomEnabled={true}
            minZoomLevel={10}
            maxZoomLevel={20}
            zoomControlEnabled={true}
          >
            <Marker
              coordinate={{
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
              }}
              title={Array.isArray(venue) ? venue[0] : venue || 'Event Location'}
              description={Array.isArray(eventName) ? eventName[0] : eventName || ''}
              pinColor="#fba904"
            />
          </MapView>
        </View>
      </View>
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
    backgroundColor: '#fff8f0',
    borderRadius: 10,
    margin: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 21.5,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  locationDetails: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  venueDetails: {
    marginBottom: 20,
    alignItems: 'center',
  },
  venueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fba904',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default EventLocationPage; 