/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { formatDocumentsAsString } from 'langchain/util/document';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { OpenAI, ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MistralAIEmbeddings, ChatMistralAI } from '@langchain/mistralai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { RedisChatMessageHistory } from '@langchain/community/stores/message/ioredis';
import { ChatGroq } from '@langchain/groq';
import { DocumentInterface } from '@langchain/core/documents';
import { BaseMessage } from '@langchain/core/messages';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ChatAnthropic } from '@langchain/anthropic';
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableWithMessageHistory,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Ollama } from '@langchain/community/llms/ollama';
import * as path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import {
  RecursiveCharacterTextSplitter,
  CharacterTextSplitter,
} from 'langchain/text_splitter';
import { app } from 'electron';
import { CohereRerank } from '@langchain/cohere';
import * as UUID from 'uuid';
import { fork } from 'child_process';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import CustomHuggingFaceTransformersEmbeddings from '../embeddings/custom-hf-embedding';
import LocalStorage from './local-storage';
import defaultEndpoints from '../data/default-endpoints';
import { ChatLogMessage, ChatTypes } from '../types/app-types';
import { StableDiffusionBody } from '../types/stable-diffusion-types';
import systemPrompts from '../data/system-prompts';
import { countTokenSum } from '../helpers/util';
import ServiceStatus from './service-status';

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
export const addBotMessage = (
  message: string,
  messageId: string,
  messages: any,
  model: string,
  duration?: number,
  generationData?: any,
  author?: string,
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

const selectEmbeddingModel = (embeddingModel: string) => {
  const service: any = LocalStorage.get('llmService') || '';
  const ollamaModelDependencies: any = LocalStorage.get(
    'ollamaModelDependencies',
  );
  // @ts-ignore
  const mainServiceApiKey: any = LocalStorage.get(`${service}ApiKey`)
    ? // @ts-ignore
      (LocalStorage.get(`${service}ApiKey`) as Record<string, unknown>)[
        service as string
      ]
    : 'sk-1';
  // DEFAULT EMBEDDING
  let embeddings: any = new CustomHuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
  });

  // OLLAMA EMBEDDINGS
  if (
    typeof embeddingModel === 'string' &&
    embeddingModel.includes('nomic') &&
    ollamaModelDependencies.hasEmbed
  ) {
    embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text:latest',
    });
  }

  // NATIVE EMBEDDINGS
  if (typeof embeddingModel === 'string' && embeddingModel.includes('native')) {
    if (service === 'openAi') {
      embeddings = new OpenAIEmbeddings({
        openAIApiKey: mainServiceApiKey,
        batchSize: 512,
        modelName: 'text-embedding-3-large',
      });
    }
    if (service === 'mistralAi') {
      embeddings = new MistralAIEmbeddings({
        apiKey: mainServiceApiKey,
      });
    }
  }
  return embeddings;
};

let controller: AbortController = new AbortController();

const RESOURCES_PATH = app.isPackaged ? `${process.resourcesPath}` : __dirname;
// console.log('test worker path', {
//   dir: __dirname,
//   processResourcesPath: process.resourcesPath,
//   isPackaged: app.isPackaged,
//   RESOURCES_PATH,
//   workerPath: path.join(RESOURCES_PATH, './assets/workers/image-worker.js'),
// });
const lastPath = app.isPackaged
  ? './assets/workers/image-worker.js'
  : '../../../assets/workers/image-worker.js';
const worker = fork(path.join(RESOURCES_PATH, lastPath));
const openAiCompatibleServices = [
  'mistralAi',
  'openAi',
  'llamaCpp',
  'groq',
  'gpt4All',
];

export class LangchainProviderV2 {
  /**
   * Aborts current request
   */
  public static async abortRequest() {
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
    // worker.send({
    //   signal: 'abort',
    // });
  }

  public static async interactionStarter(chatType: ChatTypes, args: any) {
    const { prompt, context, stream } = args;

    // Route interaction
    // if (prompt.includes('/search')) return this.searchWeb(prompt);
    // if (prompt.includes('/play')) return this.searchVideo(prompt);
    if (prompt.includes('/imagine')) return this.imageGenerate(prompt);
    if (chatType === 'completion') return this.legacyCompletion(prompt);
    if (chatType === 'chat-completion')
      return this.chatCompletion(prompt, true);
    if (chatType === 'chat-completion-memory')
      return this.chatCompletionWithMemory(prompt, context);
    if (chatType === 'rag-completion')
      return this.ragCompletion(prompt, context, true);
    if (chatType === 'vision-completion')
      return this.visionCompletion(prompt, context);
  }

  /**
   * Legacy Completion
   */
  static async legacyCompletion(prompt: string) {
    LocalStorage.set('executionDescription', 'Initiate Legacy Completion');
    const startTime = performance.now();

    // const startTime = performance.now();
    const service: any = LocalStorage.get('llmService') || '';
    const modelName: any = LocalStorage.get('llmModel') || '';
    const temperature: any = LocalStorage.get('modelTemperature') || 0.5;
    const topP: any = LocalStorage.get('topP') || 1;
    const presencePenalty: any = LocalStorage.get('presencePenalty') || 0;
    const frequencyPenalty: any = LocalStorage.get('frequencyPenalty') || 0;
    // @ts-ignore
    const serviceApiKey: any = LocalStorage.get(`${service}ApiKey`)
      ? // @ts-ignore
        (LocalStorage.get(`${service}ApiKey`) as Record<string, unknown>)[
          service as string
        ]
      : 'sk-1';
    const endpoint: any = LocalStorage.get('mainModelEndpoint') || '';
    const servicesStatus: any = LocalStorage.get('servicesStatus') || {};
    console.log('Legacy Completion Pre-check', {
      prompt,
      service,
      modelName,
      endpoint,
      serviceApiKey,
      servicesStatus,
      serviceCheck: (servicesStatus as Record<string, boolean>)[
        service as string
      ],
    });

    if (
      prompt &&
      service &&
      modelName &&
      endpoint &&
      serviceApiKey &&
      (servicesStatus as Record<string, boolean>)[service as string] === true
    ) {
      LocalStorage.set('executionDescription', 'Generating response...');
      let model: any;

      if (openAiCompatibleServices.includes(service)) {
        model = new OpenAI({
          openAIApiKey: serviceApiKey,
          configuration: {
            // @ts-ignore
            baseURL: `${defaultEndpoints[service]}/v1`,
          },
          streaming: true,
          modelName,
          temperature,
          topP,
          presencePenalty,
          frequencyPenalty,
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
      }
      if (service === 'ollama') {
        model = new Ollama({
          baseUrl: endpoint,
          model: modelName,
          topP,
          frequencyPenalty,
          presencePenalty,
          temperature,
          callbacks: [
            {
              handleLLMEnd(output) {
                countTokenSum(output);
              },
            },
          ],
        }).bind({ signal: controller.signal });
      }
      const systemPrompt = LocalStorage.get('systemPrompt') || '';
      let systemPromptInput = '';
      if (systemPrompt && typeof systemPrompt === 'string') {
        systemPromptInput =
          systemPrompts[systemPrompt as keyof typeof systemPrompts] || '';
      }
      if (systemPromptInput)
        systemPromptInput += '\n Input/Question: {question} \nResponse/Answer:';
      console.log('systemPromptInput', systemPromptInput);
      // TODO: make those promptTemplate dynamic
      const promptTemplate = PromptTemplate.fromTemplate(
        systemPromptInput || promptChatTemplate.en,
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
      // eslint-disable-next-line no-underscore-dangle
      const stream = await chain._streamIterator(prompt);
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      console.log('chunks', chunks);
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messageId = UUID.v4();
      addBotMessage(chunks.join(''), messageId, messages, modelName, duration);
      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');
      return chunks.join('');
    }
  }

  /**
   * Chat Completion
   */

  public static async chatCompletion(prompt: string, shouldStream?: boolean) {
    LocalStorage.set('executionDescription', 'Initiate Chat Completion');
    const startTime = performance.now();
    const service: any = LocalStorage.get('llmService') || '';
    const servicesStatus: any = LocalStorage.get('servicesStatus') || {};
    const serviceCheck = (servicesStatus as Record<string, boolean>)[
      service as string
    ];
    const modelName: any = LocalStorage.get('llmModel') || '';
    const temperature: any = LocalStorage.get('modelTemperature') || 0.5;
    const topP: any = LocalStorage.get('topP') || 1;
    const presencePenalty: any = LocalStorage.get('presencePenalty') || 0;
    const frequencyPenalty: any = LocalStorage.get('frequencyPenalty') || 0;
    // @ts-ignore
    const serviceApiKey: any = LocalStorage.get(`${service}ApiKey`)
      ? // @ts-ignore
        (LocalStorage.get(`${service}ApiKey`) as Record<string, unknown>)
      : 'sk-1';
    const endpoint: any =
      LocalStorage.get('mainModelEndpoint') ||
      (defaultEndpoints as Record<string, string>)[service] ||
      '';
    let model: any;

    console.log('chatCompletion eval', {
      prompt,
      service,
      modelName,
      endpoint,
      serviceApiKey,
      servicesStatus,
      serviceCheck,
    });
    if (serviceCheck) {
      // LOAD MODEL WITH OPENAI COMPATIBLE INTERFACE
      if (openAiCompatibleServices.includes(service)) {
        model = new ChatOpenAI({
          openAIApiKey: serviceApiKey,
          configuration: {
            // @ts-ignore
            baseURL: `${endpoint}/v1`,
          },
          streaming: shouldStream,
          modelName,
          temperature,
          topP,
          presencePenalty,
          frequencyPenalty,
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
      }
      if (service === 'mistralAi') {
        model = new ChatMistralAI({
          apiKey: serviceApiKey,
          streaming: shouldStream,
          modelName,
          temperature,
          topP,
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
      }
      // LOAD MODEL WITH OLLAMA INTERFACE
      if (service === 'ollama') {
        model = new ChatOllama({
          baseUrl: endpoint,
          model: modelName,
          topP,
          frequencyPenalty,
          presencePenalty,
          temperature,
          callbacks: [
            {
              handleLLMEnd(output) {
                countTokenSum(output);
              },
            },
          ],
        }).bind({ signal: controller.signal });
      }
      // CLAUDE
      if (service === 'claude') {
        model = new ChatAnthropic({
          anthropicApiKey: serviceApiKey,
          streaming: true,
          modelName,
          temperature,
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
      }
      console.log('selectedModel', model);
      LocalStorage.set('executionDescription', 'Generating response...');
      // console.log('langchain normal stream?');
      const systemPrompt = LocalStorage.get('systemPrompt') || '';
      let systemPromptInput = '';
      if (systemPrompt && typeof systemPrompt === 'string') {
        systemPromptInput =
          systemPrompts[systemPrompt as keyof typeof systemPrompts] || '';
      }
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPromptInput],
        ['human', '{question}'],
      ]);
      console.log('promptTemplate', promptTemplate);
      const chain = promptTemplate.pipe(model);

      if (!shouldStream) {
        const response: any = await chain.invoke({
          question: prompt,
        });
        const messages = LocalStorage.get('chatMessages');
        // Your function execution code here
        const endTime = performance.now();
        const duration = endTime - startTime;
        const messageId = UUID.v4();
        addBotMessage(
          response.content,
          messageId,
          messages,
          modelName,
          duration,
        );
        LocalStorage.set('isLoading', 'false');
        LocalStorage.set('executionDescription', '');

        return response.content;
      }
      const stream: any = await chain.stream({
        question: prompt,
      });
      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        chunks.push(chunk.content);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      // Your function execution code here
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, modelName, duration);

      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return chunks.join('');
    }
    LocalStorage.set('isLoading', 'false');
    LocalStorage.set('streamResponse', '');
    LocalStorage.set('executionDescription', '');
    addBotMessage(
      'Sorry, the service is not available at the moment',
      UUID.v4(),
      LocalStorage.get('chatMessages'),
      'system',
      0,
      null,
      'system',
    );
    return false;
  }

  /**
   * Chat Completion with Memory
   */
  public static async chatCompletionWithMemory(
    prompt: string,
    context: string | string[],
  ) {
    LocalStorage.set('executionDescription', 'Initiate Chat Completion');
    const startTime = performance.now();
    const service: any = LocalStorage.get('llmService') || '';
    const servicesStatus: any = LocalStorage.get('servicesStatus') || {};
    const serviceCheck = (servicesStatus as Record<string, boolean>)[
      service as string
    ];
    const modelName: any = LocalStorage.get('llmModel') || '';
    const temperature: any = LocalStorage.get('modelTemperature') || 0.5;
    const topP: any = LocalStorage.get('topP') || 1;
    const presencePenalty: any = LocalStorage.get('presencePenalty') || 0;
    const frequencyPenalty: any = LocalStorage.get('frequencyPenalty') || 0;
    // @ts-ignore
    const serviceApiKey: any = LocalStorage.get(`${service}ApiKey`)
      ? // @ts-ignore
        (LocalStorage.get(`${service}ApiKey`) as Record<string, unknown>)
      : 'sk-1';
    const endpoint: any =
      LocalStorage.get('mainModelEndpoint') ||
      (defaultEndpoints as Record<string, string>)[service] ||
      '';
    let model: any;

    console.log('chatCompletion eval', {
      prompt,
      service,
      modelName,
      endpoint,
      serviceApiKey,
      servicesStatus,
      serviceCheck,
    });
    if (serviceCheck) {
      // LOAD MODEL WITH OPENAI COMPATIBLE INTERFACE
      if (openAiCompatibleServices.includes(service)) {
        model = new ChatOpenAI({
          openAIApiKey: serviceApiKey,
          configuration: {
            // @ts-ignore
            baseURL: `${endpoint}/v1`,
          },
          streaming: true,
          modelName,
          temperature,
          topP,
          presencePenalty,
          frequencyPenalty,
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
      }
      if (service === 'mistralAi') {
        model = new ChatMistralAI({
          apiKey: serviceApiKey,
          streaming: true,
          modelName,
          temperature,
          topP,
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
      }
      // LOAD MODEL WITH OLLAMA INTERFACE
      if (service === 'ollama') {
        model = new ChatOllama({
          baseUrl: endpoint,
          model: modelName,
          topP,
          frequencyPenalty,
          presencePenalty,
          temperature,
          callbacks: [
            {
              handleLLMEnd(output) {
                countTokenSum(output);
              },
            },
          ],
        }).bind({ signal: controller.signal });
      }
      // Claude
      if (service === 'claude') {
        model = new ChatAnthropic({
          anthropicApiKey: serviceApiKey,
          streaming: true,
          modelName,
          temperature,
          topP,
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
      }

      // console.log('selectedModel', model);
      LocalStorage.set('executionDescription', 'Generating response...');
      // console.log('langchain normal stream?');
      const systemPrompt = LocalStorage.get('systemPrompt') || '';
      let systemPromptInput = '';
      if (systemPrompt && typeof systemPrompt === 'string') {
        systemPromptInput =
          systemPrompts[systemPrompt as keyof typeof systemPrompts] || '';
      }
      // console.log('systemPromptInput', systemPromptInput);
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPromptInput],
        new MessagesPlaceholder('history'),
        ['human', '{input}'],
      ]);
      // console.log('promptTemplate', promptTemplate);
      const memory = new BufferMemory({
        returnMessages: true,
        chatHistory: new RedisChatMessageHistory({
          sessionId: 'overbott', // Or some other unique identifier for the conversation
          // sessionTTL: 300, // 5 minutes, omit this parameter to make sessions never expire
          url: 'redis://localhost:6379', // Default value, override with your own instance's URL
        }),
      });
      // console.log('memory', memory);
      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());
      const chainWithHistory = new RunnableWithMessageHistory({
        runnable: chain,
        inputMessagesKey: 'input',
        historyMessagesKey: 'history',
        getMessageHistory: async (sessionId) => {
          console.log(
            'intercepted getMessageHistory',
            await memory.chatHistory.getMessages(),
          );
          return memory.chatHistory;
        },
      });
      // const chain = new ConversationChain({
      //   llm: model,
      //   memory,
      //   prompt: promptTemplate,
      // });
      // const chain = RunnableSequence.from([
      //   {
      //     input: (initialInput) => initialInput.input,
      //     memory: () => memory.loadMemoryVariables({}),
      //   },
      //   {
      //     input: (previousOutput) => previousOutput.input,
      //     history: (previousOutput) => previousOutput.memory.input,
      //   },
      //   promptTemplate,
      //   model,
      //   new StringOutputParser(),
      // ]);
      // console.log('chain', chain);

      // eslint-disable-next-line no-restricted-syntax, no-underscore-dangle
      const stream: any = await chainWithHistory.stream(
        {
          input: prompt,
        },
        {
          configurable: {
            sessionId: 'overbott',
          },
        },
      );
      // console.log('stream', stream);

      const chunks = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        // console.log('chunk', chunk);
        chunks.push(chunk);
        LocalStorage.set('streamResponse', chunks.join(''));
      }
      LocalStorage.set('isLoading', 'false');
      const messages = LocalStorage.get('chatMessages');
      // Your function execution code here
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messageId = UUID.v4();

      addBotMessage(chunks.join(''), messageId, messages, modelName, duration);

      LocalStorage.set('streamResponse', '');
      LocalStorage.set('executionDescription', '');

      return chunks.join('');
    }
  }

  /**
   * RAG Completion
   */
  public static async ragCompletion(
    prompt: string,
    contexts: string[],
    shouldStream?: boolean,
  ) {
    console.log('ragCompletion init', prompt, contexts);
    const startTime = performance.now();
    LocalStorage.set('executionDescription', 'Initiate RAG Completion');
    const service: any = LocalStorage.get('llmService') || '';
    const servicesStatus: any = LocalStorage.get('servicesStatus') || {};
    const serviceCheck = (servicesStatus as Record<string, boolean>)[
      service as string
    ];
    const modelName: any = LocalStorage.get('llmModel') || '';
    const temperature: any = LocalStorage.get('modelTemperature') || 0.5;
    const topP: any = LocalStorage.get('topP') || 1;
    const presencePenalty: any = LocalStorage.get('presencePenalty') || 0;
    const frequencyPenalty: any = LocalStorage.get('frequencyPenalty') || 0;
    // @ts-ignore
    const serviceApiKey: any = LocalStorage.get(`${service}ApiKey`)
      ? // @ts-ignore
        (LocalStorage.get(`${service}ApiKey`) as Record<string, unknown>)[
          service as string
        ]
      : 'sk-1';
    const endpoint: any =
      LocalStorage.get('mainModelEndpoint') ||
      (defaultEndpoints as Record<string, string>)[service] ||
      '';
    const cohereCheck = (servicesStatus as Record<string, boolean>).cohereAi;
    let model: any;
    const promptTemplateNarrow = PromptTemplate.fromTemplate(
      promptRAGTemplate.en,
    );

    console.log('ragCompletion eval', {
      prompt,
      service,
      modelName,
      endpoint,
      serviceApiKey,
      servicesStatus,
      serviceCheck,
    });
    if (serviceCheck) {
      // LOAD MODEL WITH OPENAI COMPATIBLE INTERFACE
      if (openAiCompatibleServices.includes(service)) {
        model = new OpenAI({
          openAIApiKey: serviceApiKey,
          configuration: {
            // @ts-ignore
            baseURL: `${endpoint}/v1`,
          },
          streaming: shouldStream,
          modelName,
          temperature,
          topP,
          presencePenalty,
          frequencyPenalty,
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
      }
      // LOAD MODEL WITH OLLAMA INTERFACE
      if (service === 'ollama') {
        model = new Ollama({
          baseUrl: endpoint,
          model: modelName,
          topP,
          frequencyPenalty,
          presencePenalty,
          temperature,
          callbacks: [
            {
              handleLLMEnd(output) {
                countTokenSum(output);
              },
            },
          ],
        }).bind({ signal: controller.signal });
      }
      console.log('selectedModel', model);

      if (contexts && contexts.length > 0) {
        if (shouldStream) {
          contexts.map(async (context, i) => {
            console.log('ragCompletion map context', context);
            LocalStorage.set('isLoading', 'true');
            if (typeof context === 'string' && context.length > 0) {
              LocalStorage.set(
                'executionDescription',
                `Parsing file #${i} (${context})...`,
              );
              const prepRag = await this.prepareDocumentsForRAG(
                context,
                prompt,
              );
              console.log('prepRag', prepRag);
              let chain: any;
              LocalStorage.set('executionDescription', 'Preparing chain...');
              if (!cohereCheck) {
                console.log(
                  'no cohere available, retrive from embed:',
                  prepRag.embeddings,
                );

                const theVectorStore = await MemoryVectorStore.fromDocuments(
                  prepRag.promptDocs,
                  prepRag.embeddings,
                );
                const retriever = theVectorStore.asRetriever();
                chain = RunnableSequence.from([
                  {
                    question: new RunnablePassthrough(),
                    context: retriever.pipe(formatDocumentsAsString),
                  },
                  promptTemplateNarrow,
                  model,
                  new StringOutputParser(),
                ]);
              } else {
                chain = await createStuffDocumentsChain({
                  llm: model,
                  prompt: promptTemplateNarrow,
                  outputParser: new StringOutputParser(),
                });
                console.log('cohere available, use cohere compress:', chain);
              }

              LocalStorage.set(
                'executionDescription',
                'Initiate response generation',
              );
              console.log('start stream from', {
                question: prompt,
                context: prepRag.promptDocs.length,
              });

              let streamInput;
              if (!cohereCheck) {
                streamInput = prompt;
              } else {
                streamInput = {
                  question: prompt,
                  context: prepRag.promptDocs,
                };
              }
              // eslint-disable-next-line no-underscore-dangle
              const stream = await chain._streamIterator(streamInput);
              const chunks = [];
              // eslint-disable-next-line no-restricted-syntax
              for await (const chunk of stream) {
                chunks.push(chunk);
                LocalStorage.set('streamResponse', chunks.join(''));
              }
              const messages = LocalStorage.get('chatMessages');
              const endTime = performance.now();
              const duration = endTime - startTime;
              const messageId = UUID.v4();
              addBotMessage(
                chunks.join(''),
                messageId,
                messages,
                modelName,
                duration,
              );
              LocalStorage.set('streamResponse', '');
            }
            LocalStorage.set('isLoading', 'false');
            LocalStorage.set('executionDescription', '');
          });
        } else {
          // for (let i = 0; i < contexts.length; i += 1) {
          //   LocalStorage.set('isLoading', 'true');
          //   if (typeof contexts[i] === 'string' && contexts[i].length > 0) {
          //     LocalStorage.set(
          //       'executionDescription',
          //       `Parsing file #${i} (${contexts[i]})...`,
          //     );
          //     const prepRag = await this.prepareDocumentsForRAG(
          //       contexts[i],
          //       prompt,
          //     );
          //     console.log('prepRag', prepRag);
          //     let chain: any;
          //     LocalStorage.set('executionDescription', 'Preparing chain...');
          //     if (!cohereCheck) {
          //       console.log(
          //         'no cohere available, retrive from embed:',
          //         prepRag.embeddings,
          //       );
          //       const theVectorStore = await MemoryVectorStore.fromDocuments(
          //         prepRag.promptDocs,
          //         prepRag.embeddings,
          //       );
          //       const retriever = theVectorStore.asRetriever();
          //       chain = RunnableSequence.from([
          //         {
          //           question: new RunnablePassthrough(),
          //           context: retriever.pipe(formatDocumentsAsString),
          //         },
          //         promptTemplateNarrow,
          //         model,
          //         new StringOutputParser(),
          //       ]);
          //     } else {
          //       chain = await createStuffDocumentsChain({
          //         llm: model,
          //         prompt: promptTemplateNarrow,
          //         outputParser: new StringOutputParser(),
          //       });
          //       console.log('cohere available, use cohere compress:', chain);
          //     }
          //     LocalStorage.set(
          //       'executionDescription',
          //       'Initiate response generation',
          //     );
          //     console.log('start response from', {
          //       question: prompt,
          //       context: prepRag.promptDocs,
          //     });
          //     // eslint-disable-next-line no-underscore-dangle
          //     const stream = await chain._streamIterator({
          //       question: prompt,
          //       context: prepRag.promptDocs,
          //     });
          //     const chunks = [];
          //     // eslint-disable-next-line no-restricted-syntax
          //     for await (const chunk of stream) {
          //       chunks.push(chunk);
          //       LocalStorage.set('streamResponse', chunks.join(''));
          //     }
          //     const messages = LocalStorage.get('chatMessages');
          //     const endTime = performance.now();
          //     const duration = endTime - startTime;
          //     const messageId = UUID.v4();
          //     addBotMessage(
          //       chunks.join(''),
          //       messageId,
          //       messages,
          //       modelName,
          //       duration,
          //     );
          //     LocalStorage.set('streamResponse');
          //     LocalStorage.set('isLoading', 'false');
          //     LocalStorage.set('executionDescription', '');
          //   }
          // }
        }
      }
    } else {
      LocalStorage.set('executionDescription', 'Error: Service not available');
    }
    // LocalStorage.set('isLoading', 'false');
  }

  /**
   * Vision Completion
   */
  public static async visionCompletion(
    prompt: string,
    context: string | string[],
  ) {
    LocalStorage.set('executionDescription', 'Initiate Vision Completion');
  }

  /**
   * Image Generation
   */
  static async imageGenerate(prompt: string) {
    LocalStorage.set('executionDescription', 'Initiate Image Generate');
    const startTime = performance.now();
    const imageModel = 'runwayml/stable-diffusion-v1-5';
    console.log('worker txt2img init');
    const messageId = UUID.v4();

    addBotMessage(
      `![image](...generating...)`,
      messageId,
      LocalStorage.get('chatMessages'),
      imageModel,
    );
    const imgPrompt = prompt.replace('/imagine', '');
    const diffusionSteps = (LocalStorage.get('diffusionSteps') as number) || 50;
    const stableDiffusionBody: StableDiffusionBody = {
      modelInputs: {
        prompt: imgPrompt,
        num_inference_steps: diffusionSteps, // 25-50
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
    return 'Generating...';
  }

  /**
   * Prepare Documents for RAG
   */
  static async prepareDocumentsForRAG(context: string, prompt: string) {
    const embeddingModel: any =
      LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

    const servicesStatus: any = LocalStorage.get('servicesStatus') || {};
    const cohereCheck = (servicesStatus as Record<string, boolean>).cohereAi;
    const unstructuredCheck = (servicesStatus as Record<string, boolean>)
      .unstructured;
    let promptDocs: DocumentInterface[] = [];
    if (typeof context === 'string' && context.length > 0) {
      // LOAD DOCUMENT
      let loader;

      if (unstructuredCheck) {
        loader = new UnstructuredLoader(context, {
          apiUrl: `${defaultEndpoints.unstructured}/general/v0/general`,
          // pdfInferTableStructure: true,
        });
      } else {
        // TODO: Improve generic file loading for RAG, we might receive other file types
        loader = new PDFLoader(context);
      }

      const docs = await loader.load();
      console.log('docsLength 1', docs.length);
      promptDocs = docs;
      if (!unstructuredCheck) {
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: embeddingModel === 'Xenova/all-MiniLM-L6-v2' ? 380 : 2048,
          chunkOverlap: 3,
        });
        const allSplits = await textSplitter.splitDocuments(docs);
        promptDocs = allSplits;
        console.log('docsLength 2', promptDocs.length);
      }

      // RERANK DOCUMENTS IF COHERE IS AVAILABLE
      if (cohereCheck) {
        const cohereRerank = new CohereRerank({
          apiKey: process.env.COHERE_API_KEY,
          topN: 5,
          model: 'rerank-multilingual-2',
        });

        promptDocs = await cohereRerank.compressDocuments(promptDocs, prompt);
        console.log('cohereRerank', promptDocs);
      }
    }
    return {
      promptDocs,
      embeddings: selectEmbeddingModel(embeddingModel),
    };
  }

  /**
   * Prepare Messages for RAG
   */
  static async prepareMessagesForRAG(prompt: string) {
    const chatMessages: ChatLogMessage[] = LocalStorage.get(
      'chatMessages',
    ) as ChatLogMessage[];
    console.log('prepareMessagesForRAG chatMessages', chatMessages);
    // const embeddingModel: any =
    //   LocalStorage.get('embeddingModel') || 'Xenova/all-MiniLM-L6-v2';

    // const servicesStatus: any = LocalStorage.get('servicesStatus') || {};
    // const cohereCheck = (servicesStatus as Record<string, boolean>).cohereAi;
    // console.log('eval', { chatMessages, prompt, embeddingModel, cohereCheck });
    // let messageHistory: BaseMessage[] = [];

    const newMessages: string[] = [];
    // loop chat messages and prepare array of strings
    chatMessages.forEach((message: any) => {
      newMessages.push(`${message.author}: ${message.message}`);
    });
    // const selectedEmbeddingModel = selectEmbeddingModel(embeddingModel);

    const xenovaMemVectorStore = await MemoryVectorStore.fromTexts(
      newMessages,
      {},
      new CustomHuggingFaceTransformersEmbeddings({
        modelName: 'Xenova/all-MiniLM-L6-v2',
      }),
    );
    const nomicMemVectorStore = await MemoryVectorStore.fromTexts(
      newMessages,
      {},
      new OllamaEmbeddings({
        model: 'nomic-embed-text:latest',
      }),
    );

    const embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text:latest',
    });
    const embeddingsX = new CustomHuggingFaceTransformersEmbeddings({
      modelName: 'Xenova/all-MiniLM-L6-v2',
    });

    return {
      top: {
        msg: [],
      },
      left: {
        xenovaMemVectorStore:
          await xenovaMemVectorStore.similaritySearchWithScore(prompt, 3),
        // xenovaPromptEmbedded: await embeddingsX.embedQuery(prompt),
        // xenovaSimilaritySearchWithScore:
        //   await xenovaVectorStore.similaritySearchWithScore(prompt, 3),
      },
      right: {
        nomicMemVectorStore:
          await nomicMemVectorStore.similaritySearchWithScore(prompt, 3),
        // nomicPromptEmbedded: await embeddings.embedQuery(prompt),
        // nomicSimilaritySearchWithScore:
        //   await nomicVectorStore.similaritySearchWithScore(prompt, 3),
      },
    };
    // if (cohereCheck) {
    //   const cohereRerank = new CohereRerank({
    //     apiKey: process.env.COHERE_API_KEY,
    //     topN: 3,
    //     model: 'rerank-multilingual-2',
    //   });

    //   const sampleDoc: DocumentInterface = {
    //     pageContent: 'This is a sample document',
    //     metadata: {
    //       title: 'Sample Document',
    //     },
    //   };

    //   messageHistory = await cohereRerank.compressDocuments(messages, prompt);
    //   console.log('cohereRerank', messageHistory);
    // }
  }
}
