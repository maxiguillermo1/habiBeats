import { AppState } from 'react-native';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const initUserStatusService = () => {
  console.log('Initializing user status service');
  
  const updateUserStatus = async (isOnline: boolean) => {
    if (auth.currentUser) {
      console.log('Updating user status to', isOnline);
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          await updateDoc(userDocRef, { isOnline });
        } else {
          await setDoc(userDocRef, { isOnline }, { merge: true });
        }
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  };
  
  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      updateUserStatus(true);
    } else {
      updateUserStatus(false);
    }
  };

  AppState.addEventListener('change', handleAppStateChange);

  // Return a function to remove the listener
  return () => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return subscription.remove();
  };
};

export default initUserStatusService;