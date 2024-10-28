import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export async function getUserFavoriteArtists() {
    // Get the currently logged-in user from Firebase Authentication
    const currentUser = auth.currentUser;
    // If no user is logged in, throw an error
    if (!currentUser) throw new Error('User not authenticated');

    // Create a reference to the user's document in Firestore
    // 'db' is the database instance, 'users' is the collection name, and currentUser.uid is the user's unique ID
    const userDocRef = doc(db, 'users', currentUser.uid);
    // Fetch the user's document from Firestore
    const userDoc = await getDoc(userDocRef);

    // If the user document doesn't exist in the database
    if (!userDoc.exists()) {
        console.log('No user document found');
        // Return an empty array since there are no favorite artists
        return [];
    }

    // Get all the data from the user document
    const userData = userDoc.data();
    // Log the user data for debugging purposes
    console.log('User data:', userData);
    
    // Handle different possible formats of favoriteArtists data:
    // 1. If it's already an array, use it as is
    // 2. If it's a JSON string, parse it
    // 3. If it doesn't exist, use an empty array
    const favoriteArtists = Array.isArray(userData.favoriteArtists) 
        ? userData.favoriteArtists 
        : (userData.favoriteArtists ? JSON.parse(userData.favoriteArtists) : []);
    
    // Process the favorite artists array to ensure consistent format
    // Each artist could be either an object with a name property or just a string
    // This converts all formats to just strings of artist names
    return favoriteArtists.map((artist: { name?: string } | string) => 
        // If the artist is an object, get its name property (or empty string if no name)
        // If the artist is already a string, use it as is
        typeof artist === 'object' && artist !== null ? artist.name || '' : artist
    );
}
