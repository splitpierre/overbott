/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Container,
  Typography,
  ButtonGroup,
} from '@mui/material';
import { PlayArrow, Save } from '@mui/icons-material';
// @ts-ignore
import SpotifyPlayer from 'react-spotify-player';
import getAccessToken from '../../main/providers/spotify';

const CLIENT_ID = '748f272e7348471a8bef38d59317c94d';
const REDIRECT_URI = 'http://localhost:1212/callback';
const CLIENT_SECRET = '04a0ad889f294e3f8f4271d0d206cd80';

export function SpotifyPlayerHolder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [spotifyUri, setSpotifyUri] = useState(
    window.electron.store.get('spotifyUri') ||
      'spotify:album:1TIUsv8qmYLpBEhvmBmyBk',
  );

  const handleSearch = async () => {
    try {
      const accessToken = window.electron.store.get('spotifyAccessToken');
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${searchQuery}&type=track`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`, // Replace with your Spotify access token
          },
        },
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (error) {
      console.error('Error searching for tracks:', error);
      window.electron.dialog.error(
        'Error searching for tracks',
        'Please check your Spotify configuration/authentication',
      );
    }
  };

  const handlePlay = (trackUri: any) => {
    // Implement logic to play the track using a Spotify SDK or other method
    console.log('Playing track:', trackUri);
    setSpotifyUri(trackUri);
    window.electron.store.set('spotifyUri', trackUri);
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Spotify Player
      </Typography>
      <TextField
        label="Search for a song"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
      />
      {/* <TextField
        label="Auth Code"
        value={window.electron.store.get('spotifyAccessToken')}
        onChange={(e) =>
          window.electron.store.set('spotifyAccessToken', e.target.value)
        }
        fullWidth
        margin="normal"
        variant="outlined"
      /> */}
      <Button variant="contained" color="primary" onClick={handleSearch}>
        Search
      </Button>

      <TextField
        id="auth-code"
        label="Auth Code"
        variant="outlined"
        value={window.electron.store.get('spotifyAuthCode')}
        onChange={(e) =>
          window.electron.store.set('spotifyAuthCode', e.target.value)
        }
        fullWidth
        InputProps={{
          endAdornment: (
            <ButtonGroup>
              <Button
                onClick={() =>
                  getAccessToken(window.electron.store.get('spotifyAuthCode'), {
                    CLIENT_ID,
                    CLIENT_SECRET,
                    REDIRECT_URI,
                  })
                }
                variant="contained"
                title="Set"
              >
                <Save />
              </Button>
            </ButtonGroup>
          ),
        }}
      />
      <List>
        {searchResults.map((track: any) => (
          <ListItem key={track.id} button onClick={() => handlePlay(track.uri)}>
            <ListItemText
              primary={track.name}
              secondary={`Artists: ${track.artists
                .map((artist: any) => artist.name)
                .join(', ')}`}
            />
            <Button
              onClick={() => handlePlay(track.uri)}
              variant="contained"
              title="Play"
            >
              <PlayArrow />
            </Button>
          </ListItem>
        ))}
      </List>
      <SpotifyPlayer
        uri={spotifyUri}
        // size={300}
        // view={600}
        // theme={theme}
      />
    </Container>
  );
}
const track = {
  name: '',
  album: {
    images: [{ url: '' }],
  },
  artists: [{ name: '' }],
};

export function SpotifyWebPlayback(props: any) {
  const { token } = props;
  const [isPaused, setPaused] = useState(false);
  const [isActive, setActive] = useState(false);
  const [player, setPlayer] = useState(undefined);
  const [currentTrack, setTrack] = useState(track);

  useEffect(() => {
    // const script = document.createElement('script');
    // script.src = SpotifyLocal;
    // script.async = true;

    // document.body.appendChild(script);

    // @ts-ignore
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: (cb: (arg0: any) => void) => {
          cb(token);
        },
        volume: 0.5,
      });

      setPlayer(player);

      player.addListener('ready', ({ deviceId }: { deviceId: string }) => {
        console.log('Ready with Device ID', deviceId);
      });

      player.addListener('not_ready', ({ deviceId }: { deviceId: string }) => {
        console.log('Device ID has gone offline', deviceId);
      });

      player.addListener(
        'player_state_changed',
        (state: {
          track_window: { current_track: any };
          paused: boolean | ((prevState: boolean) => boolean);
        }) => {
          if (!state) {
            return;
          }

          setTrack(state.track_window.current_track);
          setPaused(state.paused);

          player
            .getCurrentState()
            .then((theState: any) => {
              return !theState ? setActive(false) : setActive(true);
            })
            .catch((error: any) => {
              console.error('Error fetching current state:', error);
            });
        },
      );

      player.connect();
    };
  }, []);

  if (!isActive) {
    return (
      <div className="container">
        <div className="main-wrapper">
          <b>
            {' '}
            Instance not active. Transfer your playback using your Spotify app{' '}
          </b>
        </div>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="main-wrapper">
        <img
          src={currentTrack.album.images[0].url}
          className="now-playing__cover"
          alt=""
        />

        <div className="now-playing__side">
          <div className="now-playing__name">{currentTrack.name}</div>
          <div className="now-playing__artist">
            {currentTrack.artists[0].name}
          </div>

          <Button
            className="btn-spotify"
            onClick={() => {
              player.previousTrack();
            }}
          >
            &lt;&lt;
          </Button>

          <Button
            className="btn-spotify"
            onClick={() => {
              player.togglePlay();
            }}
          >
            {isPaused ? 'PLAY' : 'PAUSE'}
          </Button>

          <Button
            className="btn-spotify"
            onClick={() => {
              player.nextTrack();
            }}
          >
            &gt;&gt;
          </Button>
        </div>
      </div>
    </div>
  );
}
