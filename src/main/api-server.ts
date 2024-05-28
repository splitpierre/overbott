/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import path from 'path';
// import { IpcRendererEvent, ipcRenderer, ipcMain } from 'electron';
import LocalStorage from './providers/local-storage';
// import { resolveHtmlPath } from './helpers/util';
// import { ExposedApp } from '../renderer/AppExposed';
import handleStartStream from './electron/ipc-events/ipc-provider';
import { LangchainProviderV2 } from './providers/langchain-v2';
// import Form from './testform';
// import { Channels, ElectronStoreHandles } from './types/app-types';

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');

const releasePath = path.join(rootPath, 'release');
const appPath = path.join(releasePath, 'app');
const appPackagePath = path.join(appPath, 'package.json');
const appNodeModulesPath = path.join(appPath, 'node_modules');
const srcNodeModulesPath = path.join(srcPath, 'node_modules');

const distPath = path.join(appPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');

const buildPath = path.join(releasePath, 'build');
// @ts-ignore
global.electron = {
  store: LocalStorage,
  chat: {
    stream: (message: string) => {
      console.log('stream', message);
      return handleStartStream(null, message);
    },
  },
};
console.log('eval paths', {
  rootPath,
  dllPath,
  srcPath,
  srcMainPath,
  srcRendererPath,
  releasePath,
  appPath,
  appPackagePath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRendererPath,
  buildPath,
});
const appServer = express();
const preloadScriptPath = path.join(__dirname, '../../../.erb/dll/preload.js');
// Custom middleware to inject preload script
function injectPreloadScript(req: any, res: any, next: () => void) {
  const originalSend = res.send;
  res.send = function (body: any) {
    // If the response is HTML
    if (
      res.getHeader('Content-Type') &&
      res.getHeader('Content-Type').includes('text/html')
    ) {
      // Inject the preload script before </head> tag
      const modifiedBody = body
        .toString()
        .replace(
          '</head>',
          `<script src="${preloadScriptPath}"></script></head>`,
        );
      console.log('modifiedBody', modifiedBody);
      // res.setHeader('Content-Length', Buffer.byteLength(modifiedBody)); // Update content length
      return originalSend.call(this, modifiedBody); // Send modified body
    }
    // For non-HTML responses, send the original body
    return originalSend.call(this, body);
  };
  next();
}

// appServer.use(injectPreloadScript);
// appServer.use(express.static(`${distRendererPath}`));
if (LocalStorage.get('exposeApi')) {
  appServer.listen(4892, () => console.log('Server running on port 4892'));
  appServer.get('/models', (req, res) => {
    res.send(LocalStorage.get('llmModels'));
  });
  appServer.get('/chat/:message', async (req, res) => {
    console.log('chat', req.params);
    const { message } = req.params;
    res.send(await LangchainProviderV2.chatCompletion(message, false));

    // res.redirect('/');
    // res.send(await LangchainProviderV2.chatCompletion(message, false));
  });
  // appServer.get('/', (req, res) => {
  //   const formHtml = ReactDOMServer.renderToString(React.createElement(Form));
  //   res.send(`
  //   <html>
  //     <head>
  //       <title>Server-Side Rendered Form</title>
  //     </head>
  //     <body>
  //       ${formHtml}
  //     </body>
  //   </html>
  // `);
  // });
  /**
   * Redirects to localhost:1212
   * - Won't work, 1212 does not exists when app is packaged
   * - Even if we could, we would need tricks to inject the window object
   */
  // appServer.get('/', (req, res: any) => {
  //   res.redirect('http://localhost:1212');
  // });

  /**
   * Server Side Rendering (SSR)
   * Does not react/integrate well with the components designed to work with electron:
   * - window is not defined
   * - Buttons do not work
   * - Would need adaptation for SSR versions of the components
   * */
  // appServer.get('/', (req, res) => {
  //   const html = ReactDOMServer.renderToString(
  //     React.createElement(ExposedApp, {
  //       electronWindow: 'front',
  //       localStorage: LocalStorage,
  //     }),
  //   );
  //   res.send(html);
  // });
}
