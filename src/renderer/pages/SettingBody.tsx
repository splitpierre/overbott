/* eslint-disable react/jsx-props-no-spreading */
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import React, { useContext } from 'react';
import {
  DeleteForever,
  DeleteSweep,
  LeakRemove,
  OfflineBolt,
  Search,
  ThumbUp,
  TravelExplore,
} from '@mui/icons-material';
import { t } from 'i18next';
import getAccessToken from '../../main/providers/spotify';
import CustomTabPanel from '../components/settings/CustomPanel';
import IntegrationsTabContent from '../components/settings/IntegrationsTab';
import Logo from '../../../assets/overbott-logo-2.png';
import customScrollBar from '../ScrollBar';
import defaultEndpoints from '../../main/data/default-endpoints';
import { LanguageModelContext } from '../providers/LanguageModelProvider';
import { ThemeContext } from '../providers/ThemeProvider';
import { AppContext } from '../providers/AppProvider';

const REDIRECT_URI = 'http://localhost:1212/callback';

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
function SettingBody() {
  const { fetchModels, llmModels, setLlmService, setMainModelEndpoint } =
    useContext(LanguageModelContext);
  const { themeMode } = useContext(ThemeContext);
  const { exposeApi, setExposeApi } = useContext(AppContext);
  // const llmModels = window.electron.store.get('llmModels') || [];
  // const [embeddingModel, setEmbeddingModel] = React.useState(
  //   window.electron.store.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2',
  // );
  const [value, setValue] = React.useState(0);

  const handleSelectService = (
    event: React.ChangeEvent<{ value: unknown }>,
  ) => {
    const service = event.target.value as string;
    setLlmService(service);
    window.electron.store.set('llmService', service);
    if (service === 'ollama') {
      window.electron.store.set('mainModelEndpoint', defaultEndpoints.ollama);
      setMainModelEndpoint(defaultEndpoints.ollama);
      fetchModels(service);
    }
    if (service === 'gpt4All') {
      window.electron.store.set('mainModelEndpoint', defaultEndpoints.gpt4All);
      setMainModelEndpoint(defaultEndpoints.gpt4All);
      fetchModels(service);
    }
    if (service === 'llamaCpp') {
      window.electron.store.set('mainModelEndpoint', defaultEndpoints.llamaCpp);
      setMainModelEndpoint(defaultEndpoints.llamaCpp);
      fetchModels(service);
    }
    console.log('handleService', {
      service,
    });
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const spotifyLogin = async () => {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
    ];

    const url = `https://accounts.spotify.com/authorize?client_id=${window.electron.store.get(
      'spotifyClientId',
    )}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${scopes.join(
      '%20',
    )}`;
    window.electron.shell.openExternal(url);
  };
  // const handleOllamaSetting = (
  //   setting: string,
  //   event: React.ChangeEvent<{ value: unknown }>,
  // ) => {
  //   window.electron.store.set(setting, event.target.value as string);
  //   if (setting === 'mainModelEndpoint') {
  //     setMainModelEndpoint(event.target.value as string);
  //     window.electron.store.set('mainModelEndpoint', event.target.value);
  //   }

  //   if (setting === 'modelTemperature') {
  //     setModelTemperature(event.target.value as string);
  //     window.electron.store.set('modelTemperature', modelTemperature);

  //   }
  // };

  // const handleSave = () => {
  //   if (mainModelEndpoint) {
  //   }
  //   if (modelTemperature) {
  //   }
  //   window.electron.store.set('setting.transparent', transparency);
  //   window.electron.app.reload();
  // };
  return (
    <Box
      height="95vh"
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label={t('Integrations')} {...a11yProps(0)} />
            <Tab label={t('Presets')} {...a11yProps(1)} />
            <Tab label={t('Settings')} {...a11yProps(2)} />
            <Tab label="Spotify" {...a11yProps(3)} />
            <Tab label={t('About')} {...a11yProps(4)} />
            <Tab label={t('Privacy')} {...a11yProps(5)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <IntegrationsTabContent handleSelectService={handleSelectService} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          {/** GRID WITH SAVED PRESETS */}
          {/* <Typography variant="h6">Saved Presets</Typography> */}
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Grid container spacing={2}>
              {
                // eslint-disable-next-line no-plusplus
                [1, 2, 3, 4, 5].map((preset) => (
                  <Grid item xs={4} key={preset}>
                    <Button variant="contained" color="primary" fullWidth>
                      Preset {preset}
                    </Button>
                  </Grid>
                ))
              }
            </Grid>
          </Paper>
          <Divider />
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Typography variant="h6">
              {`${t('Add new')} ${t('Presets')}`}{' '}
            </Typography>
            <FormControl fullWidth>
              <TextField
                id="outlined-basic"
                label="Preset Name"
                variant="outlined"
              />
              <TextField
                id="outlined-basic"
                label="Pre-prompt"
                variant="outlined"
              />
              {llmModels && llmModels.length > 0 && (
                <Select
                  title="Select Model"
                  value={window.electron.store.get('llmModel') || 'no-model'}
                  onChange={(event: any) => {
                    window.electron.store.set('llmModel', event.target.value);
                  }}
                >
                  {llmModels.length &&
                    llmModels.map((m: any, i: number) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <MenuItem value={m.model} key={i}>
                        {m.name}
                      </MenuItem>
                    ))}
                  {!llmModels.length && (
                    <MenuItem value="no-model">No models</MenuItem>
                  )}
                </Select>
              )}

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save Preset
              </Button>
            </FormControl>
          </Paper>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Grid container spacing={2}>
              <Grid item md={6}>
                <InputLabel id="exposeApiSetting">
                  Expose API (:4892)
                </InputLabel>
                <Switch
                  id="exposeApiSetting"
                  title="Expose API (Requires restarting application)"
                  aria-label="Expose API"
                  checked={exposeApi}
                  onClick={() => {
                    window.electron.store.set('exposeApi', !exposeApi);
                    setExposeApi(!exposeApi);
                  }}
                />
                <InputLabel id="themeModeSetting">Theme Mode</InputLabel>
                <Switch
                  id="themeModeSetting"
                  title="Theme Mode (dark/light)"
                  aria-label="Theme Mode (dark/light)"
                  value={window.electron.store.get('themeMode') || themeMode}
                  checked={themeMode === 'dark'}
                  onClick={() => {
                    if (themeMode === 'dark') {
                      window.electron.store.set('themeMode', 'light');
                    } else {
                      window.electron.store.set('themeMode', 'dark');
                    }
                    window.electron.app.reload();
                  }}
                />
                <InputLabel id="colorScheme">Color Scheme</InputLabel>
                <Select
                  fullWidth
                  title="Select Color Scheme"
                  value={window.electron.store.get('colorScheme') || 'bluePink'}
                  onChange={(event: any) => {
                    window.electron.store.set(
                      'colorScheme',
                      event.target.value,
                    );
                    window.electron.app.reload();
                  }}
                >
                  <MenuItem value="overBott">OverBott</MenuItem>
                  <MenuItem value="bluePink">Blue/Pink</MenuItem>
                  <MenuItem value="dracula">Dracula</MenuItem>
                  <MenuItem value="midnightBlue">Midnight Blue</MenuItem>
                  <MenuItem value="forestGreen">Forest Green</MenuItem>
                  <MenuItem value="deepPurple">Deep Purple</MenuItem>
                </Select>
                <InputLabel id="interfaceLanguage">
                  Interface Language
                </InputLabel>
                <Select
                  fullWidth
                  id="interfaceLanguage"
                  title="Interface Language"
                  value={window.electron.store.get('language') || 'en'}
                  onChange={(event: any) => {
                    window.electron.store.set('language', event.target.value);
                    window.electron.app.reload();
                  }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </Grid>
              <Grid item md={6}>
                <InputLabel id="playAudioEffects">Audio Effects</InputLabel>
                <Select
                  id="playAudioEffects"
                  fullWidth
                  title="Audio Effects"
                  value={!!window.electron.store.get('playAudioEffects')}
                  onChange={(event: any) => {
                    window.electron.store.set(
                      'playAudioEffects',
                      event.target.value === 'true',
                    );
                    window.electron.app.reload();
                  }}
                >
                  <MenuItem value="true">Play audio effects</MenuItem>
                  <MenuItem value="false">No audio effects</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Paper>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={3}>
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Typography variant="h6">Keys & Tokens</Typography>
            <FormControl fullWidth>
              <TextField
                id="spotify-client-id"
                label="Client ID"
                variant="outlined"
                value={window.electron.store.get('spotifyClientId') || ''}
                onChange={(e: any) => {
                  window.electron.store.set('spotifyClientId', e.target.value);
                }}
              />
              <TextField
                id="spotify-client-secret"
                label="Client Secret"
                variant="outlined"
                value={window.electron.store.get('spotifyClientSecret') || ''}
                onChange={(e: any) => {
                  window.electron.store.set(
                    'spotifyClientSecret',
                    e.target.value,
                  );
                }}
              />
              <Button
                variant="contained"
                color="primary"
                style={{ marginLeft: '10px' }}
                onClick={spotifyLogin}
              >
                Login
              </Button>
            </FormControl>
          </Paper>
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            {' '}
            <TextField
              id="spotify-auth-code"
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
                        getAccessToken(
                          window.electron.store.get('spotifyAuthCode'),
                          {
                            CLIENT_ID:
                              window.electron.store.get('spotifyClientId'),
                            CLIENT_SECRET: window.electron.store.get(
                              'spotifyClientSecret',
                            ),
                            REDIRECT_URI: 'http://localhost:1212/callback',
                          },
                        )
                      }
                      variant="contained"
                      title="Set"
                    >
                      <SaveIcon />
                    </Button>
                  </ButtonGroup>
                ),
              }}
            />
            <TextField
              id="spotify-access-token"
              value={window.electron.store.get('spotifyAccessToken') || ''}
              label="Access Token"
              variant="outlined"
              disabled
              fullWidth
            />
          </Paper>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={4}>
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Grid container spacing={2}>
              <Grid item md={4}>
                <img src={Logo} alt="OverBott" width="100%" height="auto" />
                <Grid container display="flex" alignItems="center">
                  <Grid item xs={1}>
                    <Typography variant="h1">&ldquo;</Typography>
                  </Grid>
                  <Grid item xs={11}>
                    <Typography variant="body2">
                      Ride the wave of the future with OverBott - where slow
                      meets savvy, and privacy takes the fast lane!
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item md={8}>
                <Typography variant="body1" sx={{ margin: 3 }}>
                  Overbott is the ultimate companion in your digital
                  exploration, seamlessly integrating with leading AI tools like
                  LocalAI, Ollama, and OpenAI. With its futuristic turtle avatar
                  guiding the way, Overbott offers a plethora of features to
                  enhance your experience.
                </Typography>
                <Divider />
                <Typography variant="body1" sx={{ margin: 3 }}>
                  From generating and recognizing images to lightning-fast voice
                  synthesis and recognition, Overbott ensures efficiency without
                  compromising privacy. With preset management for tailored
                  experiences, a built-in web browser, and the ability to study
                  with embedded file data, Overbott is not just a tool but a
                  gateway to endless possibilities.
                </Typography>
                <Divider />

                <Typography variant="body1" sx={{ margin: 3 }}>
                  Whether you&apos;re diving into music, delving into study mode
                  with documents, or honing your coding skills with fetched
                  documentation and interactive learning, Overbott is your
                  trusted ally in the realm of AI exploration.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={5}>
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Typography variant="h6">Privacy & Data</Typography>
            <Typography variant="body1">
              Your privacy is important to us. Here are some of the ways we
              protect it:
            </Typography>
            <List>
              <ListItemButton>
                <ListItemIcon>
                  <ThumbUp />
                </ListItemIcon>
                <ListItemText>
                  OverBott only stores settings that you configure and responses
                  the app gets from services.
                </ListItemText>
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon>
                  <OfflineBolt />
                </ListItemIcon>
                OverBott does not track any user data and does not employ any
                kind of data-mining / anonymization / monetization technique.
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon>
                  <LeakRemove />
                </ListItemIcon>
                All data is stored locally on your computer and is not shared
                with any third-party service.
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon>
                  <TravelExplore />
                </ListItemIcon>
                OverBott browser-like feature embeds &lsquo;guest&rsquo; content
                in a separate process (iframe). All browsing data
                (cookies/cache) will be destroyed as soon as the web-view focus
                is lost.
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon>
                  <DeleteSweep />
                </ListItemIcon>
                You can delete all stored data by clicking the button below.
              </ListItemButton>
            </List>
          </Paper>
          <Divider />
          <Paper
            elevation={3}
            style={{
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <Typography variant="h6">Manage Your Data</Typography>
            <Alert severity="error">
              WARNING: Delete action is IRREVERSIBLE and will delete all stored
              data (settings, presets & chat messages).
            </Alert>
            <ButtonGroup>
              <Button
                variant="contained"
                color="info"
                startIcon={<Search />}
                onClick={() => {
                  window.electron.store.openInEditor();
                }}
              >
                View stored data
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => {
                  window.electron.store.clear();
                }}
              >
                Delete all stored data
              </Button>
            </ButtonGroup>
          </Paper>
        </CustomTabPanel>

        {/* <Button
            variant="contained"
            startIcon={<SaveIcon />}
            fullWidth
            onClick={handleSave}
          >
            Save
          </Button> */}
      </Box>
    </Box>
  );
}
export default SettingBody;
