/* eslint-disable @typescript-eslint/no-unused-vars */
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonGroup,
  CssBaseline,
  Grid,
  TextField,
  ThemeProvider,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  BugReport,
  ToggleOff,
  ToggleOn,
} from '@mui/icons-material';
import { useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/default-highlight';
import SpotifyCallback from './callback';
import BottomNav from './components/BottomNav';
import SideBar from './components/SideBar';
import SettingBody from './pages/SettingBody';
import WebBrowserBody from './pages/WebBody';
import SpotifyBody from './pages/SpotifyBody';
import ComponentScreenshot from './components/ScreenshotComponent';
import ChatWindow from './components/chat/ChatWindow';
import { AppContext } from './providers/AppProvider';
import { ThemeContext, ThemeContextProvider } from './providers/ThemeProvider';
import { AudioContext } from './providers/AudioProvider';

export default function AppMain() {
  const {
    customThemeMain,
    themeMode,
    colorScheme,
    open,
    handleDrawerClose,
    handleDrawerOpen,
  } = useContext(ThemeContext);
  const {
    setYtVideoId,
    showTest,
    testState,
    setTestState,
    handleTestFunction,
    testResponse,
    setShowTest,
  } = useContext(AppContext);
  const { playAudio } = useContext(AudioContext);
  return (
    <BrowserRouter>
      <ThemeProvider theme={customThemeMain}>
        <CssBaseline />
        <Box
          height="100vh"
          display="flex"
          flexDirection="column"
          sx={{
            overflow: 'hidden',
            background:
              themeMode === 'dark'
                ? colorScheme.dark.backgroundGradient
                : colorScheme.light.backgroundGradient,
          }}
        >
          <Box flexGrow={1} style={{ height: '95vh' }}>
            <Grid container spacing={2}>
              {/* Left side taking 80% of the screen */}
              <Grid
                item
                xs={open ? 7 : 12}
                md={open ? 8 : 12}
                lg={open ? 9 : 12}
              >
                {/* Content for the left side */}
                <Grid container>
                  <Grid
                    item
                    sx={{
                      width: '99%',
                      // paddingRight: '3px',
                    }}
                  >
                    <Box
                      sx={{
                        background: '#ccc',
                        position: 'absolute',
                        width: showTest ? '100%' : '80px',
                        height: showTest ? '80%' : '150px',
                        overflow: showTest ? 'auto' : 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '5px',
                        zIndex: 1000,
                        top: showTest ? '0' : '-120px',
                        opacity: showTest ? 0.95 : 0.7,
                      }}
                    >
                      <ButtonGroup>
                        <TextField
                          label="Test State"
                          value={testState}
                          fullWidth
                          onChange={(e) => setTestState(e.target.value)}
                        />
                        <Button
                          title="Test Function"
                          size="small"
                          onClick={handleTestFunction}
                        >
                          <BugReport />
                        </Button>
                      </ButtonGroup>
                      {testResponse && showTest && (
                        <Grid
                          container
                          sx={{
                            maxHeight: '100%',
                            overflow: 'auto',
                          }}
                        >
                          <Grid item xs={12}>
                            <SyntaxHighlighter
                              language="json"
                              wrapLines
                              wrapLongLines
                            >
                              {JSON.stringify(testResponse.top, null, 2)}
                            </SyntaxHighlighter>
                          </Grid>
                          <Grid item xs={6}>
                            <SyntaxHighlighter
                              language="json"
                              wrapLines
                              wrapLongLines
                            >
                              {JSON.stringify(testResponse.left, null, 2)}
                            </SyntaxHighlighter>
                          </Grid>
                          <Grid item xs={6}>
                            <SyntaxHighlighter
                              language="json"
                              wrapLines
                              wrapLongLines
                            >
                              {JSON.stringify(testResponse.right, null, 2)}
                            </SyntaxHighlighter>
                          </Grid>
                        </Grid>
                      )}

                      <Button
                        title="Show/Hide Test Function"
                        size="small"
                        fullWidth
                        onClick={() => setShowTest(!showTest)}
                      >
                        {showTest ? <ToggleOff /> : <ToggleOn />}
                      </Button>
                    </Box>
                    {/* <Typography>themeMode:{themeMode}</Typography> */}
                    <Routes>
                      <Route path="/" element={<ChatWindow />} />
                      <Route path="/settings" element={<SettingBody />} />
                      <Route
                        path="/web-browser"
                        element={<WebBrowserBody setYtVideoId={setYtVideoId} />}
                      />
                      <Route path="/spotify" element={<SpotifyBody />} />
                      <Route
                        path="/screenshot"
                        element={<ComponentScreenshot />}
                      />

                      <Route
                        path="/callback"
                        element={<SpotifyCallback theme={customThemeMain} />}
                      />
                    </Routes>
                  </Grid>

                  <Grid
                    item
                    sx={{
                      width: '1%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      // opacity: 0.8,
                      background:
                        themeMode === 'dark'
                          ? colorScheme.dark.secondary
                          : colorScheme.light.secondary,
                      '&:hover': {
                        background:
                          themeMode === 'dark'
                            ? colorScheme.dark.primary
                            : colorScheme.light.primary,
                      },
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => {
                      playAudio('hover');
                    }}
                    onClick={open ? handleDrawerClose : handleDrawerOpen}
                  >
                    {/* <ButtonGroup sx={{ height: '100%' }}> */}
                    {/* <Button
                      size="small"
                      sx={{
                        padding: 0,
                        // minWidth: '5px',
                      }}
                      onClick={open ? handleDrawerClose : handleDrawerOpen}
                    > */}
                    {open ? (
                      <ArrowRight sx={{ fontSize: '24px' }} />
                    ) : (
                      <ArrowLeft sx={{ fontSize: '24px' }} />
                    )}
                    {/* </Button> */}
                    {/* </ButtonGroup> */}
                    {/* {open ? (
                      <ArrowForwardIos
                        sx={{
                          fontSize: '1.5rem',
                          color: 'primary.main',
                        }}
                      />
                    ) : (
                      <ArrowBackIos
                        sx={{
                          fontSize: '1.5rem',
                          color: 'primary.main',
                        }}
                      />
                    )} */}
                  </Grid>
                </Grid>
              </Grid>

              <Grid
                item
                xs={open ? 5 : 12}
                md={open ? 4 : 12}
                lg={open ? 3 : 12}
                sx={{
                  display: open ? 'block' : 'none',
                  paddingLeft: '0 !important',
                  paddingRight: '5px',
                }}
              >
                {/* Content for the right side */}
                <Box height="100vh">
                  <SideBar />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <BottomNav playAudio={playAudio} />
          {/* <script src={String(SpotifyLocal)} /> */}
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  );
}
