import {
  Check,
  Code,
  Delete,
  LockOpen,
  ModeStandby,
  PlayArrow,
  Refresh,
  RemoveRedEye,
  Restore,
  Stop,
} from '@mui/icons-material';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  Button,
  ButtonGroup,
  Typography,
  Tooltip,
} from '@mui/material';
import { t } from 'i18next';
import { useContext, useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import defaultEndpoints from '../../main/data/default-endpoints';
import { AppContext } from '../providers/AppProvider';

function StatsComponent(props: {
  setDockerIsLoading: any;
  dockerIsLoading: any;
}) {
  const {
    isLoading,
    filePaths,
    imageList,
    setServicesStatus,
    servicesStatus,
    setExecutionDescription,
    executionDescription,
    setIsLoading,
    // setChatMessages,
  } = useContext(AppContext);
  const { setDockerIsLoading, dockerIsLoading } = props;
  const [sysUsage, setSysUsage] = useState(window.electron.app.systemUsage());
  const [open, setOpen] = useState(false);
  const [apiKeyField, setApiKeyField] = useState('');
  const [selectedApi, setSelectedApi] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const handleClickOpen = (key: string) => {
    if (key === 'openAi')
      setApiKeyField(window.electron.store.get('openAiApiKey'));
    if (key === 'mistralAi')
      setApiKeyField(window.electron.store.get('mistralAiApiKey'));
    if (key === 'groq') setApiKeyField(window.electron.store.get('groqApiKey'));
    if (key === 'cohereAi')
      setApiKeyField(window.electron.store.get('cohereAiApiKey'));
    if (key === 'claude')
      setApiKeyField(window.electron.store.get('claudeApiKey'));
    setSelectedApi(key);
    setOpen(true);
  };

  const handleChangeApiKey = (event: any, key: string) => {
    // @ts-ignore
    window.electron.store.set(`${key}ApiKey`, event.target.value);
    setApiKeyField(event.target.value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // const servicesStatus = window.electron.store.get('servicesStatus');

  useEffect(() => {
    const interval = setInterval(() => {
      // const nowTime = new Date().getTime();
      // const formattedTime = new Date(nowTime).toLocaleTimeString();
      // console.log('ping system check state', {
      //   formattedTime,
      //   interval,
      //   isLoading: window.electron.store.get('isLoading'),
      // });
      const getSysUsage = window.electron.app.systemUsage();
      setSysUsage(getSysUsage);
      setExecutionDescription(
        window.electron.store.get('executionDescription'),
      );
      setDockerIsLoading(window.electron.store.get('dockerIsLoading'));
      setIsLoading(window.electron.store.get('isLoading') === 'true');
      // setChatMessages(window.electron.store.get('chatMessages'));
    }, 3000);
    // if (!servicesStatus.ollama) {
    //   const getServiceStatus = window.electron.app.servicesStatus();
    //   setServicesStatus(getServiceStatus);
    // }
    // const intervalLong = setInterval(() => {
    //   const getServiceStatus = window.electron.app.servicesStatus();
    //   setServicesStatus(getServiceStatus);
    // }, 15000);
    return () => {
      clearInterval(interval);
      // clearInterval(intervalLong);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Table
        size="small"
        aria-label="a dense table"
        style={{
          wordBreak: 'break-all',
        }}
      >
        <TableHead
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            // lineHeight: 1,
          }}
        >
          <TableRow>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {t('OS')}
            </TableCell>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {`${t('Service')} / ${t('Model')}`}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              {window.electron.app.isLinux() && 'Linux'}
              {window.electron.app.isWindows() && 'Windows'}
              {window.electron.app.isMac() && 'Mac'} <br /> (
              {sysUsage.cpuUsage && parseFloat(sysUsage.cpuUsage).toFixed(2)}
              % CPU) <br />(
              {sysUsage.memUsage &&
                (parseFloat(sysUsage.memUsage) * 100).toFixed(2)}
              {'% '} RAM)
            </TableCell>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              {window.electron.store.get('llmService')
                ? window.electron.store.get('llmService')
                : 'not set'}
              #{window.electron.store.get('llmModel') || 'no-model'}
              <br />
              {t('Temperature')}:{' '}
              {window.electron.store.get('modelTemperature') &&
                parseFloat(window.electron.store.get('modelTemperature'))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Table size="small" aria-label="a dense table">
        <TableHead
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <TableRow>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {t('State')}
            </TableCell>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {t('Value')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              isLoading
            </TableCell>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              {isLoading ? <CircularProgress size={24} /> : <ModeStandby />}
              {executionDescription ? ` Task: ${executionDescription}` : ''}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              mainModelEndpoint
            </TableCell>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              {window.electron.store.get('mainModelEndpoint')}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              contextType
            </TableCell>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              {contextType}
            </TableCell>
          </TableRow> */}
          {(filePaths || imageList.length > 0) && (
            <TableRow>
              <TableCell variant="body" sx={{ fontSize: 10 }}>
                filePaths
              </TableCell>
              <TableCell variant="body" sx={{ fontSize: 10 }}>
                {`${filePaths.length || imageList.length} files(s)`}
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              totalTokens
            </TableCell>
            <TableCell variant="body" sx={{ fontSize: 10 }}>
              {window.electron.store.get('totalTokens') || 0} -{' '}
              {window.electron.store.get('totalTokens') &&
              typeof window.electron.store.get('totalTokens') === 'number'
                ? (window.electron.store.get('totalTokens') * 0.00003).toFixed(
                    6,
                  )
                : 0}
              $ (GPT4)
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Table size="small" aria-label="a dense table">
        <TableHead
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <TableRow>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {t('Service')}
            </TableCell>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {t('Status')}
            </TableCell>
            <TableCell variant="head" sx={{ lineHeight: 1, fontSize: 11 }}>
              {t('Actions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(servicesStatus).map((key: any) => (
            <TableRow key={key} className="statsServices">
              <TableCell variant="body" sx={{ fontSize: 10 }}>
                {/* @ts-ignore */}
                <Tooltip title={defaultEndpoints[key]} placement="top">
                  <Typography variant="caption" sx={{ fontSize: 10 }}>
                    {key}
                  </Typography>
                </Tooltip>
                {/* {key} */}
                {/* {
                  // @ts-ignore
                  defaultEndpoints[key] &&
                    // @ts-ignore
                    defaultEndpoints[key].replace(/https?:\/\//, '')
                } */}
              </TableCell>
              <TableCell variant="body" sx={{ fontSize: 10 }}>
                {servicesStatus[key] === true ? (
                  <Check sx={{ fontSize: 13 }} titleAccess={t('Available')} />
                ) : (
                  <Stop sx={{ fontSize: 13 }} titleAccess={t('Unavailable')} />
                )}
              </TableCell>
              <TableCell variant="body" sx={{ fontSize: 10 }}>
                {(key === 'openTts' ||
                  key === 'unstructured' ||
                  key === 'redis' ||
                  key === 'diffusersApi') &&
                  servicesStatus.docker === true && (
                    <ButtonGroup>
                      <Button
                        title={t('Stream Logs')}
                        variant="contained"
                        disabled={dockerIsLoading}
                        onClick={() => {
                          window.electron.docker.streamLogs(key);
                        }}
                      >
                        <RemoveRedEye sx={{ fontSize: 13 }} />
                      </Button>
                      {/* <Button
                      title={`${t('Reload')} ${t('Service')}: ${key} `}
                      disabled={dockerIsLoading}
                      onClick={() => {
                        window.electron.docker.reload(key);
                        setServicesStatus(window.electron.app.servicesStatus());
                      }}
                    >
                      <Refresh sx={{ fontSize: 13 }} />
                    </Button> */}
                      {servicesStatus[key] ? (
                        <Button
                          title={`${t('Stop')} ${t('Service')}: ${key} `}
                          disabled={dockerIsLoading}
                          variant="contained"
                          onClick={() => {
                            setDockerIsLoading(true);
                            window.electron.store.set('dockerIsLoading', true);
                            window.electron.docker.stop(key);
                            setTimeout(() => {
                              const newStatuses =
                                window.electron.app.servicesStatus();
                              setServicesStatus(newStatuses);
                              window.electron.store.set(
                                'servicesStatus',
                                newStatuses,
                              );
                            }, 3000);
                          }}
                        >
                          <Stop sx={{ fontSize: 13 }} />
                        </Button>
                      ) : (
                        <Button
                          title={`${t('Start')} ${t('Service')}: ${key} `}
                          disabled={dockerIsLoading}
                          variant="contained"
                          onClick={() => {
                            setDockerIsLoading(true);
                            window.electron.store.set('dockerIsLoading', true);
                            window.electron.docker.start(key);
                            setTimeout(() => {
                              const newStatuses =
                                window.electron.app.servicesStatus();
                              setServicesStatus(newStatuses);
                              window.electron.store.set(
                                'servicesStatus',
                                newStatuses,
                              );
                            }, 3000);
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 13 }} />
                        </Button>
                      )}
                      <Button
                        title={`${t('Remove')} ${t('Service')}: ${key} `}
                        disabled={dockerIsLoading}
                        variant="contained"
                        onClick={() => {
                          setDockerIsLoading(true);
                          window.electron.store.set('dockerIsLoading', true);
                          window.electron.docker.remove(key);
                          setTimeout(() => {
                            const newStatuses =
                              window.electron.app.servicesStatus();
                            setServicesStatus(newStatuses);
                            window.electron.store.set(
                              'servicesStatus',
                              newStatuses,
                            );
                          }, 3000);
                        }}
                      >
                        <Delete sx={{ fontSize: 13 }} />
                      </Button>
                    </ButtonGroup>
                  )}
                {(key === 'openAi' ||
                  key === 'mistralAi' ||
                  key === 'claude' ||
                  key === 'cohereAi' ||
                  key === 'groq') && (
                  <ButtonGroup>
                    <Button
                      title="API Key"
                      variant="contained"
                      onClick={() => handleClickOpen(key)}
                    >
                      <Code sx={{ fontSize: 13 }} />
                    </Button>
                  </ButtonGroup>
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3}>
              <ButtonGroup fullWidth>
                <Button
                  disabled={dockerIsLoading}
                  variant="contained"
                  title={t('Refresh Services')}
                  startIcon={
                    dockerIsLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Refresh />
                    )
                  }
                  onClick={() => {
                    const newStatuses = window.electron.app.servicesStatus();
                    setServicesStatus(newStatuses);
                    window.electron.store.set('servicesStatus', newStatuses);
                  }}
                  size="small"
                />
                <Button
                  size="small"
                  variant="contained"
                  title="Reset docker state"
                  startIcon={<Restore />}
                  onClick={() => {
                    setDockerIsLoading(false);
                    window.electron.store.set('dockerIsLoading', false);
                    window.electron.store.set('dockerStream', '');
                  }}
                />
              </ButtonGroup>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          component: 'form',
          onSubmit: (event: any) => {
            event.preventDefault();
            // @ts-ignore
            window.electron.store.set(`${selectedApi}ApiKey`, apiKeyField);
            handleClose();

            const newStatuses = window.electron.app.servicesStatus();
            setServicesStatus(newStatuses);
            window.electron.store.set('servicesStatus', newStatuses);
          },
        }}
      >
        <DialogTitle
          sx={{
            textTransform: 'capitalize',
          }}
        >
          {selectedApi} API Key
        </DialogTitle>
        <DialogContent>
          <DialogContentText>Set API Key for the service</DialogContentText>
          <TextField
            autoFocus
            InputProps={{
              startAdornment: (
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    marginRight: 1,
                  }}
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide API Key' : 'Show'}
                >
                  {showApiKey ? <LockOpen /> : <RemoveRedEye />}
                </Button>
              ),
            }}
            required
            fullWidth
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyField}
            onChange={(event) => handleChangeApiKey(event, selectedApi)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StatsComponent;
