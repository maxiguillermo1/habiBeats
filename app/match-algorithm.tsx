// match-algorithm.tsx
// Reyna Aguirre

// user data
export interface User {
    uid: number;
    displayName: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    genderPreference: string;
    matchIntention: string;
    agePreference: { min: number, max: number };
    musicPreference: string[];
    location: string; //example: "West Donald, RI 33335, USA"
    latitude?: number;  // optional if already geocoded
  longitude?: number; // optional if already geocoded
  }


  // rule based algorithm
  // 1. gender compatibility
  export const isGenderCompatible = (user1: User, user2: User): boolean => {
    const user1Compatible =
      user1.genderPreference === "both" || user1.genderPreference === user2.gender;
    const user2Compatible =
      user2.genderPreference === "both" || user2.genderPreference === user1.gender;
  
    return user1Compatible && user2Compatible;
  };

  // 2. age compatibility
  export const isAgeCompatible = (user1: User, user2: User): boolean => {
    const user1AgeInRange = user2.age >= user1.agePreference.min && user2.age <= user1.agePreference.max;
    const user2AgeInRange = user1.age >= user2.agePreference.min && user1.age <= user2.agePreference.max;
  
    return user1AgeInRange && user2AgeInRange;
  };

  // 3. music compatibility
  export const isMusicCompatible = (user1: User, user2: User): boolean => {
    const sharedGenres = user1.musicPreference.filter(genre => user2.musicPreference.includes(genre));
    return sharedGenres.length > 0; // true if they share at least one music genre overlaps between users
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
    let user1LatLon = user1.latitude && user1.longitude ? { latitude: user1.latitude, longitude: user1.longitude } : await getLatLonFromLocation(user1.location);
    let user2LatLon = user2.latitude && user2.longitude ? { latitude: user2.latitude, longitude: user2.longitude } : await getLatLonFromLocation(user2.location);
  
    if (user1LatLon && user2LatLon) {
      const distance = haversineDistance(user1LatLon.latitude, user1LatLon.longitude, user2LatLon.latitude, user2LatLon.longitude);
      return distance <= 50; // true if distance is less than 50 miles
    }
  
    return false;  // Return false if we couldn't get coordinates
  };
  // 5. match intention compatibility
  export const isMatchIntentionCompatible = (user1: User, user2: User): boolean => {
    return user1.matchIntention === user2.matchIntention;
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
    return genderCompatible && ageCompatible && matchIntentionCompatible && musicCompatible && locationSimilar;
  };

  