import { useContext } from 'react';
import { Box, FormControl } from '@mui/material';
import SelectEmbeddingModel from '../fields/SelectEmbeddingModel';
import { LanguageModelContext } from '../../providers/LanguageModelProvider';

function RAGSettings() {
  const { embeddingModel, setEmbeddingModel } =
    useContext(LanguageModelContext);

  const handleSelectEmbeddingModel = (event: any) => {
    window.electron.store.set('embeddingModel', event.target.value);
    setEmbeddingModel(event.target.value);
  };
  return (
    <Box>
      {/* Active Model: {llmModel}
      {JSON.stringify(llmModels)} */}
      <FormControl fullWidth>
        <SelectEmbeddingModel
          embeddingModel={embeddingModel}
          handleSelectEmbeddingModel={handleSelectEmbeddingModel}
          fullWidth
        />
      </FormControl>
    </Box>
  );
}
export default RAGSettings;
