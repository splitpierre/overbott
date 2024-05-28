import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { Delete, ExpandMore } from '@mui/icons-material';
import { dracula, github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ContextInputArea from './chat/ChatContextInput';
import StatsComponent from './StatsComponent';
// import defaultEndpoints from '../../main/data/default-endpoints';
// import LottieCustomPlayer from './LottieCustomPlayer';
// import lilBot from '../../../assets/lilbot.json';
import LottieCustomPlayer from './LottieCustomPlayer';
// import lilOwl from '../../../assets/owl.json';
import lilTurtle from '../../../assets/lilTurtle.json';
import TextGenerationSettings from './settings/TextGenerationSettings';
// import { ExampleProvider, Greet } from './TestContext';
import { AppContext } from '../providers/AppProvider';
import ImageGenerationSettings from './settings/ImageGenerationSettings';
import RAGSettings from './settings/RAGSettings';

function SideBar() {
  const {
    setFilePaths,
    filePaths,
    setContextType,
    setYtVideoId,
    contextType,
    setImageList,
    ytVideoId,
    imageList,
  } = useContext(AppContext);
  // const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | false>('panel2');
  const [dockerStream, setDockerStream] = useState<string>(
    window.electron.store.get('dockerStream') || '',
  );
  const handleChange = (panel: string) => (event: any, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };
  // const audioResponse: any =
  //   window.electron.store.get('audioResponse') || false;
  const [dockerIsLoading, setDockerIsLoading] = useState(
    window.electron.store.get('dockerIsLoading') || false,
  );
  useEffect(() => {
    // refresh dockerStream every 5 seconds
    const interval = setInterval(() => {
      setDockerStream(window.electron.store.get('dockerStream') || '');
    }, 3000);
    return () => clearInterval(interval);
  }, [dockerStream]);

  return (
    <Box sx={{ overflow: 'auto', height: '95vh' }}>
      {/* <ExampleProvider>
        <Greet />
      </ExampleProvider> */}
      <Paper>
        <Accordion
          expanded={expanded === 'panel1'}
          onChange={handleChange('panel1')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel3-content"
            id="panel3-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            Stats & Services
          </AccordionSummary>
          <AccordionDetails>
            <StatsComponent
              setDockerIsLoading={setDockerIsLoading}
              dockerIsLoading={dockerIsLoading}
            />

            {dockerStream && (
              <Box
                sx={{
                  maxHeight: '400px',
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  fontSize: '11px',
                }}
              >
                <Typography variant="h6">Task logs</Typography>
                <Typography variant="caption">
                  Installation/terminal task executions will be shown here. If a
                  service is installing please wait, if stuck press the Reset
                  docker state button.
                </Typography>
                <SyntaxHighlighter
                  language="json"
                  style={
                    window.electron.store.get('themeMode') === 'dark'
                      ? dracula
                      : github
                  }
                  wrapLines
                  lineProps={{
                    style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
                  }}
                >
                  {`${JSON.stringify(dockerStream)}`}
                </SyntaxHighlighter>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded === 'panel2'}
          onChange={handleChange('panel2')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel2-content"
            id="panel2-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            Text Generation Settings
          </AccordionSummary>
          <AccordionDetails>
            <TextGenerationSettings />
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === 'panel3'}
          onChange={handleChange('panel3')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel3-content"
            id="panel3-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            RAG Settings
          </AccordionSummary>
          <AccordionDetails>
            <RAGSettings />
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === 'panel4'}
          onChange={handleChange('panel4')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel4-content"
            id="panel4-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            Image Generation Settings
          </AccordionSummary>
          <AccordionDetails>
            <ImageGenerationSettings />
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === 'panel5'}
          onChange={handleChange('panel5')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel5-content"
            id="panel5-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            Text To Speech Settings
          </AccordionSummary>
          <AccordionDetails>
            {/* <TextGenerationSettings /> */}asd
          </AccordionDetails>
        </Accordion>
        <Accordion
          defaultExpanded
          // expanded={expanded === 'panel6'}
          // onChange={handleChange('panel6')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel6-content"
            id="panel6-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            Context Window
          </AccordionSummary>
          <AccordionDetails>
            <ContextInputArea
              setFilePaths={setFilePaths}
              filePaths={filePaths}
              setContextType={setContextType}
              contextType={contextType}
              setImageList={setImageList}
              imageList={imageList}
            />
          </AccordionDetails>
        </Accordion>
        {/* // Media */}
        <Accordion
          expanded={expanded === 'panel6'}
          onChange={handleChange('panel6')}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel6-content"
            id="panel6-header"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              maxHeight: '30px !important',
              minHeight: 'initial !important',
            }}
          >
            Media
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {ytVideoId && (
                <>
                  <iframe
                    width="100%"
                    height="300"
                    src={`https://www.youtube.com/embed/${ytVideoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => setYtVideoId('')}
                  >
                    <Delete />
                  </Button>
                </>
              )}
              {!ytVideoId && expanded === 'panel4' && (
                <Box
                  sx={{
                    width: '100%',
                    height: '300px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <LottieCustomPlayer
                    src={lilTurtle}
                    loop
                    autoplay
                    // controls
                  />
                </Box>
              )}
              {/* {audioResponse && (
                <div>
                  <audio controls>
                    <source
                      src={`${defaultEndpoints.openTts}/api/tts?voice=coqui-tts:en_ljspeech&text=${audioResponse}&vocoder=high&denoiserStrength=0.03&cache=false`}
                      type="audio/mpeg"
                    />
                    <track kind="captions" />
                    {t('Your browser does not support the audio element')}
                  </audio>
                </div>
              )} */}
            </Box>
          </AccordionDetails>
        </Accordion>
        {/* {dockerStream && (
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="panel5-content"
              id="panel5-header"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                maxHeight: '30px !important',
                minHeight: 'initial !important',
              }}
            >
              Docker Stream
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  maxHeight: '400px',
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  fontSize: '11px',
                }}
              >
                <SyntaxHighlighter
                  language="json"
                  style={
                    window.electron.store.get('themeMode') === 'dark'
                      ? dracula
                      : github
                  }
                  wrapLines
                  lineProps={{
                    style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
                  }}
                >{`${JSON.stringify(dockerStream)}`}</SyntaxHighlighter>
              </Box>
            </AccordionDetails>
          </Accordion>
        )} */}
      </Paper>

      {/* <Lottie
                options={{
                  loop: true,
                  autoplay: false,
                  animationData: lilBot,
                }}
                // loop={true}
                // autoplay={false}
                style={{ width: '300px', height: '300px' }}
                isPaused={!isLoading}
              /> */}
      {/* {!browsingYoutube && (
        <>
          {isLoading && (
            <LottieCustomPlayer
              src={lilBot}
              loop
              autoplay
              // controls
            />
          )}
          {!isLoading && (
            <LottieCustomPlayer
              src={lilTurtle}
              loop
              autoplay
              // controls
            />
          )}
        </>
      )} */}
      {/* {!ytVideoId && (
        <img src={Logo} alt="OverBott" width="100%" height="auto" />
      )} */}

      {/* {ytVideoId} */}
    </Box>
  );
}

export default SideBar;
