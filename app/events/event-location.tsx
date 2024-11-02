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
    city: '',
    state: '',
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const searchQuery = `${venue}, ${location}`;
        console.log('Searching for:', searchQuery);
        const response = await getGooglePlacesAPIRequest(searchQuery);
        
        if (response.results && response.results.length > 0) {
          const place = response.results[0];
          console.log('Found venue location:', place.formatted_address);
          
          const newCoordinates = {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setCoordinates(newCoordinates);
          
          const formattedAddress = place.formatted_address;
          const addressParts = formattedAddress.split(',').map((part: string) => part.trim());
          
          let city = '';
          let state = '';
          
          if (addressParts.length >= 3) {
            city = addressParts[addressParts.length - 3];
            const stateZip = addressParts[addressParts.length - 2].split(' ');
            state = stateZip[0];
          }
          
          console.log('Extracted location:', { city, state });
          
          setLocationDetails({
            city,
            state,
          });
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    if (venue || location) {
      fetchLocation();
    }
  }, [venue, location]);

  useEffect(() => {
    console.log('Current locationDetails:', locationDetails);
  }, [locationDetails]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>Event Location</Text>
        <Text style={styles.eventName}>{eventName}</Text>
        <Text style={styles.locationDetails}>
          {locationDetails.city && locationDetails.state 
            ? `${locationDetails.city}, ${locationDetails.state}`
            : location}
        </Text>
        
        <View style={styles.venueDetails}>
          <Text style={styles.venueText}>{venue}</Text>
          <Text style={styles.locationText}>
            {locationDetails.city && locationDetails.state 
              ? `${locationDetails.city}, ${locationDetails.state}`
              : location}
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={coordinates}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsTraffic={true}
          >
            <Marker
              coordinate={{
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
              }}
              title={venue as string}
              description={`${locationDetails.city}, ${locationDetails.state}`}
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