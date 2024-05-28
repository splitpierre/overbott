import {
  FormControl,
  Paper,
  TextField,
  Button,
  Alert,
  ButtonGroup,
} from '@mui/material';
import { PlayCircle, Refresh, StopCircle, Update } from '@mui/icons-material';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import OllamaSettings from './OllamaSettings';
import GPT4AllSettings from './GPT4AllSettings';
import SelectActiveService from '../fields/SelectActiveService';
import { AppContext } from '../../providers/AppProvider';
import { LanguageModelContext } from '../../providers/LanguageModelProvider';

function IntegrationsTabContent(props: { handleSelectService: any }) {
  const { servicesStatus, setServicesStatus } = useContext(AppContext);
  const {
    llmService,
    setMainModelEndpoint,
    setModelTemperature,
    llmModels,
    mainModelEndpoint,
    modelTemperature,
    embeddingModel,
    setEmbeddingModel,
    fetchModels,
  } = useContext(LanguageModelContext);
  const navigate = useNavigate();
  const { handleSelectService } = props;
  return (
    <FormControl fullWidth>
      <Paper
        elevation={3}
        style={{
          padding: '10px',
          marginBottom: '10px',
        }}
      >
        <SelectActiveService
          llmService={llmService}
          handleSelectService={handleSelectService}
        />
        {llmService === 'ollama' && (
          <>
            {' '}
            <ButtonGroup>
              <Button
                title="Reboot Ollama Service (systemctl restart ollama)"
                onClick={() => {
                  console.log('reboot');
                  window.electron.ollama.reboot();
                  setServicesStatus(window.electron.app.servicesStatus());
                }}
              >
                <Refresh />
              </Button>

              {servicesStatus.ollama ? (
                <Button
                  title="Stop Ollama Service (systemctl stop ollama)"
                  onClick={() => {
                    console.log('updating');
                    window.electron.ollama.stop();
                    setTimeout(() => {
                      setServicesStatus(window.electron.app.servicesStatus());
                    }, 3000);
                  }}
                >
                  <StopCircle />
                </Button>
              ) : (
                <Button
                  title="Start Ollama Service (systemctl start ollama)"
                  onClick={() => {
                    console.log('updating');
                    window.electron.ollama.start();
                    setTimeout(() => {
                      setServicesStatus(window.electron.app.servicesStatus());
                    }, 3000);
                  }}
                >
                  <PlayCircle />
                </Button>
              )}
              <Button
                title="Update Ollama Service "
                onClick={() => {
                  console.log('updating');
                  window.electron.shell.openExternal(
                    'https://ollama.com/download',
                  );
                }}
              >
                <Update />
              </Button>
            </ButtonGroup>
            <Alert severity="info">
              Ollama is a local service that runs on your computer. You can
              download it from
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  window.electron.store.set(
                    'browserLastActiveURL',
                    'https://ollama.ai/download',
                  );
                  navigate('/web-browser');
                }}
              >
                ollama.ai
              </Button>
            </Alert>
          </>
        )}
      </Paper>
      {llmService === 'openAi' && (
        <Paper
          elevation={3}
          style={{
            padding: '10px',
            marginBottom: '10px',
          }}
        >
          <TextField
            id="outlined-basic"
            label="OpenAI API Key"
            variant="outlined"
            fullWidth
            value={window.electron.store.get('openAiApiKey')}
          />
        </Paper>
      )}
      {llmService === 'ollama' && (
        <OllamaSettings
          mainModelEndpoint={mainModelEndpoint}
          modelTemperature={modelTemperature}
          embeddingModel={embeddingModel}
          setEmbeddingModel={setEmbeddingModel}
          setMainModelEndpoint={setMainModelEndpoint}
          setModelTemperature={setModelTemperature}
          llmModels={llmModels}
          fetchModels={fetchModels}
        />
      )}
      {llmService === 'gpt4All' && (
        <GPT4AllSettings
          // endPoint={endPoint}
          modelTemperature={modelTemperature}
          // temp={temp}
          setEmbeddingModel={setEmbeddingModel}
          setModelTemperature={setModelTemperature}
          // setEndpoint={setEndpoint}
          // setTemp={setTemp}
          // llmModels={llmModels}
          fetchModels={fetchModels}
        />
      )}
    </FormControl>
  );
}

export default IntegrationsTabContent;
