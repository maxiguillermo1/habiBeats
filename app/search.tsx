// search.tsx
// Maxwell Guillermo 

// START of search page UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, Text } from 'react-native';
import TopNavBar from '../components/TopNavBar';
import BottomNavBar from '../components/BottomNavBar';
import { Stack } from 'expo-router';
import { EventData } from '../components/EventCards';
import { Ionicons } from '@expo/vector-icons';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Implement search logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopNavBar />
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={18} color="#000" style={styles.searchIcon} />
        </View>
      </View>
      <Text style={styles.sectionTitle}>Suggestions</Text>
      <View style={styles.content}>
        <EventData />
      </View>
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0', // Updated background color
  
  },
  content: {
    flex: 1,
  },
  searchWrapper: {
    alignItems: 'center',
    marginTop: 20, // Increased top margin
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 20,
    width: '40%',
    height: 23,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 5,
    paddingRight: 25,
  },
  searchIcon: {
    position: 'absolute',
    right: 10,
  },
  sectionTitle: {
    marginLeft: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#79ce54',
    marginBottom: 10,
    marginTop: 13.5,
  },
});

export default Search;

// END of search page UI/UX
// END of Maxwell Guillermo Contribution