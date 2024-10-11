import axios, { AxiosError } from 'axios';
import { encode } from 'base-64';

const CLIENT_ID = 'f947f2727da74807960190670ee93b6d';
const CLIENT_SECRET = '3eab1b4a8c684c50b6cee76aa226ac5b';

let accessToken = '';
let tokenExpirationTime = 0;

const getSpotifyAccessToken = async () => {
  const currentTime = Date.now();
  if (accessToken && tokenExpirationTime > currentTime) {
    return accessToken;
  }

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
    accessToken = response.data.access_token;
    tokenExpirationTime = currentTime + (response.data.expires_in * 1000);
    console.log('New access token obtained:', accessToken);
    return accessToken;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error getting Spotify access token:', error.response?.data || error.message);
    } else {
      console.error('Error getting Spotify access token:', error);
    }
    throw error;
  }
};

export const searchSpotifyArtists = async (query: string) => {
  try {
    const token = await getSpotifyAccessToken();
    console.log('Access token obtained:', token); // Log the token for debugging

    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('Spotify API response:', response.data); // Log the response for debugging
    return response.data.artists.items;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error searching Spotify artists:', error.response?.data || error.message);
    } else {
      console.error('Error searching Spotify artists:', error);
    }
    throw error;
  }
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
