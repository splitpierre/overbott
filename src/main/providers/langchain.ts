/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { formatDocumentsAsString } from 'langchain/util/document';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
// import { OpenAIEmbeddings } from '@langchain/openai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
// import { Milvus } from '@langchain/community/vectorstores/milvus';
import { OpenAI, ChatOpenAI } from '@langchain/openai';
import { RedisChatMessageHistory } from '@langchain/community/stores/message/ioredis';
import { ChatGroq } from '@langchain/groq';
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableWithMessageHistory,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Ollama } from '@langchain/community/llms/ollama';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import {
  RecursiveCharacterTextSplitter,
  CharacterTextSplitter,
} from 'langchain/text_splitter';
// import {
//   ConsistencyLevelEnum,
//   MetricType,
//   MilvusClient,
// } from '@zilliz/milvus2-sdk-node';
import { app } from 'electron';
import { CohereRerank } from '@langchain/cohere';
import * as UUID from 'uuid';
import { fork } from 'child_process';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import CustomHuggingFaceTransformersEmbeddings from '../embeddings/custom-hf-embedding';
import LocalStorage from './local-storage';
// import OpenTTS from './open-tts';
import defaultEndpoints from '../data/default-endpoints';
import { ChatLogMessage } from '../types/app-types';
import { StableDiffusionBody } from '../types/stable-diffusion-types';
import promptAgents from '../data/system-prompts';
// import DiffusersApiProvider from './stable-diffusion';
// import { MinimaxEmbeddings } from '@langchain/community/embeddings/minimax';
// import transformers from '@langchain/community/embeddings/hf_transformers';
// import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
// const {
//   HuggingFaceTransformersEmbeddings,
// } = require('@langchain/community/embeddings/hf_transformers');

// const milvusClient = new MilvusClient(address);

// const HFTransformersApi = import(
//   '@langchain/community/embeddings/hf_transformers'
// );

const promptChatTemplate = {
  en: `If you can, always answer in the same language as the Question, otherwise english. Your output should ALWAYS be markdown formatted.
  If the output contains code, make sure to optimize for syntax highlighting.
  Question: {question}
  Helpful Answer:`,
  pt: `Sempre responda em português. Use as seguintes partes do contexto para responder à pergunta no final.
  Se você não souber a resposta, apenas diga que não sabe, não tente inventar uma resposta.
  --------------------------------------------
  {context}
  --------------------------------------------
  Pergunta: {question}
  Resposta:`,
};

const promptRAGTemplate = {
  en: `If you can, always answer in the same language as the question, otherwise english. Use the following pieces of context to answer the question at the end.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  {context}
  Question: {question}
  Helpful Answer:`,
  pt: `Use as seguintes partes do contexto para responder a pergunta no final.
  Se você não souber a resposta, apenas diga que não sabe, não tente inventar uma resposta.
  --------------------------------------------
  {context}
  --------------------------------------------
  Pergunta: {question}
  Resposta:`,
};
const addBotMessage = (
  message: string,
  messageId: string,
  messages: any,
  model: string,
  duration?: number,
  generationData?: any,
) => {
  // LocalStorage.set('isLoading', 'true');
  const newMessages: ChatLogMessage[] = [
    ...messages,
    {
      message,
      author: 'assistant',
      id: messageId,
      model,
      duration,
      generationData,
      timestamp: new Date().toISOString(),
    },
  ];
  LocalStorage.set('chatMessages', newMessages);
};

function extractPairs(text: string) {
  // Regular expression pattern to match pairs of integers followed by a letter
  const pattern = /(?:^|\D)([1-9]\d*)\s+(A|B|C|D|E|X)\b/g;

  const pairs = [];
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(text)) !== null) {
    // eslint-disable-next-line radix
    const number = parseInt(match[1]);
    const letter = match[2];
    pairs.push({ question: number, answer: letter });
  }

  return pairs;
}

const countTokenSum = (output: any) => {
  if (output.generations && output.generations.length > 0) {
    const totalTokens =
      output.generations[0] &&
      output.generations[0][0] &&
      output.generations[0][0].generationInfo &&
      output.generations[0][0].generationInfo.prompt_eval_count &&
      output.generations[0][0].generationInfo.eval_count
        ? output.generations[0][0].generationInfo.prompt_eval_count +
          output.generations[0][0].generationInfo.eval_count
        : 0;
    const currentTokens = LocalStorage.get('totalTokens') || 0;
    const tokenSum = currentTokens
      ? currentTokens + totalTokens
      : currentTokens;
    console.log('set new token count', { currentTokens, tokenSum });
    LocalStorage.set('totalTokens', tokenSum);
  }
  console.log(JSON.stringify(output, null, 2));
};
function dotProduct(a: any, b: any) {
  if (a.length !== b.length) {
    throw new Error('Both arguments must have the same length');
  }

  let result = 0;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < a.length; i++) {
    result += a[i] * b[i];
  }

  return result;
}
let controller: AbortController = new AbortController();
const RESOURCES_PATH = app.isPackaged ? process.resourcesPath : __dirname;
const worker = fork(path.join(RESOURCES_PATH, '../workers/image-worker.js'));

export class LangchainProvider {
  /**
   * Aborts the current stream
   */
  public static async abortStream() {
    LocalStorage.set('executionDescription', 'Aborting request');

    const message = LocalStorage.get('streamResponse');
    const messages = LocalStorage.get('chatMessages');
    const model = LocalStorage.get('llmModel');
    const messageId = UUID.v4();

    addBotMessage(
      typeof message === 'string' ? message : '',
      messageId,
      messages,
      typeof model === 'string' ? model : 'Unknown',
    );
    LocalStorage.set('streamResponse', '');
    LocalStorage.set('isLoading', 'false');
    controller.abort();
    controller = new AbortController();
    LocalStorage.set('executionDescription', '');

    worker.send({
      signal: 'abort',
    });
  }

  /**
   * Generate a stream response with/without context
   * @param context
   * @param prompt
   * @param mainModelEndpoint
   * @param llmModel
   * @param modelTemperature
   * @returns
   */
  public static async generateStreamResponse(
    context: any,
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemperature: number,
  ) {
    const startTime = performance.now();
    LocalStorage.set('executionDescription', 'Initiate processing...');
    try {
      // const ollama = new OpenAI({
      //   // baseUrl: mainModelEndpoint,
      //   modelName: 'Nous-Hermes-2-Mistral-7B-DPO.Q4_0',
      //   openAIApiKey: 'sk-1Zz',
      //   streaming: true,
      //   configuration: {
      //     baseURL: 'http://localhost:4891/v1',
      //   },
      //   temperature: modelTemperature,
      //   callbacks: [
      //     {
      //       handleLLMEnd(output) {
      //         countTokenSum(output);
      //       },
      //     },
      //   ],
      // }).bind({ signal: controller.signal });
      const ollama = new Ollama({
        baseUrl: mainModelEndpoint,
        model: llmModel,
        temperature: modelTemperature,
        callbacks: [
          {
            handleLLMEnd(output) {
              countTokenSum(output);
            },
          },
        ],
      }).bind({ signal: controller.signal });
      console.log('initializing stream', {
        context,
        prompt,
        mainModelEndpoint,
        llmModel,
      });
      // return false;
      if (context) {
        if (typeof context === 'string' && context.length > 0) {
          LocalStorage.set(
            'executionDescription',
            'Processing file (unstructured)...',
          );

          // console.log('context is string', context);
          // this.perfTestEmbeddings(context);
          // return 'done';
          const loader = new PDFLoader(context);
          // const unstructuredLoader = new UnstructuredLoader(context, {
          //   apiUrl: `${defaultEndpoints.unstructured}/general/v0/general`,
          // });
          // console.log('unstructuredLoader', await unstructuredLoader.load());
          // return;
          const docs = await loader.load();
          const textSplitter = new CharacterTextSplitter({
            // separator:
            //   '--------------------------------------------------------------',
            chunkSize: 512,
            chunkOverlap: 3,
          });
          const allSplits = await textSplitter.splitDocuments(docs);
          console.log('broke allSplits', allSplits);
          // return 'stop';

          // const unstructuredLoader = new UnstructuredLoader(context, {
          //   apiUrl: `${defaultEndpoints.unstructured}/general/v0/general`,
          //   // pdfInferTableStructure: true,
          // });
          // const loader = new PDFLoader(context);
          // const docs = await unstructuredLoader.load();
          console.log('docsLength', docs.length);

          const cohereRerank = new CohereRerank({
            apiKey: process.env.COHERE_API_KEY, // Default
            topN: 5, // Default
            model: 'rerank-multilingual-2', // Default
          });
          LocalStorage.set(
            'executionDescription',
            'Performing re-rank (cohere)...',
          );

          const rerankedDocuments = await cohereRerank.compressDocuments(
            allSplits,
            prompt,
          );
          console.log('rerankedDocuments', rerankedDocuments);
          const embeddingModel =
            LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

          let embeddings: any = new CustomHuggingFaceTransformersEmbeddings({
            modelName: 'Xenova/all-MiniLM-L6-v2',
          });
          LocalStorage.set(
            'executionDescription',
            `Embedding with model: ${embeddingModel}...`,
          );
          if (
            typeof embeddingModel === 'string' &&
            embeddingModel.includes('nomic')
          ) {
            embeddings = new OllamaEmbeddings({
              model: 'nomic-embed-text:latest',
            });
          }
          const theVectorStore = await HNSWLib.fromDocuments(
            rerankedDocuments,
            embeddings,
          );
          LocalStorage.set(
            'executionDescription',
            'Initiate response generation',
          );
          const retriever = theVectorStore.asRetriever();
          const promptTemplateNarrow = PromptTemplate.fromTemplate(
            promptRAGTemplate.pt,
          );
          const chain = RunnableSequence.from([
            {
              context: retriever.pipe(formatDocumentsAsString),
              question: new RunnablePassthrough(),
            },
            promptTemplateNarrow,
            ollama,
            new StringOutputParser(),
          ]);
          // eslint-disable-next-line no-underscore-dangle
          const stream = await chain._streamIterator(prompt);
          const chunks = [];
          // eslint-disable-next-line no-restricted-syntax
          for await (const chunk of stream) {
            if (chunks.length === 0)
              LocalStorage.set(
                'executionDescription',
                'Generating response...',
              );
            chunks.push(chunk);
            LocalStorage.set('streamResponse', chunks.join(''));
          }
          LocalStorage.set('isLoading', 'false');
          const messages = LocalStorage.get('chatMessages');
          const endTime = performance.now();
          const duration = endTime - startTime;
          const messageId = UUID.v4();
          addBotMessage(
            chunks.join(''),
            messageId,
            messages,
            llmModel,
            duration,
          );
          LocalStorage.set('streamResponse', '');
          LocalStorage.set('executionDescription', '');
          return chunks.join('');
          // const result = await chain.invoke(prompt);
          // return result.toString();
        }
        if (Array.isArray(context) && context.length > 0) {
          LocalStorage.set('executionDescription', 'Processing images...');

          const model = new Ollama({
            baseUrl: mainModelEndpoint,
            model: llmModel,
            temperature: modelTemperature,
            callbacks: [
              {
                handleLLMEnd(output) {
                  countTokenSum(output);
                },
              },
            ],
          }).bind({ images: context, signal: controller.signal });
          // console.log('context is array', context);
          // ollama.bind({ images: context });
          LocalStorage.set('executionDescription', 'Initiate embedding...');

          const stream = await model.stream(prompt);
          // console.log('streamImage invoke', stream);
          const chunks = [];
          // eslint-disable-next-line no-restricted-syntax
          for await (const chunk of stream) {
            if (chunks.length === 0)
              LocalStorage.set(
                'executionDescription',
                'Initiate generating response...',
              );

            chunks.push(chunk);
            LocalStorage.set('streamResponse', chunks.join(''));
          }
          LocalStorage.set('isLoading', 'false');
          const messages = LocalStorage.get('chatMessages');
          const endTime = performance.now();
          const duration = endTime - startTime;
          const messageId = UUID.v4();

          addBotMessage(
            chunks.join(''),
            messageId,
            messages,
            llmModel,
            duration,
          );
          LocalStorage.set('streamResponse', '');
          LocalStorage.set('executionDescription', '');
          return chunks.join('');
        }
        return 'Error';
      }
      LocalStorage.set('executionDescription', 'Generating response...');
      // console.log('langchain normal stream?');
      const stream = await ollama.stream(prompt);
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      // Your function execution code here
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, llmModel, duration);
      LocalStorage.set('audioResponse', chunks.join(''));

      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return chunks.join('');
    } catch (error) {
      console.error('Error:', error);
      LocalStorage.set('isLoading', 'false');
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');
      const strError =
        typeof error === 'string' ? error : JSON.stringify(error);
      if (strError.length > 3) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const messageId = UUID.v4();

        addBotMessage(
          `I had trouble processing your request. Here is the error message: ${strError}`,
          messageId,
          LocalStorage.get('chatMessages'),
          llmModel,
          duration,
        );
      }
      return 'Error';
    }
  }

  public static async gpt4AllGenerateChatResponse(
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemp: number,
  ) {
    try {
      const model = new ChatOpenAI({
        openAIApiKey: 'sk-1Zz',
        configuration: {
          baseURL: `${defaultEndpoints.gpt4All}/v1`,
        },
        // streaming: false,
        modelName: 'Nous-Hermes-2-Mistral-7B-DPO.Q4_0',
        temperature: 0.7,
      }).bind({ signal: controller.signal });
      LocalStorage.set('executionDescription', 'Generating response...');
      // const promptTemplate = PromptTemplate.fromTemplate(promptChatTemplate.en);
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', 'You are a helpful assistant'],
        ['human', '{input}'],
      ]);
      // const chain = RunnableSequence.from([
      //   {
      //     question: new RunnablePassthrough(),
      //   },
      //   promptTemplate,
      //   model,
      //   new StringOutputParser(),
      // ]);
      console.log('init chain');
      const chain = promptTemplate.pipe(model);
      const response = await chain.invoke({
        input: prompt,
      });
      console.log('response', response.content);
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      const messageId = UUID.v4();

      addBotMessage(
        response.content.toString(),
        messageId,
        messages,
        'Nous-Hermes-2-Mistral-7B-DPO.Q4_0',
      );
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return response.content;
      // eslint-disable-next-line no-underscore-dangle
      // const result = await chain._streamIterator({
      //   input: prompt,
      // });
      // const chunks = [];
      // // eslint-disable-next-line no-restricted-syntax
      // for await (const chunk of result) {
      //   console.log('chunk', chunk);
      //   chunks.push(chunk);
      //   LocalStorage.set('streamResponse', chunks.join(''));
      // }
      // LocalStorage.set('isLoading', 'false');
      // const messages = LocalStorage.get('chatMessages');
      // addBotMessage(
      //   chunks.join(''),
      //   messages,
      //   'Nous-Hermes-2-Mistral-7B-DPO.Q4_0',
      // );
      // LocalStorage.set('streamResponse', '');
      // LocalStorage.set('executionDescription', '');

      // return chunks.join('');
    } catch (error) {
      console.error('Error:', error);
      return 'Error';
    }
  }

  public static async llamaCppChatWithMemory(
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemp: number,
  ) {
    LocalStorage.set('executionDescription', 'Generating response...');

    try {
      const startTime = performance.now();
      const model = new ChatOpenAI({
        openAIApiKey: 'sk-1',
        configuration: {
          baseURL: `${defaultEndpoints.llamaCpp}/v1`,
        },
        streaming: true,
        modelName: llmModel,
        temperature: modelTemp,
      }).bind({ signal: controller.signal });
      LocalStorage.set('executionDescription', 'Loading memory...');
      /**
       * USING RUNNABLE WITH HISTORY
       */
      const promptAgent = LocalStorage.get('promptAgent') || '';
      let systemPrompt = '';
      if (promptAgent && typeof promptAgent === 'string') {
        systemPrompt =
          promptAgents[promptAgent as keyof typeof promptAgents] || '';
      }
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('history'),
        ['human', '{question}'],
        // ['ai', '{response}'],
      ]);
      console.log('init promptTemplate', promptTemplate);
      const chain = promptTemplate.pipe(model);
      console.log('init chain', chain);

      const chainWithHistory = new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory: (sessionId) =>
          new RedisChatMessageHistory({
            sessionId,
            // sessionTTL: 300, // 5 minutes, omit this parameter to make sessions never expire
            url: defaultEndpoints.redis, // Default value, override with your own instance's URL
          }),
        inputMessagesKey: 'question',
        // outputMessagesKey: 'response',
        historyMessagesKey: 'history',
      });
      console.log('init chainWithHistory', chainWithHistory);
      // return '';
      // eslint-disable-next-line no-underscore-dangle
      const stream = await chainWithHistory._streamIterator(
        {
          question: prompt,
        },
        {
          configurable: {
            sessionId: 'overbott',
          },
        },
      );
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        console.log('chunk', chunk.content);
        chunks.push(chunk.content);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      /**
       * USING BUFFER MEMORY
       */
      // const memory = new BufferMemory({
      //   chatHistory: new RedisChatMessageHistory({
      //     sessionId: 'overbott', // Or some other unique identifier for the conversation
      //     // sessionTTL: 300, // 5 minutes, omit this parameter to make sessions never expire
      //     url: 'redis://localhost:6379', // Default value, override with your own instance's URL
      //   }),
      // });
      // const chain = new ConversationChain({ llm: model, memory });
      // const promptAgent = LocalStorage.get('promptAgent') || '';
      // let systemPrompt = '';
      // if (promptAgent && typeof promptAgent === 'string') {
      //   systemPrompt =
      //     promptAgents[promptAgent as keyof typeof promptAgents] || '';
      // }
      // const promptTemplate = ChatPromptTemplate.fromMessages([
      //   ['system', systemPrompt],
      //   new MessagesPlaceholder('history'),
      //   ['human', '{question}'],
      // ]);
      // const promptTemplateNarrow = PromptTemplate.fromTemplate(systemPrompt);
      // console.log({
      //   systemPrompt,
      //   promptTemplateNarrow,
      //   envTest: {
      //     langSmithKey: process.env.LANGCHAIN_API_KEY,
      //   },
      // });
      // LocalStorage.set('executionDescription', 'Initiate response generation');
      // // eslint-disable-next-line no-underscore-dangle
      // const response = await chain._streamIterator({
      //   input: prompt,
      // });
      // const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      // for await (const chunk of response) {
      //   console.log('chunk', chunk);
      //   chunks.push(chunk.response);
      //   LocalStorage.set('streamResponse', chunks.join(''));
      // }
      const messages = LocalStorage.get('chatMessages');
      const messageId = UUID.v4();
      const endTime = performance.now();
      const duration = endTime - startTime;
      addBotMessage(chunks.join(''), messageId, messages, llmModel, duration);
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');
      LocalStorage.set('isLoading', 'false');
    } catch (error) {
      console.error('Error:', error);
      return 'Error';
    }
  }

  public static async llamaCppGenerateChatCompletionResponse(
    context: any,
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemp: number,
  ) {
    try {
      const startTime = performance.now();
      console.log('init llamaCppGenerateChatCompletionResponse');
      const model = new ChatOpenAI({
        openAIApiKey: 'sk-1',
        configuration: {
          baseURL: `${defaultEndpoints.llamaCpp}/v1`,
        },
        streaming: true,
        modelName: llmModel,
        temperature: modelTemp,
        callbacks: [
          {
            handleLLMEnd(output) {
              countTokenSum(output);
            },
          },
        ],
      }).bind({ signal: controller.signal });
      // console.log('init model', model);
      LocalStorage.set('executionDescription', 'Generating response...');

      // console.log('langchain normal stream?');
      // const chain = promptTemplate.pipe(model);
      // console.log('chain', chain);

      const stream = await model.stream([['human', prompt]]);

      // eslint-disable-next-line no-underscore-dangle
      // const stream = await chain._streamIterator({
      //   input: prompt,
      // });
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk.content);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      console.log('chunks', chunks);
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      // Your function execution code here
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, llmModel, duration);
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return chunks.join('');
    } catch (error) {
      console.error('Error:', error);
      return 'Error';
    }
  }

  public static async llamaCppGenerateCompletionResponse(
    context: any,
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemp: number,
  ) {
    const startTime = performance.now();
    try {
      console.log('init llamaCppGenerateCompletionResponse');
      const model = new ChatOpenAI({
        openAIApiKey: 'sk-1',
        configuration: {
          baseURL: `${defaultEndpoints.llamaCpp}/v1`,
        },
        streaming: true,
        modelName: llmModel,
        temperature: modelTemp,
        callbacks: [
          {
            handleLLMEnd(output) {
              countTokenSum(output);
            },
          },
        ],
      }).bind({ signal: controller.signal });

      if (prompt.includes('/imagine')) {
        const imageModel = 'runwayml/stable-diffusion-v1-5';
        LocalStorage.set('executionDescription', 'Generating image...');
        console.log('worker txt2img init');
        const messageId = UUID.v4();

        addBotMessage(
          `![image](...generating...)`,
          messageId,
          LocalStorage.get('chatMessages'),
          imageModel,
        );
        // remove "/imagine" from prompt
        const imgPrompt = prompt.replace('/imagine', '');
        const stableDiffusionBody: StableDiffusionBody = {
          modelInputs: {
            prompt,
            num_inference_steps: 3, // 25-50
            guidance_scale: 7.5,
            width: 512,
            height: 512,
            seed: 3239022079,
          },
          callInputs: {
            MODEL_ID: imageModel,
            PIPELINE: 'StableDiffusionPipeline',
            SCHEDULER: 'LMSDiscreteScheduler',
            safety_checker: false,
          },
        };
        worker.send({
          signal: 'start',
          endpoint: defaultEndpoints.diffusersApi,
          imgPrompt,
          body: stableDiffusionBody,
        });

        worker.on('message', (message: any) => {
          if (message.type === 'success') {
            console.log('Data fetched successfully:', message);
            const endTime = performance.now();
            const duration = endTime - startTime;
            const messages: any = LocalStorage.get('chatMessages');
            if (messages && messages.length > 0) {
              // find message by id
              const messageIndex = messages.findIndex(
                (msg: any) => msg.id === messageId,
              );
              if (messageIndex > -1) {
                messages[messageIndex].message = `![image](${message.data})`;
                messages[messageIndex].duration = duration;
                LocalStorage.set('chatMessages', messages);
              }

              LocalStorage.set('isLoading', 'false');
              LocalStorage.set('executionDescription', '');
            }
          } else if (message.type === 'error') {
            const endTime = performance.now();
            const duration = endTime - startTime;
            console.error('Error fetching worker data:', {
              msg: message.message,
              duration,
            });
            LocalStorage.set('isLoading', 'false');
            LocalStorage.set('executionDescription', '');
          }
        });
        // const base64Image = await DiffusersApiProvider.textToImage(imgPrompt);
        // save image to disk
        // const imgSrc = `data:image/png;base64,${base64Image}`;
        // const imgPath = path.join(__dirname, `image-${imgPrompt}.png`);
        // const imgBuffer = Buffer.from(base64Image, 'base64');
        // fs.writeFileSync(imgPath, imgBuffer);
        // const imgSrcPath = path.join(__dirname, `image-${imgPrompt}.png`);

        // console.log('base64Image', base64Image);
        // const endTime = performance.now();
        // const duration = endTime - startTime;
        // addBotMessage(
        //   `![image](${base64Image})`,
        //   LocalStorage.get('chatMessages'),
        //   'stable-diffusion',
        //   duration,
        // );

        // LocalStorage.set('isLoading', 'false');
        // LocalStorage.set('executionDescription', '');
        return 'Generating..';
      }

      if (context) {
        if (typeof context === 'string' && context.length > 0) {
          LocalStorage.set('executionDescription', 'Parsing file...');

          // console.log('context is string', context);
          // this.perfTestEmbeddings(context);
          // return 'done';
          const unstructuredLoader = new UnstructuredLoader(context, {
            apiUrl: `${defaultEndpoints.unstructured}/general/v0/general`,
            pdfInferTableStructure: true,
          });
          // const loader = new PDFLoader(context);
          const docs = await unstructuredLoader.load();
          console.log('docsLength', docs.length);
          LocalStorage.set('executionDescription', 'Performing re-rank...');

          const cohereRerank = new CohereRerank({
            apiKey: process.env.COHERE_API_KEY,
            topN: 5,
            model: 'rerank-multilingual-2',
          });

          const rerankedDocuments = await cohereRerank.compressDocuments(
            docs,
            prompt,
          );
          console.log('rerankedDocuments', rerankedDocuments);
          // const docs = await loader.load();
          // const answerTable: any = [];
          // docs.map((doc: any) => {
          //   const pairExtraction = extractPairs(doc.pageContent);
          //   pairExtraction.map((pair: any) => {
          //     answerTable.push(pair);
          //   });
          // });
          // const textSplitter = new RecursiveCharacterTextSplitter({
          //   chunkSize: 512,
          //   chunkOverlap: 3,
          // });
          // const allSplits = await textSplitter.splitDocuments(docs);
          // console.log('broke allSplits', allSplits);
          // return 'stop';
          // sort by question number

          // const sortedAnswerTable = answerTable.sort((a: any, b: any) =>
          //   a.question > b.question ? 1 : -1,
          // );
          // console.log('answerTable', answerTable);
          // return JSON.stringify(sortedAnswerTable);

          const embeddingModel =
            LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

          let embeddings: any = new CustomHuggingFaceTransformersEmbeddings({
            modelName: 'Xenova/all-MiniLM-L6-v2',
          });
          LocalStorage.set(
            'executionDescription',
            `Embedding with model: ${embeddingModel}...`,
          );
          if (
            typeof embeddingModel === 'string' &&
            embeddingModel.includes('nomic')
          ) {
            embeddings = new OllamaEmbeddings({
              model: 'nomic-embed-text:latest',
            });
          }
          // const theVectorStore = await HNSWLib.fromDocuments(
          //   rerankedDocuments,
          //   embeddings,
          // );
          LocalStorage.set(
            'executionDescription',
            'Initiate response generation',
          );
          // const retriever = theVectorStore.asRetriever();
          const promptTemplateNarrow = PromptTemplate.fromTemplate(
            promptRAGTemplate.en,
          );
          const ragChain = await createStuffDocumentsChain({
            llm: model,
            prompt: promptTemplateNarrow,
            outputParser: new StringOutputParser(),
          });

          // const retrievedDocs = await retriever.getRelevantDocuments(prompt);
          // console.log('retrievedDocs', retrievedDocs);
          // const chain = RunnableSequence.from([
          //   {
          //     context: retriever.pipe(formatDocumentsAsString),
          //     question: new RunnablePassthrough(),
          //   },
          //   promptTemplateNarrow,
          //   model,
          //   new StringOutputParser(),
          // ]);
          // eslint-disable-next-line no-underscore-dangle
          // const response = await chain.invoke(prompt);
          // const endTime = performance.now();
          // const duration = endTime - startTime;
          // console.log('response', response);
          // LocalStorage.set('isLoading', 'false');
          // const messages = LocalStorage.get('chatMessages');
          // addBotMessage(response.toString(), messages, llmModel, duration);
          // LocalStorage.set('streamResponse', '');
          // LocalStorage.set('executionDescription', '');

          // eslint-disable-next-line no-underscore-dangle
          const stream = await ragChain._streamIterator({
            question: prompt,
            context: rerankedDocuments,
          });
          const chunks = [];
          // eslint-disable-next-line no-restricted-syntax
          for await (const chunk of stream) {
            chunks.push(chunk);
            LocalStorage.set('streamResponse', chunks.join(''));
          }
          LocalStorage.set('isLoading', 'false');
          const messages = LocalStorage.get('chatMessages');
          const endTime = performance.now();
          const duration = endTime - startTime;
          const messageId = UUID.v4();
          addBotMessage(
            chunks.join(''),
            messageId,
            messages,
            llmModel,
            duration,
          );
          LocalStorage.set('streamResponse', '');
        }
        return;
      }
      // console.log('init model', model);
      LocalStorage.set('executionDescription', 'Generating response...');

      // console.log('langchain normal stream?');
      // const chain = promptTemplate.pipe(model);
      // console.log('chain', chain);
      // const promptAgent: any = LocalStorage.get('promptAgent') || '';
      // let newPrompt = '';
      // if (promptAgent && typeof promptAgent === 'string') {
      //   newPrompt = `${
      //     promptAgents[promptAgent as keyof typeof promptAgents]
      //   } \n\n${prompt}`;
      // } else {
      //   newPrompt = prompt;
      // }
      const promptAgent = LocalStorage.get('promptAgent') || '';
      let systemPrompt = '';
      if (promptAgent && typeof promptAgent === 'string') {
        systemPrompt =
          promptAgents[promptAgent as keyof typeof promptAgents] || '';
      }
      if (systemPrompt)
        systemPrompt += '\n Input/Question: {question} \nResponse/Answer:';
      console.log('systemPrompt', systemPrompt);
      const promptTemplate = PromptTemplate.fromTemplate(
        systemPrompt || promptChatTemplate.en,
      );
      console.log('promptTemplate', promptTemplate);
      const chain = RunnableSequence.from([
        {
          question: new RunnablePassthrough(),
        },
        promptTemplate,
        model,
        new StringOutputParser(),
      ]);
      // console.log('will stream with newPrompt', newPrompt);
      // const stream = await model.stream([['human', prompt]]);
      // eslint-disable-next-line no-underscore-dangle
      const stream = await chain._streamIterator(prompt);

      // eslint-disable-next-line no-underscore-dangle
      // const stream = await chain._streamIterator({
      //   input: prompt,
      // });
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      console.log('chunks', chunks);
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      // Your function execution code here
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, llmModel, duration);
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      // return chunks.join('');
    } catch (error: any) {
      console.error('Error:', error);
      LocalStorage.set('isLoading', 'false');
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');
      const strError =
        typeof error === 'string' ? error : JSON.stringify(error);
      if (strError.length > 3) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const messageId = UUID.v4();

        addBotMessage(
          `I had trouble processing your request. Here is the error message: ${strError}`,
          messageId,
          LocalStorage.get('chatMessages'),
          llmModel,
          duration,
        );
      }
      // return 'Error';
    }
  }

  public static async gpt4AllGenerateCompletionResponse(
    context: any,
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemp: number,
  ) {
    try {
      const startTime = performance.now();

      const model = new OpenAI({
        openAIApiKey: 'sk-1Zz',
        configuration: {
          baseURL: `${defaultEndpoints.gpt4All}/v1`,
        },
        // streaming: true,
        modelName: llmModel,
        temperature: modelTemp,
        callbacks: [
          {
            handleLLMEnd(output) {
              countTokenSum(output);
            },
          },
          {
            handleLLMNewToken(token: string) {
              console.log({ token });
            },
          },
        ],
      }).bind({ signal: controller.signal });

      if (context) {
        if (typeof context === 'string' && context.length > 0) {
          LocalStorage.set('executionDescription', 'Processing PDF...');

          // console.log('context is string', context);
          // this.perfTestEmbeddings(context);
          // return 'done';
          const loader = new PDFLoader(context);
          const docs = await loader.load();
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 512,
            chunkOverlap: 3,
          });
          const allSplits = await textSplitter.splitDocuments(docs);
          console.log('broke allSplits', allSplits);
          // return 'stop';
          const embeddingModel =
            LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

          let embeddings: any = new CustomHuggingFaceTransformersEmbeddings({
            modelName: 'Xenova/all-MiniLM-L6-v2',
          });
          LocalStorage.set(
            'executionDescription',
            `Embedding with model: ${embeddingModel}...`,
          );
          if (
            typeof embeddingModel === 'string' &&
            embeddingModel.includes('nomic')
          ) {
            embeddings = new OllamaEmbeddings({
              model: 'nomic-embed-text:latest',
            });
          }
          const theVectorStore = await HNSWLib.fromDocuments(
            allSplits,
            embeddings,
          );
          LocalStorage.set(
            'executionDescription',
            'Initiate response generation',
          );
          const retriever = theVectorStore.asRetriever();
          const promptTemplateNarrow = PromptTemplate.fromTemplate(
            promptRAGTemplate.en,
          );
          const chain = RunnableSequence.from([
            {
              context: retriever.pipe(formatDocumentsAsString),
              question: new RunnablePassthrough(),
            },
            promptTemplateNarrow,
            model,
            new StringOutputParser(),
          ]);
          // eslint-disable-next-line no-underscore-dangle
          const response = await chain.invoke(prompt);
          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log('response', response);
          LocalStorage.set('isLoading', 'false');
          const messages = LocalStorage.get('chatMessages');
          const messageId = UUID.v4();

          addBotMessage(
            response.toString(),
            messageId,
            messages,
            llmModel,
            duration,
          );
          LocalStorage.set('streamResponse', '');
          LocalStorage.set('executionDescription', '');
        }
        return 'Error';
      }

      LocalStorage.set('executionDescription', 'Generating response...');
      // console.log('langchain normal stream?');

      const response = await model.invoke(prompt);
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log('responsee', response);
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      const messageId = UUID.v4();

      addBotMessage(
        response.toString(),
        messageId,
        messages,
        llmModel,
        duration,
      );
      LocalStorage.set('audioResponse', response.toString());
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return response;
      // eslint-disable-next-line no-underscore-dangle
      // const result = await chain._streamIterator({
      //   input: prompt,
      // });
      // const chunks = [];
      // // eslint-disable-next-line no-restricted-syntax
      // for await (const chunk of result) {
      //   console.log('chunk', chunk);
      //   chunks.push(chunk);
      //   LocalStorage.set('streamResponse', chunks.join(''));
      // }
      // LocalStorage.set('isLoading', 'false');
      // const messages = LocalStorage.get('chatMessages');
      // addBotMessage(
      //   chunks.join(''),
      //   messages,
      //   'Nous-Hermes-2-Mistral-7B-DPO.Q4_0',
      // );
      // LocalStorage.set('streamResponse', '');
      // LocalStorage.set('executionDescription', '');

      // return chunks.join('');
    } catch (error) {
      console.error('Error:', error);
      return 'Error';
    }
  }

  public static async groqChatCompletion(
    prompt: string,
    mainModelEndpoint: string,
    llmModel: string,
    modelTemp: number,
  ) {
    try {
      const startTime = performance.now();
      const model = new ChatGroq({
        apiKey: process.env.GROQ_API,
        modelName: llmModel,
      }).bind({ signal: controller.signal });

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', 'You are a helpful assistant'],
        ['human', '{input}'],
      ]);
      const chain = promptTemplate.pipe(model);

      // eslint-disable-next-line no-underscore-dangle
      const stream = await chain._streamIterator({
        input: prompt,
      });

      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      const messageId = UUID.v4();
      const endTime = performance.now();
      const duration = endTime - startTime;
      addBotMessage(chunks.join(''), messageId, messages, llmModel, duration);
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return chunks.join('');
    } catch (error) {
      console.error('Error:', error);
      return 'Error';
    }
  }

  // public static async perfTestEmbeddings(pdf: string) {
  //   console.log('init perfTestEmbeddings', pdf);
  //   const loader = new PDFLoader(pdf);
  //   const docs = await loader.load();
  //   const textSplitter = new RecursiveCharacterTextSplitter({
  //     chunkSize: 512,
  //     chunkOverlap: 0,
  //   });
  //   const allSplits = await textSplitter.splitDocuments(docs);
  //   const xenovaEmbedding = new CustomHuggingFaceTransformersEmbeddings({
  //     modelName: 'Xenova/all-MiniLM-L6-v2',
  //   });
  //   const nomicEmbedding = new OllamaEmbeddings({
  //     model: 'nomic-embed-text:latest',
  //   });
  //   // const nativeEmbedding = new OllamaEmbeddings();
  //   const xenovaVector = await xenovaEmbedding.embedDocuments(
  //     allSplits.map((s) => s.pageContent),
  //   );
  //   const nomicVector = await nomicEmbedding.embedDocuments(
  //     allSplits.map((s) => s.pageContent),
  //   );
  //   // const nativeVector = await nativeEmbedding.embedDocuments(
  //   //   allSplits.map((s) => s.pageContent),
  //   // );
  //   console.log('xenovaVector', xenovaVector[1].length);
  //   console.log('nomicVector', nomicVector[1].length);
  //   // console.log('nativeVector', nativeVector);
  //   console.log('dotProduct', dotProduct(xenovaVector[1], nomicVector[1]));
  // }
}

export const generateStreamResponse = async (
  context: any,
  prompt: string,
  mainModelEndpoint: string,
  llmModel: string,
  modelTemperature: number,
) => {
  const ollama = new Ollama({
    baseUrl: mainModelEndpoint,
    model: llmModel,
    temperature: modelTemperature,
  });
  console.log('initializing stream', {
    context,
    prompt,
    mainModelEndpoint,
    llmModel,
  });
  // return false;
  if (context) {
    if (typeof context === 'string' && context.length > 0) {
      console.log('context is string', context);
      const loader = new PDFLoader(context);
      const docs = await loader.load();
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1024,
        chunkOverlap: 0,
      });
      const allSplits = await textSplitter.splitDocuments(docs);

      const embeddingModel =
        LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

      let embeddings: any = new CustomHuggingFaceTransformersEmbeddings({
        modelName: 'Xenova/all-MiniLM-L6-v2',
      });
      if (
        typeof embeddingModel === 'string' &&
        embeddingModel.includes('nomic')
      ) {
        embeddings = new OllamaEmbeddings({
          model: 'nomic-embed-text:latest',
        });
      }
      const theVectorStore = await HNSWLib.fromDocuments(allSplits, embeddings);
      const retriever = theVectorStore.asRetriever();
      const promptTemplateNarrow = PromptTemplate.fromTemplate(
        promptRAGTemplate.en,
      );
      const chain = RunnableSequence.from([
        {
          context: retriever.pipe(formatDocumentsAsString),
          question: new RunnablePassthrough(),
        },
        promptTemplateNarrow,
        ollama,
        new StringOutputParser(),
      ]);
      // eslint-disable-next-line no-underscore-dangle
      const stream = await chain._streamIterator(prompt);
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, llmModel);
      LocalStorage.set('streamResponse', '');
      return chunks.join('');
      // const result = await chain.invoke(prompt);
      // return result.toString();
    }
    if (Array.isArray(context) && context.length > 0) {
      const model = new Ollama({
        baseUrl: mainModelEndpoint,
        model: llmModel,
        temperature: modelTemperature,
      }).bind({ images: context });
      console.log('context is array', context);
      // ollama.bind({ images: context });
      const stream = await model.stream(prompt);
      // console.log('streamImage invoke', stream);
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, llmModel);
      LocalStorage.set('streamResponse', '');
      return chunks.join('');
    }
    return 'Error';
  }
  console.log('langchain normal stream?');
  const promptTemplate = PromptTemplate.fromTemplate(promptChatTemplate.en);
  const chain = RunnableSequence.from([
    {
      question: new RunnablePassthrough(),
    },
    promptTemplate,
    ollama,
    new StringOutputParser(),
  ]);
  // eslint-disable-next-line no-underscore-dangle
  const result = await chain._streamIterator(prompt);
  const chunks = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of result) {
    chunks.push(chunk);
    LocalStorage.set('streamResponse', chunks.join(''));
  }
  LocalStorage.set('isLoading', 'false');
  const messages = LocalStorage.get('chatMessages');
  const messageId = UUID.v4();

  addBotMessage(chunks.join(''), messageId, messages, llmModel);
  LocalStorage.set('streamResponse', '');
  return chunks.join('');
};

export const generateResponseWithContext = async (
  contextPath: string,
  prompt: string,
  mainModelEndpoint: string,
  llmModel: string,
  modelTemperature: number,
) => {
  try {
    // count time to run
    console.time('generateResponseWithContext');
    // const { HuggingFaceTransformersEmbeddings } = await import(
    //   '@langchain/community/embeddings/hf_transformers'
    // );
    const ollama = new Ollama({
      baseUrl: mainModelEndpoint,
      model: llmModel,
      temperature: modelTemperature,
      // template: 'promptRAGTemplate.pt',
    });
    // const embeddingPipeline =
    //   await CustomHuggingFaceTransformersEmbeddings.prototype.embedQuery(
    //     prompt,
    //   );

    // const embedModel = new embeddingPipeline({
    //   modelName: 'Xenova/all-MiniLM-L6-v2',
    // });
    const loader = new PDFLoader(contextPath);
    const docs = await loader.load();
    console.log('loaded docs');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 0,
    });
    const allSplits = await textSplitter.splitDocuments(docs);
    console.log('broke allSplits');

    // const { pipeline } = await HFTransformersApi;
    // console.log('pipeline', pipeline);

    // const modelPipe = await pipeline(
    //   'feature-extraction',
    //   'Xenova/all-MiniLM-L6-v2',
    // );
    // console.log('modelPipe', modelPipe);
    /**
     * Possible Embedding Models:
     * [Use with CustomHuggingFaceTransformersEmbeddings]
     * - Xenova/all-MiniLM-L6-v2
     * - Xenova/UAE-Large-V1
     * - Xenova/donut-base-finetuned-docvqa
     * - Xenova/bge-m3
     * [Use with OllamaEmbeddings]
     * - nomic-embed-text:latest
     */

    // const openaiEmbeddings = new OpenAIEmbeddings();
    // const customEmbed = new CustomHuggingFaceTransformersEmbeddings({
    //   modelName: 'Xenova/all-MiniLM-L6-v2',
    //   // batchSize: 512,
    //   // timeout: -1,
    // });
    // const embeddedQuery = await customEmbed.embedQuery(prompt);
    // console.log('embeddedQuery', embeddedQuery);

    // if (await milvusClient.hasCollection({ collection_name: 'ollama' })) {
    //   await milvusClient.dropCollection({ collection_name: 'ollama' });
    // }

    const embeddingModel =
      LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

    let embeddings: any = new CustomHuggingFaceTransformersEmbeddings({
      modelName: 'Xenova/all-MiniLM-L6-v2',
    });
    if (
      typeof embeddingModel === 'string' &&
      embeddingModel.includes('nomic')
    ) {
      embeddings = new OllamaEmbeddings({
        model: 'nomic-embed-text:latest',
      });
    }
    console.log('embedding with', embeddingModel);
    const theVectorStore = await HNSWLib.fromDocuments(allSplits, embeddings);

    // const theVectorStore = await Milvus.fromDocuments(
    //   allSplits,
    //   new CustomHuggingFaceTransformersEmbeddings({
    //     modelName: 'Xenova/all-MiniLM-L6-v2',
    //     // batchSize: 512,
    //     // timeout: -1,
    //   }),
    //   {
    //     url: address,
    //     collectionName: 'ollama',
    //   },
    // );
    console.log('vector stored');
    // npobe and nlist are optional
    // const searchParams: any = {
    //   params: { nlist: 2048 },
    // };
    // const resultsSearch = await milvusClient.search({
    //   collection_name: 'ollama',
    //   vector: embeddedQuery,
    //   // filter: null,
    //   // the sum of `limit` and `offset` should be less than 16384.
    //   limit: 10,
    //   offset: 2,
    //   metric_type: MetricType.L2,
    //   params: searchParams,
    //   // consistency_level: ConsistencyLevelEnum.Strong,
    // });
    // console.log('resultsSearch', resultsSearch.results);

    const retriever = theVectorStore.asRetriever();
    // console.log(
    //   'similarity search:',
    //   await theVectorStoreHNSWLib.similaritySearch(prompt),
    // );
    // return true;
    const promptTemplateNarrow = PromptTemplate.fromTemplate(
      promptRAGTemplate.en,
    );
    // const promptTemplate =
    //   PromptTemplate.fromTemplate(`Answer the question based only on the following context:
    // {context}
    // !

    // Question: {question}`);
    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
      },
      promptTemplateNarrow,
      ollama,
      new StringOutputParser(),
    ]);
    // const outputParser = new StringOutputParser();

    // const chain = prompt.pipe(model).pipe(outputParser);
    const result = await chain.invoke(prompt);
    console.log({ result });
    console.timeEnd('generateResponseWithContext');

    return result.toString();
  } catch (error) {
    console.error('Error:', error);
    return 'Error';
  }
};

export const generateResponseLangchain = async (
  images: string[],
  prompt: string,
  mainModelEndpoint: string,
  llmModel: string,
  modelTemperature: number,
) => {
  try {
    const ollama = new Ollama({
      baseUrl: mainModelEndpoint,
      model: llmModel,
      temperature: modelTemperature,
    }).bind({
      images,
    });
    // const theVectorStore = await Milvus.fromTexts(
    //   ['mitochondria is the powerhouse of the cell'],
    //   [{ id: '1' }, { id: '2' }],
    //   new OllamaEmbeddings(),
    //   {
    //     url: address,
    //   },
    // );
    // const retriever = theVectorStore.asRetriever();
    // const promptTemplate =
    //   PromptTemplate.fromTemplate(`Answer the question based only on the following context:
    // {context}
    // !

    // Question: {question}`);
    // const chain = RunnableSequence.from([
    //   {
    //     context: retriever.pipe(formatDocumentsAsString),
    //     question: new RunnablePassthrough(),
    //   },
    //   promptTemplate,
    //   ollama,
    //   new StringOutputParser(),
    // ]);

    // const result = await chain.invoke('What is the powerhouse of the cell?');
    // console.log({ result });
    // return result.toString();
    const stream = await ollama.stream(prompt);
    const chunks = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    console.log(chunks.join(''));
    return chunks.join('');
  } catch (error) {
    console.error('Error:', error);
    return 'Error';
  }
};

export async function downloadMdDocumentation(
  repoUrl: string,
  downloadPath: string,
): Promise<void> {
  try {
    // Make GET request to repository page
    const response = await axios.get(repoUrl);
    const $ = cheerio.load(response.data);
    console.log('pre-response', response);

    console.log('Downloading Markdown files...', $);
    // const repoName = repoUrl.split('/').pop();
    const rootDomain = new URL(repoUrl).hostname;

    // Create a subfolder with the repository name
    const repoFolderPath = path.join(downloadPath, rootDomain);
    if (!fs.existsSync(repoFolderPath)) {
      fs.mkdirSync(repoFolderPath);
    }

    // @ts-ignore
    $('a').each(async (index, element) => {
      const link = $(element).attr('href');
      if (link && link.endsWith('.md')) {
        // Only download Markdown files
        try {
          const resourceResponse = await axios.get(link, {
            responseType: 'arraybuffer',
          });
          const filename = path.basename(link);
          const filePath = path.join(repoFolderPath, filename);
          fs.writeFileSync(filePath, resourceResponse.data);
          console.log(`Downloaded ${filename}`);
        } catch (error) {
          console.error(`Failed to download ${link}: ${error}`);
        }
      }
    });
    console.log('finished downloading');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}
