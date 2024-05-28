import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import App from './App';
// import Gadget from './Gadget';
import translations from '../main/data/i18n-translations';

const container = document.getElementById('root') as HTMLElement;
const gadgetContainer = document.getElementById('app') as HTMLElement;
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: translations,
    lng: window.electron.store.get('language') || 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
if (container) {
  const root = createRoot(container);
  root.render(<App electronWindow="front" />);
}
if (gadgetContainer) {
  const gadgetRoot = createRoot(gadgetContainer);
  gadgetRoot.render(<App electronWindow="gadget" />);
}
