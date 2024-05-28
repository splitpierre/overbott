// path="/callback?code=:code"

import { ThemeProvider } from '@emotion/react';
import { Box, CssBaseline, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const CLIENT_ID = '748f272e7348471a8bef38d59317c94d';
const REDIRECT_URI = 'http://localhost:1212/callback';
const CLIENT_SECRET = '04a0ad889f294e3f8f4271d0d206cd80';

function SpotifyCallback(props: { theme: any }) {
  const { theme } = props;
  const [searchParams] = useSearchParams();
  const [currentCode, setCode] = useState('' as string);

  const getAccessToken = async (code: string) => {
    try {
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
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && typeof code === 'string') {
      setCode(code);
      getAccessToken(code);
    }
  }, [searchParams]);

  if (currentCode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box height="100vh" display="flex" flexDirection="column">
          {/* Top Box taking the rest of the screen */}
          <Box flexGrow={1}>
            <Grid container spacing={2} style={{ height: '100%' }}>
              {/* Left side taking 80% of the screen */}
              <Grid item xs={9}>
                <Box>Spotify auth code: {currentCode}</Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Typography>---</Typography>
    </ThemeProvider>
  );
}

export default SpotifyCallback;
