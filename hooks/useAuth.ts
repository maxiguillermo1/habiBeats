import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Adjust the import path as needed

// START of Retriving User Data from subscripted (logged in) user
// START of Jesus Donate Contribution
interface UserData {
  // hashmap of the user document
  firstName: string;
  lastName: string;
  age: number;
  gender: string,
  email: string;
  location: string;
  profileImageUrl: string;
  tuneOfMonth: string;
  favoritePerformance: string;
  listenTo: string;
  favoriteMusicArtists: string;
  favoriteAlbum: string;
  artistToSee: string;
}


export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) { // if the user is logged in
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            
            setUserData(docSnapshot.data() as UserData);
          } else {
            console.log("docSnapshot does not exist");
            setUserData(null);
          }
        });

        return () => unsubscribeDoc();
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, userData };
}

// END of Retriving User Data from Firebase
// END of Jesus Donate Contribution