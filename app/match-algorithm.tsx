// match-algorithm.tsx
// Reyna Aguirre
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
    tuneOfMonth: string;
    location: string; //example: "West Donald, RI 33335, USA"
    latitude?: number;  // optional if already geocoded
    longitude?: number; // optional if already geocoded
    favoritePerformance: string;
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
      console.log('Gender compatibility: false (missing data)');
      return false;
    }
    const user1Compatible =
      user1.genderPreference === "both" || user1.genderPreference === user2.gender;
    const user2Compatible =
      user2.genderPreference === "both" || user2.genderPreference === user1.gender;
  
    const result = user1Compatible && user2Compatible;
    console.log(`Gender compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result;
  };

  // 2. age compatibility
  export const isAgeCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.age || !user2?.age || !user1?.agePreference || !user2?.agePreference) {
      console.log('Age compatibility: false (missing data)');
      return false;
    }
    const user1AgeInRange = user2.age >= user1.agePreference.min && user2.age <= user1.agePreference.max;
    const user2AgeInRange = user1.age >= user2.agePreference.min && user1.age <= user2.agePreference.max;
  
    const result = user1AgeInRange && user2AgeInRange;
    console.log(`Age compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result;
  };

  // 3. music compatibility
  export const isMusicCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.musicPreference || !user2?.musicPreference) {
      console.log('Music compatibility: false (missing data)');
      return false;
    }
    const sharedGenres = user1.musicPreference.filter(genre => user2.musicPreference.includes(genre));
    const result = sharedGenres.length > 0;
    console.log(`Music compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result; // true if they share at least one music genre overlaps between users
  };

  // 4. location compatibility
  // function to get latitude and longitude using Nominatim (OpenStreetMap API)
  export const getLatLonFromLocation = async (location: string): Promise<{ latitude: number; longitude: number } | null> => {
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    
    // fetch the data from the API
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.length > 0) {
            const { lat, lon } = data[0];
            return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
        }
        console.log('getLatLonFromLocation: null (No result found)');
        return null;  // No result found
    } catch (error) {
        console.error('Error fetching geolocation:', error);
        return null;
    }
  };
  // haversine formula to calculate distance
  export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
   
    const R = 3958.8; // Radius of Earth in miles
    const toRad = (value: number) => (value * Math.PI) / 180;

    // convert latitude and longitude to radians
    const dlat = toRad(lat2 - lat1);
    const dlon = toRad(lon2 - lon1);
    const a =
        Math.sin(dlat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // distance in miles
  };
  // check if two users are within a 50-mile radius
  export const isLocationSimilar = async (user1: User, user2: User): Promise<boolean> => {
    if (!user1?.location || !user2?.location) {
      console.log('Location similarity: false (missing data)');
      return false;
    }
    let user1LatLon = user1.latitude && user1.longitude ? { latitude: user1.latitude, longitude: user1.longitude } : await getLatLonFromLocation(user1.location);
    let user2LatLon = user2.latitude && user2.longitude ? { latitude: user2.latitude, longitude: user2.longitude } : await getLatLonFromLocation(user2.location);
  
    if (!user1LatLon || !user2LatLon) {
      console.log('Location similarity: false (unable to get coordinates)');
      return false;
    }
  
    const distance = haversineDistance(user1LatLon.latitude, user1LatLon.longitude, user2LatLon.latitude, user2LatLon.longitude);
    const result = distance <= 50;
    console.log(`Location similarity for ${user1.displayName} and ${user2.displayName}: ${result}`);
    return result; // true if distance is less than 50 miles
  };


  // 5. match intention compatibility
  export const isMatchIntentionCompatible = (user1: User, user2: User): boolean => {
    if (!user1?.matchIntention || !user2?.matchIntention) {
      console.log('Match intention compatibility: false (missing data)');
      return false;
    }
    const result = user1.matchIntention === user2.matchIntention;
    console.log(`Match intention compatibility for ${user1.displayName} and ${user2.displayName}: ${result}`);
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
    const result = genderCompatible || ageCompatible || matchIntentionCompatible || musicCompatible || locationSimilar;
    console.log(`Overall match: ${result}`);
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
    const querySnapshot = await getDocs(userQuery);
    const user1 = await getCurrentUserData(currentUser.uid); 

    if (!user1) throw new Error("Current user data not found");

    const potentialMatches = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const user2 = doc.data() as User;
        const isCompatible = await isMatch(user1, user2);
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
  const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
  
  if (userDoc.empty) {
    console.error("Current user not found in Firestore");
    return null;
  }
  
  console.log("Current user data retrieved successfully");
  return userDoc.docs[0].data() as User;
};
