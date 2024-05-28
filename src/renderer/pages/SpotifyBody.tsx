import { Box, Grid } from '@mui/material';
import { SpotifyPlayerHolder, SpotifyWebPlayback } from '../components/Spotify';
import customScrollBar from '../ScrollBar';

function SpotifyBody() {
  // const navigate = useNavigate();
  return (
    <Box
      height="85vh"
      display="flex"
      flexDirection="column"
      overflow="auto"
      sx={{
        ...customScrollBar({
          primary: 'primary.main',
          secondary: 'secondary.main',
        }),
      }}
    >
      <Box flexGrow={1}>
        <Grid container spacing={2} style={{ height: '100%' }}>
          {/* Left side taking 80% of the screen */}

          <Grid item xs={12}>
            <SpotifyWebPlayback
              token={window.electron.store.get('spotifyAccessToken')}
            />
            <SpotifyPlayerHolder />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
export default SpotifyBody;
