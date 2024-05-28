import * as UUID from 'uuid';
import LocalStorage from './local-storage';
import { OllamaGenerateParams } from '../types/ollama-types';

let controller: AbortController = new AbortController();
export default class OllamaProviderNode {
  public static addBotMessage = (
    message: string,
    messages: any,
    model: string,
  ) => {
    const messageId = UUID.v4();
    // LocalStorage.set('isLoading', 'true');
    LocalStorage.set('chatMessages', [
      ...messages,
      { message, author: 'assistant', id: messageId, model },
    ]);
  };

  public static async abortStream() {
    controller.abort();
    controller = new AbortController();
  }

  public static async ollamaGenerateStream(
    endpoint: string,
    params: OllamaGenerateParams,
  ) {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw response.statusText;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const loopRunner = true;
    let answerStr = '';
    while (loopRunner) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) {
        // setIsLoading(false);
        // setStopStream(false);
        break;
      }
      const decodedChunk = decoder.decode(value, { stream: true });
      const cleanChunk = decodedChunk.replace(/\n/g, '');
      const fixedChunk = cleanChunk.includes('}{')
        ? `[${cleanChunk.replace(/}{/g, '},{')}]`
        : cleanChunk;
      // const isValidJson = (str: string) => {
      //   try {
      //     JSON.parse(str);
      //   } catch (e) {
      //     console.log(
      //       'pre-test validJson',
      //       JSON.stringify({
      //         example: str,
      //         error: e,
      //         test1: decodedChunk.includes('}{'),
      //         test2: decodedChunk.includes('},{'),
      //         test3: decodedChunk.includes('}\n{'),
      //       }),
      //     );
      //     console.log('Error parsing JSON:', str);
      //     return false;
      //   }
      //   return true;
      // };
      // console.log('isValidJson', isValidJson(fixedChunk), decodedChunk);
      const messageResponse = JSON.parse(fixedChunk);
      // console.log('messageResponse', decodedChunk);
      if (messageResponse.response) {
        answerStr += messageResponse.response;
        LocalStorage.set('streamResponse', answerStr);
      }
    }
    LocalStorage.set('isLoading', 'false');
    const messages = LocalStorage.get('chatMessages');
    this.addBotMessage(answerStr, messages, params.model);
    LocalStorage.set('streamResponse', '');

    return answerStr;
  }
}
