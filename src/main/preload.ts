import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Channels, ElectronStoreHandles } from './types/app-types';

const electronHandler = {
  docs: {
    download: (repoUrl: string) => {
      return ipcRenderer.sendSync('download-md-docs', repoUrl);
    },
  },
  chat: {
    send: (message: string) => {
      return ipcRenderer.sendSync('chat', message);
    },
    sendWithContext: (message: string, context: string) => {
      return ipcRenderer.sendSync('chat-with-context', message, context);
    },
    stream: (message: string) => {
      return ipcRenderer.invoke('start-stream', message);
    },
    stopStream: () => {
      return ipcRenderer.send('stop-stream');
    },
  },
  docker: {
    start: (service: string) => ipcRenderer.send('docker-start', service),
    stop: (service: string) => ipcRenderer.send('docker-stop', service),
    reload: (service: string) => ipcRenderer.send('docker-reload', service),
    remove: (service: string) => ipcRenderer.send('docker-remove', service),
    inspect: (service: string) => ipcRenderer.send('docker-inspect', service),
    listImages: () => ipcRenderer.send('docker-list-images'),
    streamLogs: (service: string) =>
      ipcRenderer.send('docker-stream-logs', service),
  },
  main: {
    // openSettings: () => ipcRenderer.send('open-settings'),
    openMain: () => ipcRenderer.send('open-main'),
    closeMain: () => ipcRenderer.send('close-main'),
    maximize: () => ipcRenderer.send('maximize-main'),
    reload: () => ipcRenderer.send('reload-main'),
  },
  gadget: {
    close: () => ipcRenderer.send('close-gadget'),
    expand: () => ipcRenderer.send('expand-gadget'),
    collapse: () => ipcRenderer.send('collapse-gadget'),
    drag: (offsetX: number, offsetY: number) => {
      ipcRenderer.send('drag-window', { offsetX, offsetY });
    },
    reload: () => ipcRenderer.send('reload-gadget'),
  },
  ollama: {
    reboot: () => ipcRenderer.send('ollama-reboot'),
    start: () => ipcRenderer.send('ollama-start'),
    stop: () => ipcRenderer.send('ollama-stop'),
  },
  dialog: {
    error: (title: string, message: string) =>
      ipcRenderer.send('dialog-error', title, message),
    message: (title: string, message: string) =>
      ipcRenderer.send('dialog-message', title, message),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.send('open-external', url),
  },
  app: {
    testFunction: (f: any) => ipcRenderer.sendSync('test-function', f),
    reactReady: () => ipcRenderer.send('react-ready'),
    reload: () => ipcRenderer.send('app-reload'),
    isMac: () => ipcRenderer.sendSync('app-is-mac'),
    isWindows: () => ipcRenderer.sendSync('app-is-windows'),
    isLinux: () => ipcRenderer.sendSync('app-is-linux'),
    systemUsage: () => ipcRenderer.sendSync('system-usage'),
    servicesStatus: () => ipcRenderer.sendSync('services-status'),
    embedDependencies: () => ipcRenderer.sendSync('embed-dependencies'),
    // run: (text: string) => ipcRenderer.invoke('transformers:run', text),
  },
  asset: {
    path: (name: string) => {
      return ipcRenderer.sendSync('electron-asset-path', name);
    },
  },
  store: {
    get(key: ElectronStoreHandles) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property: ElectronStoreHandles, val: unknown) {
      ipcRenderer.send('electron-store-set', property, val);
    },
    openInEditor: () => ipcRenderer.send('open-in-editor'),
    clear: () => {
      ipcRenderer.send('clear-store');
    },
  },
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
window.require = require;
