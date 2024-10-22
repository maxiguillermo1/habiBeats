import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const NotificationPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        if (!auth.currentUser) return;

        const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notificationsList: Notification[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                notificationsList.push({
                    id: doc.id,
                    message: data.message,
                    timestamp: data.timestamp.toDate(),
                    read: data.read,
                });
            });
            setNotifications(notificationsList);

            // Mark all notifications as read
            notificationsList.forEach((notification) => {
                if (!notification.read) {
                    updateDoc(doc(notificationsRef, notification.id), { read: true });
                }
            });
        });

        return () => unsubscribe();
    }, []);

    // Delete a notification
    const deleteNotification = (id: string) => {
        Alert.alert(
        "Delete Notification",
        "Are you sure you want to delete this notification?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => {
                if (auth.currentUser) {
                    deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', id));
                }
            }}
        ]
        );
    };

    // Renders notifications
    const renderNotification = ({ item }: { item: Notification }) => (
        <View style={styles.notificationItem}>
        <View style={styles.notificationContent}>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTimestamp}>{item.timestamp.toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteNotification(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <FlatList
            // Displays notifications
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
        />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
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
});

export default NotificationPage;
