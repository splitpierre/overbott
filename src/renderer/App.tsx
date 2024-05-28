import { useEffect } from 'react';
import AppGadget from './AppGadget';
import AppMain from './AppMain';
import './App.css';
import { AppProvider } from './providers/AppProvider';
import { ThemeContextProvider } from './providers/ThemeProvider';
import { AudioContextProvider } from './providers/AudioProvider';
import { LanguageModelProvider } from './providers/LanguageModelProvider';

function App(props: { electronWindow: 'front' | 'gadget' }) {
  const { electronWindow } = props;
  useEffect(
    () => {
      if (window.electron.store.get('appLoaded') === false) {
        window.electron.app.reactReady();
        console.log('react ready');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  if (electronWindow === 'gadget') {
    return (
      <ThemeContextProvider>
        <AppProvider>
          <AudioContextProvider>
            <LanguageModelProvider>
              <AppGadget />
            </LanguageModelProvider>
          </AudioContextProvider>
        </AppProvider>
      </ThemeContextProvider>
    );
  }
  return (
    <ThemeContextProvider>
      <AppProvider>
        <AudioContextProvider>
          <LanguageModelProvider>
            <AppMain />
          </LanguageModelProvider>
        </AudioContextProvider>
      </AppProvider>
    </ThemeContextProvider>
  );
}

export default App;
