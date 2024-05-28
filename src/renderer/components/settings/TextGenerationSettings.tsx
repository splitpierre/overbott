import { useContext, useState } from 'react';
import { Refresh } from '@mui/icons-material';
import {
  Box,
  ButtonGroup,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Slider,
  Grid,
} from '@mui/material';
// import { useTranslation } from 'react-i18next';
import systemPrompts from '../../../main/data/system-prompts';
import defaultEndpoints from '../../../main/data/default-endpoints';
import SelectActiveService from '../fields/SelectActiveService';
import { LanguageModelContext } from '../../providers/LanguageModelProvider';

function TextGenerationSettings() {
  const {
    llmModels,
    llmModel,
    handleSelectModel,
    fetchModels,
    modelTemperature,
    setModelTemperature,
    presencePenalty,
    setPresencePenalty,
    frequencyPenalty,
    setFrequencyPenalty,
    topP,
    setTopP,
    setLlmService,
    llmService,
    setMainModelEndpoint,
  } = useContext(LanguageModelContext);
  // const { t } = useTranslation();

  const [chatType, setChatType] = useState(
    window.electron.store.get('chatType') || 'chat-completion',
  );
  const [activeSystemPrompt, setActiveSystemPrompt] = useState(
    window.electron.store.get('systemPrompt') || 'empty',
  );
  const handleSelectPromptAgent = (event: any) => {
    window.electron.store.set('systemPrompt', event.target.value);
    setActiveSystemPrompt(event.target.value);
  };
  const handleSelectService = (event: any) => {
    const service = event.target.value as string;
    setLlmService(service);
    window.electron.store.set('llmService', service);
    if (service) {
      // @ts-ignore
      window.electron.store.set('mainModelEndpoint', defaultEndpoints[service]);
      // @ts-ignore
      setMainModelEndpoint(defaultEndpoints[service]);
      fetchModels(service);
    }

    console.log('handleService', {
      service,
    });
  };

  return (
    <Box>
      {/* Active Model: {llmModel}
      {JSON.stringify(llmModels)} */}
      <SelectActiveService
        llmService={llmService}
        handleSelectService={handleSelectService}
        fullWidth
      />
      <ButtonGroup fullWidth>
        <Button
          variant="outlined"
          size="small"
          title="Refresh models"
          sx={{
            width: '50px',
          }}
          onClick={async () => {
            fetchModels();
          }}
        >
          <Refresh />
        </Button>

        {llmModels &&
          llmModels.some(
            (m: any) => m.model === llmModel || llmModel === 'no-model',
          ) && (
            <FormControl fullWidth>
              <InputLabel id="model-select-label">Active Model</InputLabel>
              <Select
                title="Select a model"
                size="small"
                value={llmModel || 'no-model'}
                onChange={(event: any) => handleSelectModel(event)}
                fullWidth
              >
                {llmModels.length &&
                  llmModels.map((m: any, i: number) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <MenuItem value={m.model} key={i}>
                      {m.name}
                    </MenuItem>
                  ))}
                <MenuItem value="no-model">No models</MenuItem>
              </Select>
            </FormControl>
          )}
      </ButtonGroup>

      <FormControl fullWidth>
        <Box>
          <Select
            fullWidth
            startAdornment={
              <InputLabel id="system-prompt-select-label">
                System Prompt
              </InputLabel>
            }
            title="Select prompt agent"
            labelId="system-prompt-select-label"
            id="system-prompt-select"
            value={activeSystemPrompt}
            label="System Prompt"
            onChange={(event: any) => {
              handleSelectPromptAgent(event);
            }}
          >
            <MenuItem value="empty">-- Empty --</MenuItem>

            {Object.entries(systemPrompts).map(([key, value]) => (
              <MenuItem value={key} key={key}>
                {/* @ts-ignore */}
                <Tooltip title={value}>{key}</Tooltip>
              </MenuItem>
            ))}
          </Select>
        </Box>
      </FormControl>
      <FormControl fullWidth>
        <Box>
          <Select
            fullWidth
            startAdornment={
              <InputLabel id="chat-type-select-label">Chat Type</InputLabel>
            }
            title="Select chat type"
            labelId="chat-type-select-label"
            id="chat-type-select"
            value={chatType}
            label="Chat Type"
            onChange={(event: any) => {
              console.log('onChange Select chat type', event);
              window.electron.store.set('chatType', event.target.value);
              setChatType(event.target.value);
            }}
          >
            <MenuItem value="chat-completion-memory">
              Chat Completion w/ Memory
            </MenuItem>
            <MenuItem value="chat-completion">Chat Completion</MenuItem>
            <MenuItem value="completion">Legacy Completion</MenuItem>
            <MenuItem value="rag-completion">RAG Completion</MenuItem>
            <MenuItem value="vision-completion">Vision Completion</MenuItem>
          </Select>
        </Box>
      </FormControl>
      <Grid container spacing={2} p={2}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <Tooltip
              followCursor
              title="What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or top_p but not both."
            >
              <Box>
                <InputLabel id="temperature-slide-label">
                  Temperature
                </InputLabel>
                <Slider
                  aria-label="Temperature"
                  value={modelTemperature}
                  onChange={(event: any, value: any) => {
                    console.log('onChange Slider', event, value);
                    window.electron.store.set('modelTemperature', value);
                    setModelTemperature(value);
                  }}
                  step={0.1}
                  max={2}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Tooltip>
          </FormControl>
          <FormControl fullWidth>
            <Tooltip
              followCursor
              title="Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics."
            >
              <Box>
                <InputLabel id="presence-penalty-slide-label">
                  Presence Penalty
                </InputLabel>
                <Slider
                  aria-label="Presence Penalty"
                  value={presencePenalty}
                  onChange={(event: any, value: any) => {
                    console.log('onChange Slider', event, value);
                    window.electron.store.set('presencePenalty', value);
                    setPresencePenalty(value);
                  }}
                  step={0.1}
                  max={2}
                  min={-2}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Tooltip>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <Tooltip
              followCursor
              title="Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim."
            >
              <Box>
                <InputLabel id="frequency-penalty-slide-label">
                  Frequency Penalty
                </InputLabel>
                <Slider
                  aria-label="Frequency Penalty"
                  value={frequencyPenalty}
                  onChange={(event: any, value: any) => {
                    console.log('onChange Slider', event, value);
                    window.electron.store.set('frequencyPenalty', value);
                    setFrequencyPenalty(value);
                  }}
                  step={0.1}
                  max={2}
                  min={-2}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Tooltip>
          </FormControl>
          <FormControl fullWidth>
            <Tooltip
              followCursor
              title="An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. We generally recommend altering this or temperature but not both."
            >
              <Box>
                <InputLabel id="top-p-slide-label">Top P</InputLabel>
                <Slider
                  aria-label="Top P"
                  value={topP}
                  onChange={(event: any, value: any) => {
                    console.log('onChange Slider', event, value);
                    window.electron.store.set('topP', value);
                    setTopP(value);
                  }}
                  step={0.1}
                  max={1}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Tooltip>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}
export default TextGenerationSettings;
