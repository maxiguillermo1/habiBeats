// block-list.tsx
// Maxwell Guillermo

// START of Block List UI/UX
// START of Maxwell Guillermo Contribution

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Settings: undefined;
  // ... other routes
};

type BlockListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const BlockList = () => {
  const navigation = useNavigation<BlockListScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'Contacts' | 'Blocked'>('Blocked');

  const handleBackPress = () => {
    navigation.navigate('settings' as never);
  };

  const renderContent = () => {
    if (activeTab === 'Contacts') {
      return (
        <>
          <View style={styles.phoneIcon}>
            <Ionicons name="phone-portrait-outline" size={60} color="#37bdd5" />
          </View>
          <Text style={styles.description}>
            Sync your phone contacts to add people to your Block List.
          </Text>
          <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.manualAdd}>Add contact manually</Text>
          </TouchableOpacity>
        </>
      );
    } else {
      return (
        <>
          <View style={styles.phoneIcon}>
            <Ionicons name="phone-portrait-outline" size={60} color="#37bdd5" />
          </View>
          <Text style={styles.description}>
            You haven't added anyone to your Block List yet.
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add contact manually</Text>
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Block List</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity onPress={() => setActiveTab('Contacts')}>
          <Text style={activeTab === 'Contacts' ? styles.activeTab : styles.inactiveTab}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Blocked')}>
          <Text style={activeTab === 'Blocked' ? styles.activeTab : styles.inactiveTab}>Blocked</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>

      <Text style={styles.footer}>
        Wondering how Block List works? <Text style={styles.learnMore}>Learn more</Text>
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
    marginBottom: 20,
  },
  activeTab: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37bdd5',
    borderBottomWidth: 2,
    borderBottomColor: '#37bdd5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
  },
  inactiveTab: {
    fontSize: 16,
    color: '#888',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  phoneIcon: {
    borderWidth: 2,
    borderColor: '#37bdd5',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  syncButton: {
    backgroundColor: '#37bdd5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 20,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualAdd: {
    color: '#37bdd5',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#37bdd5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
  },
  learnMore: {
    color: '#37bdd5',
  },
});

export default BlockList;

// END of Block List UI/UX
// END of Maxwell Guillermo Contribution