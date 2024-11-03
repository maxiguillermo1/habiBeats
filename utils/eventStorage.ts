import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveAttendingEvent = async (eventData: any) => {
  try {
    const existingEvents = await AsyncStorage.getItem('attendingEvents');
    let events = existingEvents ? JSON.parse(existingEvents) : [];
    events = [...events, eventData];
    await AsyncStorage.setItem('attendingEvents', JSON.stringify(events));
  } catch (error) {
    console.error('Error saving attending event:', error);
  }
};

export const saveFavoriteEvent = async (eventData: any) => {
  try {
    const existingEvents = await AsyncStorage.getItem('favoriteEvents');
    let events = existingEvents ? JSON.parse(existingEvents) : [];
    events = [...events, eventData];
    await AsyncStorage.setItem('favoriteEvents', JSON.stringify(events));
  } catch (error) {
    console.error('Error saving favorite event:', error);
  }
}; 