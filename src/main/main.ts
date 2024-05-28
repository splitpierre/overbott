/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, Menu, Tray, globalShortcut, protocol } from 'electron';
import dotenv from 'dotenv';
// import { autoUpdater } from 'electron-updater';
// import log from 'electron-log';
// import fileUrl from 'file-url';
// import * as Splashscreen from '@trodi/electron-splashscreen';
import { getAssetPath } from './helpers/util';
import WindowManager from './electron/window-manager';
import LocalStorage from './providers/local-storage';
import ServiceStatus from './providers/service-status';
import './electron/ipc-events/ipc-app';
import './electron/ipc-events/ipc-ollama';
import './electron/ipc-events/ipc-provider';
import './electron/ipc-events/ipc-docker';
import './api-server';

// class AppUpdater {
//   constructor() {
//     log.transports.file.level = 'info';
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }
dotenv.config();
let tray;
LocalStorage.set('appLoaded', false);
if (LocalStorage.get('playAudioEffects') === undefined)
  LocalStorage.set('playAudioEffects', true);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}
// LocalStorage.clear();
const isDebug = true;
// process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  // require('react-devtools-electron');

  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

function createTray() {
  if (isDebug) installExtensions();
  const gadgetWindow = WindowManager.getGadgetWindow();
  const mainWindow = WindowManager.getMainWindow();
  const splashWindow = WindowManager.getSplashScreenWindow();

  // Create and load the tray icon
  tray = new Tray(getAssetPath('bot.png'));

  // Optionally, you can add a context menu to the tray icon
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open OverBott',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.reload();
        }
      },
    },
    {
      label: 'OverBott Overlay',
      click: () => {
        if (gadgetWindow) {
          gadgetWindow.show();
          gadgetWindow.reload();
        }
      },
    },
    {
      label: 'Splash Screen',
      click: () => {
        if (splashWindow) {
          splashWindow.show();
          // splashWindow.reload();
        }
      },
    },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip('OverBott');
  tray.setContextMenu(contextMenu);
  globalShortcut.register('CommandOrControl+K', () => {
    if (gadgetWindow) {
      gadgetWindow.show();
      gadgetWindow.reload();
    }
  });
  mainWindow?.hide();
  gadgetWindow?.hide();
}

app
  .whenReady()
  .then(async () => {
    const status = await ServiceStatus.checkAll();
    const ollamaModelDependencies =
      await ServiceStatus.checkOllamaModelDependencies();
    LocalStorage.set('ollamaModelDependencies', ollamaModelDependencies);
    LocalStorage.set('servicesStatus', status);
    WindowManager.createSplashScreenWindow();
    protocol.registerFileProtocol('media-loader', (request, callback) => {
      const url = request.url.replace('media-loader://', '');
      try {
        return callback({ path: url });
      } catch (error) {
        console.error('Failed to register protocol');
        console.error(error);
        return callback('404');
      }
    });
    // delay 3 seconds to show splash screen
    console.log('created tray');
    WindowManager.createMainWindow();
    WindowManager.createGadgetWindow();
    createTray();
    // WindowManager.getMainWindow()?.show();

    // app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // if (mainWindow === null) mainWindow = new MainWindow();
    // });
  })
  .catch(console.log);
