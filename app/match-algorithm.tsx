// match-algorithm.tsx
// Reyna Aguirre
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as Location from 'expo-location';

// user data
export interface User {
    uid: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    age: number;
    gender: string;
    genderPreference: string;
    matchIntention: string;
    agePreference: { min: number, max: number } | undefined; // Make agePreference optional
    musicPreference: string[];
    tuneOfMonth?: string; // JSON string containing song details
    location: string; //example: "West Donald, RI 33335, USA"
    latitude?: number;  // optional if already geocoded
    longitude?: number; // optional if already geocoded
    favoritePerformance: string;
    matches?: {
      [uid: string]: "liked" | "disliked";
    };
    favoriteAlbum?: string; // JSON string containing album details
    favoriteArtists?: Array<{
      id: string;
      name: string;
      picture: string;
    }> | string;
    prompts?: string[]; // Add this line to include the prompts property
  }
  // function structure for compatibility
  // 1. gender compatibility
  // 2. age compatibility
  // 3. music compatibility
  // 4. location compatibility
  // 5. match intention compatibility
  // 6. final compatibility

  // first check if either user doesn't have the required data for compatibility (null value)
  // if so, return false
  // if not, check user1 and user2 preference for that category
  
  // rule based algorithm
  // 1. gender compatibility
  export const isGenderCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.gender || !user2?.gender || !user1?.genderPreference || !user2?.genderPreference) {
      // console.log('Gender compatibility: false (missing data)');
      return false;
    }
    const user1Compatible =
      user1.genderPreference === "both" || user1.genderPreference === user2.gender;
    const user2Compatible =
      user2.genderPreference === "both" || user2.genderPreference === user1.gender;
  
    const result = user1Compatible && user2Compatible;
    // console.log(`Gender compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result;
  };

  // 2. age compatibility
  export const isAgeCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.age || !user2?.age || !user1?.agePreference || !user2?.agePreference) {
      // console.log('Age compatibility: false (missing data)');
      return false;
    }
    const user1AgeInRange = user2.age >= user1.agePreference.min && user2.age <= user1.agePreference.max;
    const user2AgeInRange = user1.age >= user2.agePreference.min && user1.age <= user2.agePreference.max;
  
    const result = user1AgeInRange && user2AgeInRange;
    // console.log(`Age compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result;
  };

  // 3. music compatibility
  export const isMusicCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.musicPreference || !user2?.musicPreference) {
      // console.log('Music compatibility: false (missing data)');
      return false;
    }
    const sharedGenres = user1.musicPreference.filter(genre => user2.musicPreference.includes(genre));
    const result = sharedGenres.length > 0;
    // console.log(`Music compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result; // true if they share at least one music genre overlaps between users
  };

  // 4. location compatibility
  // function to get latitude and longitude using Nominatim (OpenStreetMap API)
  // Function to get latitude and longitude using device GPS (expo-location)
  export const getLatLonFromLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // console.log('Permission to access location was denied');
        return null;
      }

      // Get the current device location
      const deviceLocation = await Location.getCurrentPositionAsync({});
      // console.log('Device GPS result:', deviceLocation.coords);
      return {
        latitude: deviceLocation.coords.latitude,
        longitude: deviceLocation.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  // Location compatibility function using Haversine formula
  export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Radius of Earth in miles
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dlat = toRad(lat2 - lat1);
    const dlon = toRad(lon2 - lon1);
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in miles
  };

// Check if two users are within a 50-mile radius
  export const isLocationSimilar = async (user1: User, user2: User): Promise<boolean> => {
    if (!user1?.location || !user2?.location) {
      return false;
    }

    // Get coordinates for user1 and user2 if not already available
    let user1LatLon = user1.latitude && user1.longitude
      ? { latitude: user1.latitude, longitude: user1.longitude }
      : await getLatLonFromLocation();
    let user2LatLon = user2.latitude && user2.longitude
      ? { latitude: user2.latitude, longitude: user2.longitude }
      : await getLatLonFromLocation();

    if (!user1LatLon || !user2LatLon) {
      return false;
    }

    // Calculate distance
    const distance = haversineDistance(user1LatLon.latitude, user1LatLon.longitude, user2LatLon.latitude, user2LatLon.longitude);
    const result = distance <= 50;
    return result; // true if distance is less than 50 miles
  };


  // 5. match intention compatibility
  export const isMatchIntentionCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.matchIntention || !user2?.matchIntention) {
      //console.log('Match intention compatibility: false (missing data)');
      return false;
    }
    const result = user1.matchIntention === user2.matchIntention;
    // console.log(`Match intention compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result;
};

// final: compatibility (0 = not compatible, 1 = compatible)
export const isMatch = async (user1: User, user2: User): Promise<boolean> => {
    const [genderCompatible, ageCompatible, matchIntentionCompatible, musicCompatible, locationSimilar] = await Promise.all([
        isGenderCompatible(user1, user2),
        isAgeCompatible(user1, user2),
        isMatchIntentionCompatible(user1, user2),
        isMusicCompatible(user1, user2),
        isLocationSimilar(user1, user2)
    ]);
  
    // Only return true if both gender and match intention are compatible
    // const result = genderCompatible && ageCompatible && matchIntentionCompatible && musicCompatible && locationSimilar;
    const result = genderCompatible || matchIntentionCompatible || locationSimilar;
    // console.log(`Overall match: ${result}`);
    return result; // changed to OR to allow for more matches FIXME
  };



// fetch users from firestore and filtering them based on matching criteria above
export const fetchCompatibleUsers = async (): Promise<User[]> => {
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No authenticated user found");

  // query to get users from firestore aside from current user
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("uid", "!=", currentUser.uid)); 

  try {
    const user1 = await getCurrentUserData(currentUser.uid);
    if (!user1) throw new Error("Current user data not found");

    // get list of already interacted UIDs 
    const interactedUIDs = new Set(
      Object.keys(user1.matches ?? {}).filter((uid) =>
        user1.matches?.[uid] && ["liked", "disliked"].includes(user1.matches[uid]!)
      )
    );

    // query users that are not in the interactedUIDs set
    const querySnapshot = await getDocs(userQuery);
    console.log("STARTING MATCHING QUERY")
    console.log("Fetched users:", querySnapshot.docs.map((doc) => doc.data().displayName));
    /*console.log("Already interacted users:", Array.from(interactedUIDs).map(uid => {
      const user = querySnapshot.docs.find(doc => doc.id === uid);
      return user ? user.data().displayName : uid;
    })); */

    const potentialMatches = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const user2 = doc.data() as User;

        // skip users that are already interacted
        if (interactedUIDs.has(user2.uid)) { 
          console.log(`User ${user2.displayName} skipped (already interacted)`);
          return null; 
        }
        
        const isCompatible = await isMatch(user1, user2);
        console.log(`Compatibility result for ${user1.displayName} and ${user2.displayName}: ${isCompatible}`);
        return isCompatible ? user2 : null;
      })
    );

    const compatibleUsers = potentialMatches.filter((user): user is User => user !== null);
    console.log(`Number of compatible users found: ${compatibleUsers.length}`);
    return compatibleUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Implement getCurrentUserData function
const getCurrentUserData = async (uid: string): Promise<User | null> => {
  const db = getFirestore();
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    console.error("Current user not found in Firestore");
    return null;
  }

  console.log("Current user data retrieved successfully");
  return userDocSnap.data() as User;
};


