import { ipcMain, dialog, shell, screen } from 'electron';
import {
  calculateCPUUsage,
  calculateMemoryUsage,
  getAssetPath,
  isLinux,
  isMac,
  isWindows,
  resolveHtmlPath,
} from '../../helpers/util';
// import { downloadMdDocumentation } from '../../providers/langchain';
import WindowManager from '../window-manager';
import LocalStorage from '../../providers/local-storage';
import { LangchainProviderV2 } from '../../providers/langchain-v2';

const gadgetDefaultSize = { width: 450, height: 350 };
// os system usage
ipcMain.on('system-usage', async (event) => {
  const cpuUsage = calculateCPUUsage();
  const memUsage = calculateMemoryUsage();
  event.returnValue = { cpuUsage, memUsage };
});
// ipcMain.handle('transformers:run', run);
// ipcMain.on('download-md-docs', async (event, repo) => {
//   const response = await downloadMdDocumentation(repo, './docs');
//   event.returnValue = response;
//   // if (mainWindow) {
//   //   mainWindow.webContents.send('chat', message);
//   // }
// });

ipcMain.on('drag-window', (event, { offsetX, offsetY }) => {
  const gadgetWindow = WindowManager.getGadgetWindow();

  if (gadgetWindow) {
    const position = gadgetWindow.getPosition();
    gadgetWindow.setPosition(position[0] + offsetX, position[1] + offsetY);
  }
});

// maximize main
ipcMain.on('maximize-main', () => {
  const mainWindow = WindowManager.getMainWindow();

  if (mainWindow) {
    mainWindow.maximize();
  }
});

// ipc show error
ipcMain.on('dialog-error', (event, title, error) => {
  console.error('dialog-error', error);
  dialog.showErrorBox(title, error);
});
// ipc show message
ipcMain.on('dialog-message', (event, title, message) => {
  dialog.showMessageBox({ title, message });
});

// ipc shell open external
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});
// ipc get asset path
ipcMain.on('electron-asset-path', (event, val) => {
  // console.log('asset-path-test', val);
  event.returnValue = getAssetPath(val);
});

// ipcMain.on('ipc-example', async (event, arg) => {
//   const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
//   console.log(msgTemplate(arg));
//   event.reply('ipc-example', msgTemplate('pong'));
// });
// ipcMain.on('app-reload', () => {
//   if (mainWindow) {
//     mainWindow.reload();
//   }
// });
// ipcMain.on('drag-window', (event, { offsetX, offsetY }) => {
//   if (mainWindow) {
//     const position = mainWindow.getPosition();
//     console.log('position', position);
//     mainWindow.setPosition(position[0] + offsetX, position[1] + offsetY);
//   }
// });
// expand gadget height
ipcMain.on('expand-gadget', () => {
  const gadgetWindow = WindowManager.getGadgetWindow();

  const display = screen.getPrimaryDisplay();
  const { height } = display.bounds;
  if (gadgetWindow) {
    // gadgetWindow.loadURL(resolveHtmlPath('gadget.html'));
    gadgetWindow.setSize(gadgetDefaultSize.width, height - 200);
  }
});
// collapse gadget height
ipcMain.on('collapse-gadget', () => {
  const gadgetWindow = WindowManager.getGadgetWindow();

  if (gadgetWindow) {
    // gadgetWindow.loadURL(resolveHtmlPath('gadget.html'));
    gadgetWindow.setResizable(true);
    gadgetWindow.setSize(gadgetDefaultSize.width, gadgetDefaultSize.height);
    gadgetWindow.setResizable(false);
  }
});
// close-gadget
ipcMain.on('close-gadget', () => {
  const gadgetWindow = WindowManager.getGadgetWindow();

  if (gadgetWindow) {
    gadgetWindow.setResizable(true);
    gadgetWindow.setSize(gadgetDefaultSize.width, gadgetDefaultSize.height);
    gadgetWindow.setResizable(false);
    gadgetWindow.hide();
  }
});
// reload-gadget
ipcMain.on('reload-gadget', () => {
  const gadgetWindow = WindowManager.getGadgetWindow();

  if (gadgetWindow) {
    gadgetWindow.reload();
  }
});
// reload-main
ipcMain.on('reload-main', () => {
  const mainWindow = WindowManager.getMainWindow();

  if (mainWindow) {
    mainWindow.reload();
  }
});
// close-main
ipcMain.on('close-main', () => {
  const mainWindow = WindowManager.getMainWindow();

  if (mainWindow) {
    mainWindow.loadURL(resolveHtmlPath('index.html'));
    mainWindow.hide();
  }
});
ipcMain.on('open-main', () => {
  const mainWindow = WindowManager.getMainWindow();
  const gadgetWindow = WindowManager.getGadgetWindow();

  if (gadgetWindow) gadgetWindow.hide();
  if (mainWindow) {
    // mainWindow.loadURL('/');
    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.show();
    mainWindow.reload();
  }
});
ipcMain.on('app-reload', () => {
  const mainWindow = WindowManager.getMainWindow();
  const gadgetWindow = WindowManager.getGadgetWindow();

  mainWindow?.reload();
  gadgetWindow?.reload();
});

// is mac
ipcMain.on('app-is-mac', (event) => {
  event.returnValue = isMac;
});
// is windows
ipcMain.on('app-is-windows', (event) => {
  event.returnValue = isWindows;
});
// is linux
ipcMain.on('app-is-linux', (event) => {
  event.returnValue = isLinux;
});

// openInEditor
ipcMain.on('open-in-editor', () => {
  LocalStorage.openInEditor();
});

// react-ready
ipcMain.on('react-ready', async () => {
  const mainWindow = WindowManager.getMainWindow();
  const splashScreenWindow = WindowManager.getSplashScreenWindow();
  if (mainWindow && splashScreenWindow) {
    mainWindow.show();
    mainWindow.maximize();
    splashScreenWindow.hide();
    LocalStorage.set('appLoaded', true);
  }
});

// test-function
ipcMain.on('test-function', async (event, f) => {
  console.log('test-function', f);
  const response = await LangchainProviderV2.prepareMessagesForRAG(f);
  console.log('test-function-response', response);
  event.returnValue = response;
});

// function generateStreamingDataChunk() {
//   return 'This is a chunk of streaming data\n';
// }

// function startStreamingData() {
//   const mainWindow = WindowManager.getMainWindow();

//   setInterval(() => {
//     // const chunk = OllamaProvider.ollamaGenerate('http://127.0.0.1:11434', {
//     //   model: 'llama2:latest',
//     //   prompt: 'The quick brown fox jumps over the lazy dog',
//     //   options: {
//     //     temperature: 1,
//     //   },
//     // }); // Function to generate a chunk of streaming data
//     // mainWindow?.webContents.send('streaming-data', chunk);

//     setInterval(() => {
//       const chunk = generateStreamingDataChunk(); // Function to generate a chunk of streaming data
//       mainWindow?.webContents.send('streaming-data', chunk);
//     }, 1000); // Send a new chunk every second
//   }, 1000); // Send a new chunk every second
// }

// ipcMain.on('start-stream', (event, arg) => {
//   startStreamingData();
// });
