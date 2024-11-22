// useAuth.ts
// Jesus Donate

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Adjust the import path as needed

// START of Retriving User Data from subscripted (logged in) user
// START of Jesus Donate Contribution
interface UserData {
  // hashmap of the user document
  firstName: string;
  lastName: string;
  displayName: string;
  age: number;
  agePreference: {
    min: number;
    max: number;
  };
  gender: string,
  genderPreference: string,
  pronouns: string[],
  email: string;
  location: string;
  matchIntention: string;
  musicPreference: string[];
  pronounsVisible: boolean;
  profileImageUrl: string;
  tuneOfMonth: string;
  favoritePerformance: string;
  listenTo: string;
  favoriteArtists: string;
  favoriteMusicArtists: string;
  favoriteAlbum: string;
  artistToSee: string;
  displayLocation: string;
  lastNameVisible: boolean;
  locationVisible: boolean;
  myEventsVisible: boolean;
  hiddenWords: string[];
  isOnline: boolean;

   // Reyna Aguirre:HashMap to store user matches with their status (liked or disliked)
   matches: {
    [key: string]: "liked" | "disliked";  // key: matched user's UID, value: status
  };
}


export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) { // if the user is logged in
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            
            const data = docSnapshot.data() as UserData;
            
            // Check if matches field exists
            if (!data.matches) {
              await updateDoc(userDocRef, {
                matches: {}  // Initialize empty matches map if not present
              });
              data.matches = {};
            }
            
            setUserData(data);
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