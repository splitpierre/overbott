import { useState } from 'react';
import { Box, FormControl, TextField } from '@mui/material';

function ImageGenerationSettings() {
  const [diffusionSteps, setDiffusionSteps] = useState(
    window.electron.store.get('diffusionSteps') || 50,
  );

  return (
    <Box>
      {/* Active Model: {llmModel}
      {JSON.stringify(llmModels)} */}
      <FormControl fullWidth>
        <TextField
          type="number"
          label="Steps"
          value={diffusionSteps}
          onChange={(event: any) => {
            const numberValue = parseInt(event.target.value, 10);
            setDiffusionSteps(numberValue);
            window.electron.store.set('diffusionSteps', numberValue);
          }}
        />
      </FormControl>
    </Box>
  );
}
export default ImageGenerationSettings;
