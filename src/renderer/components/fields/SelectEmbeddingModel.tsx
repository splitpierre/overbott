import { Info } from '@mui/icons-material';
import {
  FormControl,
  Box,
  InputLabel,
  Select,
  Tooltip,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useMemo } from 'react';

function SelectEmbeddingModel(props: {
  embeddingModel: string;
  handleSelectEmbeddingModel: any;
  // eslint-disable-next-line react/require-default-props
  fullWidth?: boolean;
}) {
  const { embeddingModel, handleSelectEmbeddingModel, fullWidth } = props;
  // eslint-disable-next-line react/no-unstable-nested-components
  function EmbeddingModelHelperText() {
    // const { focused } = useFormControl() || {};

    const helperText = useMemo(() => {
      if (embeddingModel === 'Xenova/all-MiniLM-L6-v2') {
        return 'all-MiniLM-L6-v2 is a sentence-transformers model: It maps sentences & paragraphs to a 384 dimensional dense vector space and can be used for tasks like clustering or semantic search.';
      }
      // eslint-disable-next-line react/prop-types
      if (embeddingModel.includes('nomic')) {
        return 'nomic-embed-text-v1 is 8192 context length text encoder that surpasses OpenAI text-embedding-ada-002 and text-embedding-3-small performance on short and long context tasks.';
      }
      if (embeddingModel === 'native') {
        return 'This will use active chat model for embedding. Not recommended overall, specially on CPU only.';
      }

      return 'Select your embedding model';
    }, []);

    return <FormHelperText>{helperText}</FormHelperText>;
  }
  return (
    <FormControl fullWidth={fullWidth}>
      <Box>
        <InputLabel id="embedding-model-select-label">
          Select embedding model
        </InputLabel>
        <Select
          fullWidth={fullWidth}
          startAdornment={
            <Tooltip title={<EmbeddingModelHelperText />}>
              <Info />
            </Tooltip>
          }
          // startAdornment={
          //   <InputLabel id="embedding-model-select-label">
          //     Select embedding model
          //   </InputLabel>
          // }
          title="Select embedding model"
          labelId="embedding-model-select-label"
          id="embedding-model-select"
          value={embeddingModel}
          label="Service"
          onChange={(event: any) => handleSelectEmbeddingModel(event)}
        >
          <MenuItem value="Xenova/all-MiniLM-L6-v2">
            HF Transformers (Xenova/all-MiniLM-L6-v2)
          </MenuItem>
          <MenuItem
            value="nomic-embed-text:latest"
            disabled={
              !window.electron.store.get('ollamaModelDependencies') ||
              !window.electron.store.get('ollamaModelDependencies').hasEmbed
            }
          >
            Ollama (nomic-embed-text:latest)
          </MenuItem>
          <MenuItem value="native">Model Embedding (Native model)</MenuItem>
        </Select>
      </Box>
    </FormControl>
  );
}
export default SelectEmbeddingModel;
