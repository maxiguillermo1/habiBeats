// getUserPreference.tsx
// Maxwell Guillermo 

// START of getUserPreferences Function
// START of Maxwell Guillermo Contribution



// Return music genre, favorite song, favorite artist, favorite album, music preference list, and location
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';


// Get the user's preferences
// Returns an object with the user's preferences
export default async function getUserPreferences() {
    const currentUser = auth.currentUser;
    // Check if the user is authenticated
    if (!currentUser) throw new Error('User not authenticated');

    // Get the user's document from the database
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    // Check if the user document exists
    if (!userDoc.exists()) return;

    // Get the user's data
    const userData = userDoc.data();
    return {
        musicPreference: userData.musicPreference,
        favoriteGenre: userData.favoriteGenre,
        favoriteArtists: userData.favoriteArtists,
        favoriteAlbum: userData.favoriteAlbum,
        location: userData.location,
        tuneOfMonth: userData.tuneOfMonth,
    };
}
// END of getUserPreferences Function
// END of Maxwell Guillermo Contribution