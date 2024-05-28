import React, { useMemo } from 'react';
import { Delete, Download, Pageview, Refresh } from '@mui/icons-material';
import {
  Paper,
  Typography,
  TextField,
  Divider,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

function OllamaSettings(props: {
  mainModelEndpoint: string;
  modelTemperature: number;
  embeddingModel: string;
  setEmbeddingModel: any;
  setMainModelEndpoint: any;
  setModelTemperature: any;
  llmModels: any;
  fetchModels: any;
}) {
  const {
    mainModelEndpoint,
    modelTemperature,
    embeddingModel,
    setEmbeddingModel,
    setMainModelEndpoint,
    setModelTemperature,
    llmModels,
    fetchModels,
  } = props;

  const [newModel, setNewModel] = React.useState('');
  const navigate = useNavigate();
  const handleSubmit = async () => {
    console.log('submit', newModel);
    await OllamaProvider.ollamaPullModel(mainModelEndpoint, newModel);
  };
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  const handleSelectEmbeddingModel = (event: any) => {
    console.log('select', event.target.value);
    window.electron.store.set('embeddingModel', event.target.value);
    setEmbeddingModel(event.target.value);
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  function EmbeddingModelHelperText() {
    // const { focused } = useFormControl() || {};

    const helperText = useMemo(() => {
      if (embeddingModel === 'Xenova/all-MiniLM-L6-v2') {
        return 'all-MiniLM-L6-v2 is a sentence-transformers model: It maps sentences & paragraphs to a 384 dimensional dense vector space and can be used for tasks like clustering or semantic search.';
      }
      if (embeddingModel.includes('nomic')) {
        return 'nomic-embed-text-v1 is 8192 context length text encoder that surpasses OpenAI text-embedding-ada-002 and text-embedding-3-small performance on short and long context tasks.';
      }
      if (embeddingModel === 'native') {
        return 'This will use active chat model for embedding. Very slow and not recommended.';
      }

      return 'Select your embedding model';
    }, []);

    return <FormHelperText>{helperText}</FormHelperText>;
  }

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
          label="Ollama Endpoint"
          variant="outlined"
          value={mainModelEndpoint}
          placeholder={defaultEndpoints.ollama}
          onChange={(e: any) => {
            // handleOllamaSetting('mainModelEndpoint', e)
            setMainModelEndpoint(e.target.value);
            window.electron.store.set('mainModelEndpoint', e.target.value);
          }}
        />
        <TextField
          id="outlined-basic"
          label="Temperature"
          variant="outlined"
          value={modelTemperature}
          placeholder={defaultEndpoints.ollama}
          onChange={(e: any) => {
            // handleOllamaSetting('modelTemperature', e);
            setModelTemperature(e.target.value);
            window.electron.store.set(
              'modelTemperature',
              parseFloat(e.target.value),
            );
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
            value={embeddingModel}
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
          <EmbeddingModelHelperText />
        </FormControl>

        <Divider />
      </Paper>
      <Paper
        elevation={3}
        style={{
          padding: '10px',
          marginBottom: '10px',
        }}
      >
        {/** Mui GRID with space between, title on left, refresh button on right */}
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">{t('Models')}</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              title={t('Refresh')}
              onClick={() => {
                fetchModels();
              }}
            >
              <Refresh />
            </Button>
          </Grid>
        </Grid>
        <Typography variant="h6">{t('Manage Models')}</Typography>
        <TextField
          id="download-model"
          label={t('Type model name to download')}
          variant="outlined"
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          InputProps={{
            endAdornment: (
              <ButtonGroup>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  title={t('Download')}
                >
                  <Download />
                </Button>
              </ButtonGroup>
            ),
          }}
        />
        {/** LIST OF MODELS IN MUI TABLE */}
        <Table aria-label="ollama-models-table" size="medium">
          <TableHead>
            <TableRow>
              <TableCell>{t('Model')}</TableCell>
              <TableCell align="right">{t('Size')}</TableCell>
              <TableCell align="right">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {llmModels &&
              llmModels.length &&
              llmModels.map((m: any, i: number) => (
                // eslint-disable-next-line react/no-array-index-key
                <TableRow key={i}>
                  <TableCell component="th" scope="row">
                    {m.name}
                  </TableCell>
                  <TableCell align="right">
                    {(m.size / 1000000000).toFixed(2)} GB
                  </TableCell>

                  <TableCell align="right">
                    <ButtonGroup>
                      <Button
                        variant="contained"
                        title="View more details on ollama.ai library"
                        onClick={async () => {
                          const { name } = m;
                          window.electron.store.set(
                            'browserLastActiveURL',
                            `https://ollama.ai/library/${name}`,
                          );
                          navigate('/web-browser');
                          // const response = await fetch(
                          //   `${mainModelEndpoint}/api/show`,
                          //   {
                          //     method: 'POST',
                          //     headers: {
                          //       'Content-Type': 'application/json',
                          //     },
                          //     body: JSON.stringify({ name }),
                          //   },
                          // );
                          // console.log('show', response);
                        }}
                      >
                        <Pageview />
                      </Button>
                      <Button
                        variant="contained"
                        title={t('Delete')}
                        onClick={async () => {
                          console.log('delete');
                          const { name } = m;
                          await OllamaProvider.ollamaDeleteModel(
                            mainModelEndpoint,
                            name,
                          );
                        }}
                      >
                        <Delete />
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* {JSON.stringify(llmModels)} */}
      </Paper>
    </>
  );
}
export default OllamaSettings;
