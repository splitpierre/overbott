import { ipcMain } from 'electron';
import * as UUID from 'uuid';
import LocalStorage from '../../providers/local-storage';
import ServiceStatus from '../../providers/service-status';
import { ChatTypes } from '../../types/app-types';
import {
  LangchainProviderV2,
  addBotMessage,
} from '../../providers/langchain-v2';
import WindowManager from '../window-manager';

ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = LocalStorage.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  LocalStorage.set(key, val);
});

// clear
ipcMain.on('clear-store', () => {
  const gadgetWindow = WindowManager.getGadgetWindow();
  const mainWindow = WindowManager.getMainWindow();
  LocalStorage.clear();
  mainWindow?.reload();
  gadgetWindow?.reload();
});

// stop-stream
ipcMain.on('stop-stream', async () => {
  await LangchainProviderV2.abortRequest();
});

// services-status
ipcMain.on('services-status', async (event) => {
  const status = await ServiceStatus.checkAll();
  event.returnValue = status;
});

// embed-dependencies
ipcMain.on('embed-dependencies', async (event) => {
  const status = await ServiceStatus.checkOllamaModelDependencies();
  event.returnValue = status;
});

// async function handleStartStreamBKP(event: any, message: any) {
//   // console.log('ipc start-stream', message);
//   const images: any = LocalStorage.get('promptImages') || [];
//   const promptContextFile: any = LocalStorage.get('promptContextFile') || '';
//   const llmModel: any = LocalStorage.get('llmModel') || '';
//   const service = LocalStorage.get('llmService') || '';
//   const temp: any = LocalStorage.get('modelTemperature') || 0.7;
//   const endpoint: any = LocalStorage.get('mainModelEndpoint') || '';
//   const chatType: ChatTypes =
//     (LocalStorage.get('chatType') as ChatTypes) || 'completion';

//   let context = '';
//   if (images.length > 0) {
//     context = images;
//   } else if (promptContextFile.length > 0) {
//     context = promptContextFile;
//   }
//   try {
//     console.log('handleStartStream', { message, context, llmModel, temp });
//     if (service && (service === 'gpt4All' || service === 'llamaCpp')) {
//       if (service === 'gpt4All') {
//         return await LangchainProvider.gpt4AllGenerateCompletionResponse(
//           context,
//           message,
//           defaultEndpoints.gpt4All,
//           llmModel,
//           temp,
//         );
//       }
//       if (service === 'llamaCpp') {
//         if (chatType === 'completion')
//           return await LangchainProvider.llamaCppGenerateCompletionResponse(
//             context,
//             message,
//             defaultEndpoints.llamaCpp,
//             llmModel,
//             temp,
//           );
//         if (chatType === 'chat-completion')
//           return await LangchainProvider.llamaCppGenerateChatCompletionResponse(
//             context,
//             message,
//             defaultEndpoints.llamaCpp,
//             llmModel,
//             temp,
//           );
//         if (chatType === 'chat-completion-memory')
//           return await LangchainProvider.llamaCppChatWithMemory(
//             message,
//             defaultEndpoints.llamaCpp,
//             llmModel,
//             temp,
//           );
//       }
//       return null;
//     }
//     return await LangchainProvider.generateStreamResponse(
//       context,
//       message,
//       endpoint,
//       llmModel,
//       temp,
//     );
//   } catch (error) {
//     console.error('start-stream-error', error);
//     // return error;
//   }
// }
// eslint-disable-next-line consistent-return
export default async function handleStartStream(event: any, prompt: any) {
  const images: any = LocalStorage.get('promptImages') || [];
  const promptContextFile: any = LocalStorage.get('promptContextFile') || [];
  const chatType: ChatTypes =
    (LocalStorage.get('chatType') as ChatTypes) || 'chat-completion';

  let context = '';
  if (images.length > 0) {
    context = images;
  } else if (promptContextFile.length > 0) {
    context = promptContextFile;
  }
  try {
    // console.log('handleStartStream', { message, context, chatType });
    return await LangchainProviderV2.interactionStarter(chatType, {
      context,
      prompt,
    });
  } catch (error) {
    console.error('start-stream-error', error);
    console.error('interactionStarter-error', error);
    LocalStorage.set('isLoading', 'false');
    LocalStorage.set('streamResponse', '');
    LocalStorage.set('executionDescription', '');
    const strError = typeof error === 'string' ? error : JSON.stringify(error);
    if (strError.length > 3) {
      const messageId = UUID.v4();
      const model = LocalStorage.get('llmModel');
      addBotMessage(
        `I had trouble processing your request. Here is the error message: ${strError}`,
        messageId,
        LocalStorage.get('chatMessages'),
        typeof model === 'string' && model.length > 0 ? model : 'Unknown',
      );
    }
  }
}

ipcMain.handle('start-stream', handleStartStream);
