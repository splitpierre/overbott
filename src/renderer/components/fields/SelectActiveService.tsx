import { InfoRounded } from '@mui/icons-material';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function SelectActiveService(props: {
  llmService: string;
  handleSelectService: any;
  // eslint-disable-next-line react/require-default-props
  fullWidth?: boolean;
}) {
  const { llmService, handleSelectService, fullWidth } = props;
  const navigate = useNavigate();

  return (
    <FormControl fullWidth={!!fullWidth}>
      <InputLabel id="service-select-label">Active Service</InputLabel>
      <Select
        labelId="service-select-label"
        id="service-select"
        startAdornment={
          <InfoRounded
            titleAccess="View Pricing"
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              if (llmService === 'mistralAi')
                window.electron.store.set(
                  'browserLastActiveURL',
                  'https://docs.mistral.ai/platform/pricing/',
                );
              if (llmService === 'openAi')
                window.electron.store.set(
                  'browserLastActiveURL',
                  'https://openai.com/pricing',
                );
              if (llmService === 'claude')
                window.electron.store.set(
                  'browserLastActiveURL',
                  'https://www.anthropic.com/api',
                );

              navigate('/web-browser');
            }}
          />
        }
        value={llmService}
        label="Service"
        size="small"
        onChange={(event: any) => handleSelectService(event)}
      >
        <MenuItem value="llamaCpp">Llama CPP (Default)</MenuItem>
        <MenuItem value="openAi">Open AI (openai.com)</MenuItem>
        <MenuItem value="gpt4All">GPT4All Server</MenuItem>
        <MenuItem value="ollama">Ollama (ollama.ai)</MenuItem>
        <MenuItem value="localai">Local AI (localai.io)</MenuItem>
        <MenuItem value="mistralAi">Mistral AI (mistral.ai)</MenuItem>
        <MenuItem value="groq">Groq (groq.com)</MenuItem>
        <MenuItem value="claude">Anthropic Claude</MenuItem>
      </Select>
    </FormControl>
  );
}
export default SelectActiveService;
