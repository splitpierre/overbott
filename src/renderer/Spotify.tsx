import { CssBaseline, ThemeProvider } from '@mui/material';
import SpotifyBody from './pages/SpotifyBody';

function Spotify(props: { theme: any }) {
  const { theme } = props;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SpotifyBody />
    </ThemeProvider>
  );
}
export default Spotify;
