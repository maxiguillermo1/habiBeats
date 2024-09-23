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
    musicPreference: string[];
    location: string; //example: "West Donald, RI 33335, USA"
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

  // 3. music compatibility

  // 4. location compatibility
  export const isLocationSimilar = (user1: User, user2: User): boolean => {
    const locationDistance = Math.abs(user1.latitude - user2.latitude) + Math.abs(user1.longitude - user2.longitude);
    return locationDistance <= 10; // 10 mile radius
  };

  // 5. match intention compatibility
  export const isMatchIntentionCompatible = (user1: User, user2: User): boolean => {
    return user1.matchIntention === user2.matchIntention;
};

// final: compatibility (0 = not compatible, 1 = compatible)
export const isMatch = (user1: User, user2: User): boolean => {
    const genderCompatible = isGenderCompatible(user1, user2);
    const matchIntentionCompatible = isMatchIntentionCompatible(user1, user2);
    const locationSimilar = isLocationSimilar(user1, user2);
  
    // Only return true if both gender and match intention are compatible
    return genderCompatible && matchIntentionCompatible;
  };

  