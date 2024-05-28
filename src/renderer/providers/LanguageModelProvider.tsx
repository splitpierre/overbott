/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-no-constructed-context-values */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import defaultEndpoints from '../../main/data/default-endpoints';
import OllamaProvider from '../../main/providers/ollama';
import OpenAICompatibleProvider from '../../main/providers/openai-compatible';
import { LanguageModelContextProps } from '../../main/types/app-types';
import { AppContext } from './AppProvider';

interface LanguageModelProviderProps {
  children: ReactNode;
}

const LanguageModelContext = createContext({} as LanguageModelContextProps);

function LanguageModelProvider({
  children,
  windowInject,
  // eslint-disable-next-line react/require-default-props
}: LanguageModelProviderProps & { windowInject?: any }) {
  let activeWindow: any;
  try {
    if (window) {
      // console.log('test window', window);
    }
    activeWindow = window;
  } catch (error) {
    if (windowInject) {
      activeWindow = windowInject;
    } else {
      console.error('no window');
      throw new Error('no window');
    }
  }

  const { setIsLoading } = useContext(AppContext);
  const [embeddingModel, setEmbeddingModel] = useState(
    activeWindow.electron.store.get('embeddingModel') ||
      'Xenova/all-MiniLM-L6-v2',
  );
  const [llmService, setLlmService] = useState<string>(
    activeWindow.electron.store.get('llmService') || '',
  );
  const [mainModelEndpoint, setMainModelEndpoint] = useState(
    activeWindow.electron.store.get('mainModelEndpoint') ||
      defaultEndpoints.ollama,
  );
  const [llmModel, setLlmModel] = useState<string>(
    activeWindow.electron.store.get('llmModel') || 'no-model',
  );
  const [modelTemperature, setModelTemperature] = useState<number>(
    activeWindow.electron.store.get('modelTemperature') || 0.5,
  );
  const [presencePenalty, setPresencePenalty] = useState<number>(
    activeWindow.electron.store.get('presencePenalty') || 0,
  );
  const [frequencyPenalty, setFrequencyPenalty] = useState<number>(
    activeWindow.electron.store.get('frequencyPenalty') || 0,
  );
  const [topP, setTopP] = useState<number>(
    activeWindow.electron.store.get('topP') || 1,
  );
  const [llmModels, setLlmModels] = useState<any[]>(
    activeWindow.electron.store.get('llmModels') || [],
  );
  const handleSelectModel = (event: any) => {
    console.log('select', event.target);
    setLlmModel(event.target.value);
    activeWindow.electron.store.set('llmModel', event.target.value);
    // clear images if not llava
    if (event.target.value && !event.target.value.includes('llava')) {
      activeWindow.electron.store.set('promptImages', []);
    }
  };
  const fetchModels = useCallback(
    async (toService?: string) => {
      const currentService = toService || llmService;
      setIsLoading(true);
      if (currentService === 'claude') {
        const models = [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-2.1',
          'claude-2.0',
          'claude-instant-1.2',
        ];
        const newModelList = models.map((model) => {
          return {
            name: model,
            model,
          };
        });
        console.log('fetching claude models', newModelList);
        setLlmModels(newModelList);
        activeWindow.electron.store.set('llmModels', newModelList);
      }
      if (
        currentService &&
        (currentService === 'gpt4All' ||
          currentService === 'llamaCpp' ||
          currentService === 'openAi' ||
          currentService === 'mistralAi' ||
          currentService === 'groq')
      ) {
        console.log(`fetching ${currentService} models`);
        // @ts-ignore
        const endpoint = defaultEndpoints[currentService];

        const serviceApiKey =
          activeWindow.electron.store.get(
            // @ts-ignore
            `${currentService}ApiKey`,
          ) || 'sk-1';
        const models = await OpenAICompatibleProvider.fetchModels(
          endpoint,
          serviceApiKey,
        );
        const modelsData = models.map((model: any) => {
          return {
            name: model.id,
            model: model.id,
          };
        });
        console.log({ currentService, modelsData });
        setLlmModels(modelsData);
        activeWindow.electron.store.set('llmModels', modelsData);

        if (
          !modelsData ||
          !modelsData.some((data: any) => data.name?.includes(llmModel))
        ) {
          setLlmModel('no-model');
          activeWindow.electron.store.set('llmModel', 'no-model');
        }
        // activeWindow.electron.store.set('llmModels', modelsData);
        setIsLoading(false);
      }
      if (currentService && currentService === 'ollama') {
        const models = await OllamaProvider.fetchOllamaModels(
          defaultEndpoints.ollama,
        );
        console.log('testThis', { currentService, models });
        setLlmModels(models);
        activeWindow.electron.store.set('llmModels', models);
        if (
          !models ||
          !models.some((data: any) => data.name?.includes(llmModel))
        ) {
          setLlmModel('no-model');
          activeWindow.electron.store.set('llmModel', 'no-model');
        }
        // activeWindow.electron.store.set('llmModels', models);
        setIsLoading(false);
      }
      // if model is not in the list, set to no-model
      if (
        !llmModels.some((m: any) => m.model === llmModel) &&
        llmModels.length > 0
      ) {
        setLlmModel('no-model');
        activeWindow.electron.store.set('llmModel', 'no-model');
      }
      activeWindow.electron.store.set(
        'ollamaModelDependencies',
        activeWindow.electron.app.embedDependencies(),
      );
    },
    [llmModel, llmModels, llmService, setIsLoading],
  );

  const memoValue = useMemo(
    () => ({
      embeddingModel,
      setEmbeddingModel,
      llmService,
      setLlmService,
      mainModelEndpoint,
      setMainModelEndpoint,
      llmModel,
      setLlmModel,
      modelTemperature,
      setModelTemperature,
      presencePenalty,
      setPresencePenalty,
      frequencyPenalty,
      setFrequencyPenalty,
      topP,
      setTopP,
      llmModels,
      setLlmModels,
      handleSelectModel,
      fetchModels,
    }),
    [
      embeddingModel,
      llmService,
      mainModelEndpoint,
      llmModel,
      fetchModels,
      frequencyPenalty,
      modelTemperature,
      presencePenalty,
      llmModels,
      topP,
    ],
  );
  return (
    <LanguageModelContext.Provider value={memoValue}>
      {children}
    </LanguageModelContext.Provider>
  );
}

export { LanguageModelContext, LanguageModelProvider };
