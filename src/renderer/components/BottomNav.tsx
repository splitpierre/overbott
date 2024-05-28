/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SettingsApplications,
  MusicNote,
  TravelExplore,
  ChatBubble,
  Close,
} from '@mui/icons-material';
import { ButtonGroup, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { AudioHandles } from '../../main/types/app-types';

function BottomNav(props: {
  // llmModel: string;
  // setIsThinking: any;
  // isLoading: boolean;
  // handleSubmit: any;
  // fetchModels: any;
  // handleSelectModel: any;
  // setStopStream: any;
  playAudio: (handle: AudioHandles) => void;
}) {
  const {
    // llmModel,
    // isLoading,
    // handleSubmit,
    // fetchModels,
    // handleSelectModel,
    // setStopStream,
    playAudio,
  } = props;

  const navigate = useNavigate();

  return (
    <Box
      p={2}
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '5vh',
        // minHeight: '30px',
        padding: 0,
        opacity: 0.9,
      }}
    >
      <ButtonGroup fullWidth sx={{ height: '100%' }}>
        <Button
          variant="contained"
          title="Home"
          sx={{ height: '100%' }}
          // on hover play audio
          onMouseEnter={() => {
            playAudio('hover');
          }}
          onClick={() => {
            console.log('send');
            navigate('/');
          }}
        >
          <ChatBubble />
        </Button>
        {/* <Button
        variant="contained"
        title="Send"
        onClick={() => {
          console.log('send');
          handleSubmit();
        }}
      >
        <Send />
      </Button> */}
        <Button
          variant="contained"
          title="Browse Web"
          onMouseEnter={() => {
            playAudio('hover');
          }}
          onClick={() => {
            console.log('send');
            navigate('/web-browser');
          }}
        >
          {/* Globe icon from mui */}
          <TravelExplore />
        </Button>
        {/* <Button
          title="Clear Everything"
          variant="contained"
          onClick={() => {
            window.electron.store.clear();
            window.electron.app.reload();
          }}
        >
          <DeleteForever />
        </Button> */}
        <Button
          title="Music"
          variant="contained"
          onMouseEnter={() => {
            playAudio('hover');
          }}
          onClick={() => {
            navigate('/spotify');
          }}
        >
          <MusicNote />
        </Button>
        {/* <Button
          title="TEST"
          variant="contained"
          onClick={() => {
            navigate('/screenshot');
          }}
        >
          <Coffee />
        </Button> */}

        {/*
      <Button
        variant="contained"
        title="Send"
        onClick={() => {
          console.log('send');
          handleSubmit();
        }}
      >
        <Send />
      </Button>

      {/* <Button
            variant="contained"
            onClick={() => {
              fakeBotResponse('Hello, I am OverBott!');
            }}
          >
            R
          </Button> */}
        <Button
          variant="contained"
          title={t('Settings')}
          onMouseEnter={() => {
            playAudio('hover');
          }}
          onClick={() => {
            navigate('/settings');
          }}
        >
          <SettingsApplications />
        </Button>
        {/* <Button
          title="Maximize"
          variant="contained"
          onClick={() => {
            window.electron.main.maximize();
          }}
        >
          <MaximizeRounded />
        </Button> */}
        <Button
          title={t('Close to Tray')}
          variant="contained"
          onMouseEnter={() => {
            playAudio('hover');
          }}
          onClick={() => {
            window.electron.main.closeMain();
          }}
        >
          <Close />
        </Button>

        {/* <Button
        variant="contained"
        onClick={() => {
          console.log('callback');
          navigate(
            '/callback?code=AQDjkDFdGqsdfrRNczRchqHSrGwYK7sZ-In5AkN1oEW8uMHA6DBh5G_Dd7PwxgpODoLTduiu3zyIM89bXMLD_3FPuZEQqB1r5tLB_x2btUMRdDy-syK61QXA4_Z_qjrOqGJeginX7OMdRWKmqjfXhfAukljF-AIKknyUS2t5LZ05S4n9XUqYsdpCLifmd89l4-grBizBcsQhkNNlW2sgGKtpxygTq0K2n2T80oVIp-QSvnwZ7TjtbaQUKOWfl4sbw-qjky7CX1OF2nZCPjiipGmXOpIuVPmskCsys7K3DOFHKVK3QXSn6KQV_LN2ha_ByYEcvVVrg9EB',
          );
          // window.location.href = '/callback?code=1234';
        }}
      >
        callback!
      </Button> */}
        {/* <Button
            startIcon={<RefreshIcon />}
            onClick={async () => {
              console.log('refresh models');
              await OllamaProvider.fetchOllamaModels();
            }}
          /> */}
      </ButtonGroup>
    </Box>
  );
}

export default BottomNav;
