import Store from 'electron-store';
import { ElectronStoreHandles } from '../types/app-types';

const store = new Store();

export default class LocalStorage {
  public static set(key: ElectronStoreHandles, value: any) {
    store.set(key, value);
  }

  public static get(key: ElectronStoreHandles) {
    return store.get(key);
  }

  public static openInEditor() {
    store.openInEditor();
  }

  public static clear() {
    store.clear();
  }
}
