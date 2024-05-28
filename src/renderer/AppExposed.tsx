/* eslint-disable @typescript-eslint/no-unused-vars */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AppProvider } from './providers/AppProvider';
import { LanguageModelProvider } from './providers/LanguageModelProvider';
import { ThemeContextProvider } from './providers/ThemeProvider';
import translations from '../main/data/i18n-translations';
import AppGadgetExposed from './AppGadgetExposed';

declare const global: any;

const window = {
  electron: {
    chat: {
      stream: (message: string) => {
        return global.electron.chat.stream(message);
      },
    },
    store: {
      get: (key: string) => {
        return global.electron.store.get(key);
      },
      set: (key: string, value: any) => {
        return global.electron.store.set(key, value);
      },
      clear: () => {
        return global.electron.store.clear();
      },
    },
  },
};
//

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: translations,
    lng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

function ExposedApp() {
  console.log('ExposedApp', { global, window });
  return (
    <ThemeContextProvider windowInject={window}>
      <AppProvider windowInject={window}>
        <LanguageModelProvider windowInject={window}>
          <AppGadgetExposed windowInject={window} />
        </LanguageModelProvider>
      </AppProvider>
    </ThemeContextProvider>
  );
}

export { ExposedApp, window };
