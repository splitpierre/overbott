/* eslint-disable react/jsx-no-constructed-context-values */
import {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  ChatLogMessage,
  ContextTypes,
  AppContextProps,
} from '../../main/types/app-types';

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext({} as AppContextProps);

function AppProvider({
  children,
  windowInject,
  // eslint-disable-next-line react/require-default-props
}: AppProviderProps & { windowInject?: any }) {
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

  const [exposeApi, setExposeApi] = useState<boolean>(
    activeWindow.electron.store.get('exposeApi') || false,
  );
  const [executionDescription, setExecutionDescription] = useState(
    activeWindow.electron.store.get('executionDescription') || '',
  );
  const [displaySearchChat, setDisplaySearchChat] = useState<boolean>(false);
  const [searchChatText, setSearchChatText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatLogMessage[]>(
    activeWindow.electron.store.get('chatMessages') || [],
  );
  const [servicesStatus, setServicesStatus] = useState(
    activeWindow.electron.store.get('servicesStatus') || {},
  );
  const [ytVideoId, setYtVideoId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [contextType, setContextType] = useState<ContextTypes>('empty');
  const [imageList, setImageList] = useState<(string | ArrayBuffer | null)[]>(
    [],
  );
  const [filePaths, setFilePaths] = useState(
    activeWindow.electron.store.get('promptContextFile') || [],
  );

  const [showTest, setShowTest] = useState(false);
  const [testState, setTestState] = useState('what is my name?');
  const [testResponse, setTestResponse] = useState<any>();

  const handleTestFunction = useCallback(async () => {
    console.log('test function');
    setTestResponse(await activeWindow.electron.app.testFunction(testState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState]);

  const memoValue = useMemo(
    () => ({
      executionDescription,
      setExecutionDescription,
      displaySearchChat,
      setDisplaySearchChat,
      searchChatText,
      setSearchChatText,
      chatMessages,
      setChatMessages,
      servicesStatus,
      setServicesStatus,
      ytVideoId,
      setYtVideoId,
      isLoading,
      setIsLoading,
      contextType,
      setContextType,
      imageList,
      setImageList,
      filePaths,
      setFilePaths,
      showTest,
      setShowTest,
      testState,
      setTestState,
      handleTestFunction,
      testResponse,
      setTestResponse,
      exposeApi,
      setExposeApi,
    }),
    [
      executionDescription,
      displaySearchChat,
      searchChatText,
      chatMessages,
      servicesStatus,
      ytVideoId,
      isLoading,
      contextType,
      imageList,
      filePaths,
      handleTestFunction,
      showTest,
      testResponse,
      testState,
      exposeApi,
    ],
  );
  return (
    <AppContext.Provider value={memoValue}>{children}</AppContext.Provider>
  );
}

export { AppContext, AppProvider };
