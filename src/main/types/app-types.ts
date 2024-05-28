import React from 'react';

type AppPreset = {
  name: string;
  appPreferences?: {
    theme?:
      | 'overBott'
      | 'bluePink'
      | 'deepPurple'
      | 'midnightBlue'
      | 'dracula'
      | 'forestGreen';
    themeMode?: 'light' | 'dark';
    language?: 'en' | 'es' | 'fr' | 'pt';
  };
  modelPreferences: {
    chatModel: string;
    completionModel?: string;
    ragModel?: string;
    embeddingModel?: string;
    temperature?: number;
    maxTokens?: number;
    contextWindow?: number;
  };
  diffuserPreferences?: {
    diffuserModel?: string;
    diffuserPipeline?: string;
    diffuserScheduler?: string;
    safetyCheck?: boolean;
    inferenceSteps?: number;
    guidanceScale?: number;
    width?: number;
    height?: number;
    seed?: number;
  };
};
type SelectModel = {
  name: string;
  model: string;
};

type ChatTypes =
  | 'chat-completion'
  | 'completion'
  | 'chat-completion-memory'
  | 'vision-completion'
  | 'rag-completion';

type AudioHandles = 'messagePop' | 'refresh' | 'hover';

type ContextTypes = 'text' | 'image' | 'directory' | 'pdf' | 'empty';

type ChatLogMessage = {
  id: string;
  message: string;
  author: 'assistant' | 'user' | 'system';
  model?: string;
  timestamp?: string;
  duration?: number;
  generationData?: any;
};
interface TabPanelProps {
  // eslint-disable-next-line react/require-default-props
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface AppContextProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  filePaths: string[];
  setFilePaths: (filePaths: string[]) => void;
  imageList: (string | ArrayBuffer | null)[];
  setImageList: (imageList: (string | ArrayBuffer | null)[]) => void;
  displaySearchChat: boolean;
  setDisplaySearchChat: (displaySearchChat: boolean) => void;
  searchChatText: string;
  setSearchChatText: (searchChatText: string) => void;
  servicesStatus: any;
  setServicesStatus: (servicesStatus: any) => void;
  executionDescription: string;
  setExecutionDescription: (executionDescription: string) => void;
  chatMessages: ChatLogMessage[];
  setChatMessages: (chatMessages: ChatLogMessage[]) => void;
  ytVideoId: string;
  setYtVideoId: (ytVideoId: string) => void;
  contextType: ContextTypes;
  setContextType: (contextType: ContextTypes) => void;
  showTest: boolean;
  testState: string;
  setTestState: (testState: string) => void;
  handleTestFunction: () => void;
  testResponse: any;
  setTestResponse: (testResponse: any) => void;
  setShowTest: (showTest: boolean) => void;
  exposeApi: boolean;
  setExposeApi: (exposeApi: boolean) => void;
}
interface AudioContextProps {
  shouldPlayAudioEffects: boolean;
  audioSource: HTMLAudioElement;
  setAudioSource: (audioSource: HTMLAudioElement) => void;
  setAudioIsPlaying: (audioIsPlaying: boolean) => void;
  playAudio: (audio: AudioHandles) => void;
  setAudioSpeechSource: (audioSpeechSource: HTMLAudioElement) => void;
  audioSpeechSource: HTMLAudioElement;
  playAudioSpeech: (audio: string) => void;
  stopAudioSpeech: () => void;
  audioIsPlaying: boolean;
}
interface ThemeContextProps {
  themeMode: 'dark' | 'light';
  setThemeMode: (themeMode: 'dark' | 'light') => void;
  colorScheme: any;
  open: boolean;
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
  customThemeMain: any;
  customThemeGadget: any;
}

interface LanguageModelContextProps {
  handleSelectModel: (event: any) => void;
  llmModels: SelectModel[];
  setLlmModels: (llmModels: SelectModel[]) => void;
  fetchModels: (toService?: string) => void;
  llmModel: string;
  setLlmModel: (llmModel: string) => void;
  mainModelEndpoint: string;
  setMainModelEndpoint: (mainModelEndpoint: string) => void;
  llmService: string;
  setLlmService: (llmService: string) => void;
  modelTemperature: number;
  setModelTemperature: (modelTemperature: number) => void;
  presencePenalty: number;
  setPresencePenalty: (presencePenalty: number) => void;
  frequencyPenalty: number;
  setFrequencyPenalty: (frequencyPenalty: number) => void;
  topP: number;
  setTopP: (topP: number) => void;
  embeddingModel: string;
  setEmbeddingModel: (embeddingModel: string) => void;
}

type ElectronStoreHandles =
  | 'servicesStatus'
  | 'ollamaModelDependencies'
  // llmHandles
  | 'mainModelEndpoint'
  | 'mainServiceApiKey'
  | 'claudeApiKey'
  | 'mistralAiApiKey'
  | 'openAiApiKey'
  | 'groqApiKey'
  | 'cohereAiApiKey'
  | 'llmModels'
  | 'apiKeys'
  | 'llmModel'
  | 'modelTemperature'
  | 'presencePenalty'
  | 'frequencyPenalty'
  | 'topP'
  // diffusionHandles
  | 'diffusionModel'
  | 'diffusionPipeline'
  | 'diffusionScheduler'
  | 'diffusionSafetyCheck'
  | 'diffusionSteps'
  // appStateHandles
  | 'exposeApi'
  | 'chatType'
  | 'systemPrompt'
  | 'playAudioEffects'
  | 'audioResponse'
  | 'appLoaded'
  | 'isLoading'
  | 'dockerIsLoading'
  | 'promptImages'
  | 'promptContextFile'
  | 'streamResponse'
  | 'dockerStream'
  | 'chatMessages'
  | 'totalTokens'
  | 'browserLastActiveURL'
  | 'executionDescription'
  // settingHandles
  | 'themeMode'
  | 'colorScheme'
  | 'llmService'
  | 'embeddingModel'
  | 'language'
  // spotifyHandles
  | 'spotifyUri'
  | 'spotifyAuthCode'
  | 'spotifyClientId'
  | 'spotifyClientSecret'
  | 'spotifyAccessToken';

type Channels =
  | 'drag-window'
  | 'electron-store-get'
  | 'electron-store-set'
  | 'app-reload'
  | 'asset-path'
  | 'open-external'
  | 'stop'
  | 'ollama-reboot'
  | 'close-gadget'
  | 'expand-gadget'
  | 'collapse-gadget'
  | 'chat'
  | 'close-main'
  | 'download-md-docs'
  | 'dialog-error';

export type {
  ChatLogMessage,
  ElectronStoreHandles,
  TabPanelProps,
  Channels,
  ContextTypes,
  AudioHandles,
  AppPreset,
  ChatTypes,
  SelectModel,
  AppContextProps,
  ThemeContextProps,
  AudioContextProps,
  LanguageModelContextProps,
};
// export default electronStoreHandlesPossible;
