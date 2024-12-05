import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { writeBatch } from 'firebase/firestore';
import { router } from 'expo-router';

// Define the notification interface
interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type?: string; // For different notification types (e.g. match, like, message)
  data?: any; // Additional data specific to notification type
}

// Define the NotificationPage component
const NotificationPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();
  const db = getFirestore();

  // Fetch notifications from Firestore
  const fetchNotifications = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);
    
    try {
      // Get the notifications collection reference
      const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
      // Create a query to order notifications by timestamp in descending order
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));

      // Listen for changes in the query
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notificationsList: Notification[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notificationsList.push({
            id: doc.id,
            message: data.message,
            timestamp: data.timestamp.toDate(),
            read: data.read, // Whether the notification has been read
            type: data.type, // For different notification types (e.g. match, like, message)
            data: data.data // Additional data specific to notification type
          });
        });
        // Update the notifications state with the fetched notifications
        setNotifications(notificationsList);
        // Mark all notifications as read
        markAllAsRead(notificationsList);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError('Failed to fetch notifications');
      setLoading(false);
      console.error('Error fetching notifications:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (notificationsList: Notification[]) => {
    if (!auth.currentUser) return;
    const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    
    notificationsList.forEach(async (notification) => {
      if (!notification.read) {
        await updateDoc(doc(notificationsRef, notification.id), { read: true });
      }
    });
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          // Clear all notifications
          onPress: async () => {
            if (!auth.currentUser) return;
            try {
              const batch = writeBatch(db);
              // Delete each notification
              notifications.forEach((notification) => {
                const notificationRef = doc(db, 'users', auth.currentUser!.uid, 'notifications', notification.id);
                batch.delete(notificationRef);
              });
              // Commit the batch
              await batch.commit();
            } catch (err) {
              console.error('Error clearing notifications:', err);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initFetch = async () => {
      unsubscribe = await fetchNotifications();
    };
    
    initFetch();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Delete a specific notification
  const deleteNotification = (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            if (auth.currentUser) {
              try {
                // Delete the notification
                await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', id));
              } catch (err) {
                console.error('Error deleting notification:', err);
                Alert.alert('Error', 'Failed to delete notification');
              }
            }
          }
        }
      ]
    );
  };

  // Handle notification press based on type
  const handleNotificationPress = (notification: Notification) => {
    // Handle different notification types
    switch(notification.type) {
      case 'directmessage':
        console.log('Sender Name:', notification.data.senderName);
        router.push({
          pathname: '/directmessage',
          params: { recipientId: notification.data.senderId, recipientName: notification.data.senderName },
        });
        break;
      case 'like':
        if (notification.data && notification.data.senderId) {
          router.push({
            pathname: '/match',
            params: { userId: notification.data.senderId },
          });
        }
        break;
      default:
        // Default handling
        break;
    }
  };

  // Render a single notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <View style={styles.notificationItem}>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTimestamp}>{item.timestamp.toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteNotification(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render a loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <View style={styles.centerContainer}>
          <Text>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render an error message
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchNotifications} style={styles.retryButton}>
            <Text>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render the notifications list
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )
        }} 
      />
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  clearButton: {
    marginRight: 16,
  },
  clearButtonText: {
    color: 'red',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  retryButton: {
    padding: 8,
    backgroundColor: '#37bdd5',
    borderRadius: 8,
  },
});

export default NotificationPage;
