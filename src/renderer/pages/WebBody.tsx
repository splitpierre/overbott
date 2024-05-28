import React, { useEffect, useRef } from 'react';
import {
  OpenInNew,
  PlayArrow,
  // ArrowLeftTwoTone,
  // ArrowRightTwoTone,
  // Refresh,
  Search,
} from '@mui/icons-material';
import { Box, Button, ButtonGroup, Paper, TextField } from '@mui/material';
// import { useNavigate } from 'react-router-dom';

/**
 * A web browser component that can be used to display web pages.
 */
function WebBrowserBody(props: { setYtVideoId: any }) {
  const { setYtVideoId } = props;
  const isBrowsingYoutube: boolean =
    (window.electron.store.get('browserLastActiveURL') &&
      window.electron.store.get('browserLastActiveURL').includes('youtube')) ||
    false;
  const ytVideoId = window.electron.store
    .get('browserLastActiveURL')
    ?.includes('youtube')
    ? window.electron.store.get('browserLastActiveURL')?.split('v=')[1]
    : '';
  // webview src active
  const [currentSrc, setCurrentSrc] = React.useState<string>(
    window.electron.store.get('browserLastActiveURL') ||
      'https://www.google.com',
  );
  // nav bar value
  const [browseUrl, setBrowseUrl] = React.useState<string>(
    window.electron.store.get('browserLastActiveURL') ||
      'https://www.google.com',
  );
  const handleBrowserSearch = () => {
    let queryString = browseUrl;
    // if does not start with http:// or https://, defaults to search in google
    if (!browseUrl.startsWith('http://') && !browseUrl.startsWith('https://')) {
      queryString = `https://www.google.com/search?q=${browseUrl}`;
      // setBrowseUrl(searchGoogle);
    }
    setCurrentSrc(queryString);
    window.electron.store.set('browserLastActiveURL', queryString);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      handleBrowserSearch();
    }
  };
  // const navigate = useNavigate();

  // function that loops every 10 seconds to check if the webview has changed
  // eslint-disable-next-line no-undef
  const webviewRef: any = useRef<HTMLWebViewElement | null>(null);
  const checkWebview = () => {
    if (webviewRef.current) {
      if (webviewRef.current.src !== currentSrc) {
        setBrowseUrl(webviewRef.current.src);
        window.electron.store.set(
          'browserLastActiveURL',
          webviewRef.current.src,
        );
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(checkWebview, 500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '95vh' }}>
      {/* Top Box taking the rest of the screen */}
      <Paper
        elevation={3}
        style={{
          padding: '10px',
        }}
      >
        <Box flexGrow={0.03} sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Left side taking 80% of the screen */}
          <TextField
            id="nav-bar"
            // label="Type a URL"
            variant="outlined"
            size="small"
            value={browseUrl}
            onChange={(e) => setBrowseUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            InputProps={{
              // startAdornment: (
              //   <ButtonGroup>
              //     <Button
              //       variant="outlined"
              //       title="Back"
              //       onClick={() => {
              //         // navigate('/');
              //       }}
              //     >
              //       <ArrowLeftTwoTone />
              //     </Button>
              //     <Button
              //       variant="outlined"
              //       title="Forward"
              //       onClick={() => {
              //         // navigate('/');
              //       }}
              //     >
              //       <ArrowRightTwoTone />
              //     </Button>
              //     <Button
              //       variant="outlined"
              //       title="Refresh"
              //       onClick={() => {
              //         // navigate('/');
              //       }}
              //       sx={{
              //         marginRight: '10px',
              //       }}
              //     >
              //       <Refresh />
              //     </Button>
              //   </ButtonGroup>
              // ),
              endAdornment: (
                <ButtonGroup>
                  <Button
                    onClick={handleBrowserSearch}
                    variant="contained"
                    title="Search"
                    color="primary"
                  >
                    <Search />
                  </Button>
                  <Button
                    onClick={() => {
                      window.electron.shell.openExternal(browseUrl);
                    }}
                    variant="contained"
                    title="Open in browser"
                    color="secondary"
                  >
                    <OpenInNew />
                  </Button>
                  {ytVideoId && (
                    <Button
                      onClick={() => {
                        if (isBrowsingYoutube) {
                          const videoId = browseUrl.split('v=')[1];
                          setYtVideoId(videoId);
                        }
                      }}
                      variant="contained"
                      title="Play in sidebar"
                      color="secondary"
                    >
                      <PlayArrow />
                    </Button>
                  )}
                </ButtonGroup>
              ),
            }}
          />
        </Box>
      </Paper>
      <Box
        flexGrow={1}
        sx={{
          backgroundColor: 'white',
        }}
      >
        {/* <Grid item xs={12}> */}
        <webview
          ref={webviewRef}
          src={currentSrc}
          style={{
            width: '100%',
            height: '100%',
            // border: 'none',
          }}
        />
        {/* </Grid> */}
      </Box>
    </Box>
  );
}

export default WebBrowserBody;
