/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react';
import { Refresh } from '@mui/icons-material';
import {
  Paper,
  Typography,
  TextField,
  Divider,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import OllamaProvider from '../../../main/providers/ollama';
import defaultEndpoints from '../../../main/data/default-endpoints';

function GPT4AllSettings(props: {
  modelTemperature: number;
  setEmbeddingModel: any;
  setModelTemperature: any;
  fetchModels: any;
}) {
  const {
    modelTemperature,
    setEmbeddingModel,
    setModelTemperature,
    fetchModels,
  } = props;

  const [newModel, setNewModel] = React.useState('');
  const navigate = useNavigate();
  const handleSelectEmbeddingModel = (event: any) => {
    console.log('select', event.target.value);
    window.electron.store.set('embeddingModel', event.target.value);
    setEmbeddingModel(event.target.value);
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  // function EmbeddingModelHelperText() {
  //   // const { focused } = useFormControl() || {};

  //   const helperText = useMemo(() => {
  //     if (embeddingModel === 'Xenova/all-MiniLM-L6-v2') {
  //       return 'all-MiniLM-L6-v2 is a sentence-transformers model: It maps sentences & paragraphs to a 384 dimensional dense vector space and can be used for tasks like clustering or semantic search.';
  //     }
  //     if (embeddingModel.includes('nomic')) {
  //       return 'nomic-embed-text-v1 is 8192 context length text encoder that surpasses OpenAI text-embedding-ada-002 and text-embedding-3-small performance on short and long context tasks.';
  //     }
  //     if (embeddingModel === 'native') {
  //       return 'This will use active chat model for embedding. Very slow and not recommended.';
  //     }

  //     return 'Select your embedding model';
  //   }, []);

  //   return <FormHelperText>{helperText}</FormHelperText>;
  // }

  return (
    <>
      {' '}
      <Paper
        elevation={3}
        style={{
          padding: '10px',
          marginBottom: '10px',
        }}
      >
        <Typography variant="h6">Service Settings</Typography>
        <TextField
          id="outlined-basic"
          label="Endpoint"
          variant="outlined"
          disabled
          value={defaultEndpoints.gpt4All}
          placeholder={defaultEndpoints.gpt4All}
          // onChange={(e: any) => {
          //   // handleOllamaSetting('mainModelEndpoint', e)
          //   setOllamaEndpoint(e.target.value);
          //   window.electron.store.set('mainModelEndpoint', e.target.value);
          // }}
        />
        <TextField
          id="outlined-basic"
          label="Temperature"
          variant="outlined"
          value={modelTemperature}
          placeholder={defaultEndpoints.gpt4All}
          onChange={(e: any) => {
            // handleOllamaSetting('modelTemperature', e);
            setModelTemperature(e.target.value);
            window.electron.store.set('modelTemperature', e.target.value);
          }}
        />
        <FormControl>
          {/** Select for embeddingModel */}
          <InputLabel id="embedding-model-select-label">
            Embedding Model
          </InputLabel>

          <Select
            title="Select embedding model"
            labelId="embedding-model-select-label"
            id="embedding-model-select"
            // value={embeddingModel}
            disabled
            label="Service"
            onChange={(event: any) => handleSelectEmbeddingModel(event)}
          >
            <MenuItem value="Xenova/all-MiniLM-L6-v2">
              Hugging Face - Transformers.js (Xenova/all-MiniLM-L6-v2)
            </MenuItem>
            <MenuItem value="nomic-embed-text:latest">
              Ollama (nomic-embed-text:latest)
            </MenuItem>
            <MenuItem value="native">
              Model Embedding (Not recommended)
            </MenuItem>
          </Select>
          {/* <EmbeddingModelHelperText /> */}
        </FormControl>

        <Divider />
      </Paper>
    </>
  );
}
export default GPT4AllSettings;
