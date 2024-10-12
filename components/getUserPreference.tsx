// getUserPreference.tsx
// Maxwell Guillermo 

// START of getUserPreferences Function
// START of Maxwell Guillermo Contribution



// Return music genre, favorite song, favorite artist, favorite album, music preference list, and location
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import { encode } from 'base-64';

const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const TICKETMASTER_API_KEY = 'NmyRpAYBV0T5oqLqGf4kghGLiFLB2NB0';

async function getSpotifyAccessToken() {
  try {
    const authString = encode(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

async function getSimilarArtistsAndGenres(accessToken: string, artistIds: string[]) {
  const similarArtists = new Set<string>();
  const similarGenres = new Set<string>();

  for (const artistId of artistIds) {
    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/artists/${artistId}/related-artists`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      response.data.artists.forEach((artist: { name: string; genres: string[] }) => {
        similarArtists.add(artist.name);
        artist.genres.forEach((genre: string) => similarGenres.add(genre));
      });
    } catch (error) {
      console.error(`Error fetching similar artists for ${artistId}:`, error);
    }
  }

  return { similarArtists: Array.from(similarArtists), similarGenres: Array.from(similarGenres) };
}

async function searchTicketmasterEvents(artists: string[], genres: string[], location: string) {
  const artistQuery = artists.join(' OR ');
  const genreQuery = genres.join(' OR ');
  const query = `${artistQuery} ${genreQuery}`;

  try {
    const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        keyword: query,
        classificationName: 'music',
        city: location,
        size: 20
      }
    });

    return response.data._embedded?.events || [];
  } catch (error) {
    console.error('Error searching Ticketmaster events:', error);
    return [];
  }
}

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
    const userPreferences = {
        musicPreference: userData.musicPreference || [],
        favoriteGenre: userData.favoriteGenre,
        favoriteArtists: userData.favoriteArtists ? JSON.parse(userData.favoriteArtists) : [],
        favoriteAlbum: userData.favoriteAlbum,
        location: userData.location,
        tuneOfMonth: userData.tuneOfMonth,
    };

    try {
        const spotifyAccessToken = await getSpotifyAccessToken();
        const artistIds = userPreferences.favoriteArtists.map((artist: { id: string }) => artist.id);
        const { similarArtists, similarGenres } = await getSimilarArtistsAndGenres(spotifyAccessToken, artistIds);

        const allGenres = [...new Set([...userPreferences.musicPreference, ...similarGenres])];
        const allArtists = [...new Set([...userPreferences.favoriteArtists.map((artist: { name: string }) => artist.name), ...similarArtists])];

        const suggestedEvents = await searchTicketmasterEvents(allArtists, allGenres, userPreferences.location);

        return {
            ...userPreferences,
            similarArtists,
            similarGenres,
            suggestedEvents
        };
    } catch (error) {
        console.error('Error in getUserPreferences:', error);
        return userPreferences;
    }
}
// END of getUserPreferences Function
// END of Maxwell Guillermo Contribution
