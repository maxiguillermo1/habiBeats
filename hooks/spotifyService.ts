import axios from 'axios';
import { encode } from 'base-64';

const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';

let accessToken = '';

const getSpotifyAccessToken = async () => {
  if (accessToken) return accessToken;

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
  accessToken = response.data.access_token;
  return accessToken;
};

export const searchSpotifyArtists = async (query: string) => {
  const token = await getSpotifyAccessToken();
  const response = await axios.get(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data.artists.items;
};

export const fetchUserData = async () => {
  try {
    const response = await fetch('YOUR_API_ENDPOINT');
    
    // Add this check
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Add this logging
    const text = await response.text();
    console.log('Raw response:', text);
    
    // Try parsing the text
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
