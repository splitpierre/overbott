type KEYS = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  REDIRECT_URI: string;
};

const getAccessToken = async (code: string, KEYS: KEYS) => {
  try {
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = KEYS;
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch access token');
    }

    const data = await response.json();
    window.electron.store.set('spotifyAccessToken', data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
};

export default getAccessToken;
