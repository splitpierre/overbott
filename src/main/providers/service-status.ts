import Redis from 'ioredis';
import defaultEndpoints from '../data/default-endpoints';
import DockerProvider from './docker';
import LocalStorage from './local-storage';

export default class ServiceStatus {
  // Check Ollama Model Dependencies
  public static async checkOllamaModelDependencies() {
    try {
      const ollamaEndpoint = defaultEndpoints.ollama;
      if (!ollamaEndpoint) {
        return {
          hasEmbed: false,
          hasVision: false,
        };
      }
      const response = await fetch(`${ollamaEndpoint}/api/tags`);
      const data = await response.json();
      const models = data.models || [];
      // look for models: 'nomic-embed-text:latest' & 'llava:latest'
      return {
        hasEmbed: models.some(
          (model: { name: string }) => model.name === 'nomic-embed-text:latest',
        ),
        hasVision: models.some(
          (model: { name: string }) => model.name === 'llava:latest',
        ),
      };
    } catch (error) {
      console.error('Error fetching checkOllamaModelDependencies:', error);
      return {
        hasEmbed: false,
        hasVision: false,
      };
    }
  }

  // Ollama
  public static async checkOllama() {
    try {
      const ollamaEndpoint = defaultEndpoints.ollama;
      if (!ollamaEndpoint) {
        return false;
      }
      const response = await fetch(`${ollamaEndpoint}/api/tags`);

      // console.log({ response: response.status });
      // const data = await response.json();
      // console.log({ data });
      return response.status <= 400;
    } catch (error) {
      // console.error('Error fetching ollama models:', error);
      return false;
    }
  }

  // OpenAI Compatible
  public static async checkOpenAiCompatible(provider: string) {
    try {
      // @ts-ignore
      const apiKey: any = LocalStorage.get(`${provider}ApiKey`) || '';
      const endpoint =
        defaultEndpoints[provider as keyof typeof defaultEndpoints];
      if (!endpoint) {
        return false;
      }
      const response = await fetch(`${endpoint}/v1/models`, {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        },
        method: 'GET',
      });
      return response.status <= 400;
    } catch (error) {
      // console.error('Error fetching openai models:', error);
      return false;
    }
  }

  // OpenTTS
  public static async checkOpenTts() {
    try {
      const openTtsEndpoint = defaultEndpoints.openTts;
      if (!openTtsEndpoint) {
        return false;
      }
      const response = await fetch(`${openTtsEndpoint}/api/voices?language=en`);
      // const data = await response.json();
      return response.status <= 400;
    } catch (error) {
      // console.error('Error fetching openTTS models:', error);
      return false;
    }
  }

  // LlamaCpp
  public static async checkLlamaCpp() {
    try {
      const llamaCppEndpoint = defaultEndpoints.llamaCpp;
      if (!llamaCppEndpoint) {
        return false;
      }
      const response = await fetch(`${llamaCppEndpoint}/health`);
      // const data = await response.json();
      return response.status === 200;
    } catch (error) {
      // console.error('Error fetching llamaCpp models:', error);
      return false;
    }
  }

  // ComfyUi
  // public static async checkComfyUi() {
  //   try {
  //     const comfyUiEndpoint = defaultEndpoints.comfyUi;
  //     if (!comfyUiEndpoint) {
  //       return false;
  //     }
  //     const response = await fetch(`${comfyUiEndpoint}/`);
  //     // const data = await response.json();
  //     return response.status <= 400;
  //   } catch (error) {
  //     // console.error('Error fetching comfyUi models:', error);
  //     return false;
  //   }
  // }

  // GPT4All
  public static async checkGpt4All() {
    try {
      const gpt4AllEndpoint = defaultEndpoints.gpt4All;
      if (!gpt4AllEndpoint) {
        return false;
      }
      const response = await fetch(`${gpt4AllEndpoint}/v1/models`);
      // const data = await response.json();
      return response.status <= 400;
    } catch (error) {
      // console.error('Error fetching gpt4All models:', error);
      return false;
    }
  }

  // Unstructured API
  public static async checkUnstructured() {
    try {
      const unstructuredEndpoint = defaultEndpoints.unstructured;
      if (!unstructuredEndpoint) {
        return false;
      }
      const response = await fetch(
        `${unstructuredEndpoint}/general/v0/general`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      );
      // const data = await response.json();
      return response.status === 405;
    } catch (error) {
      // console.error('Error fetching unstructured models:', error);
      return false;
    }
  }

  // Diffuser API
  public static async checkDiffuser() {
    try {
      const diffuserEndpoint = defaultEndpoints.diffusersApi;
      if (!diffuserEndpoint) {
        return false;
      }
      const response = await fetch(`${diffuserEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      // const data = await response.json();
      return response.status === 200;
    } catch (error) {
      // console.error('Error fetching diffuser models:', error);
      return false;
    }
  }

  // Cohere AI
  public static async checkCohereAi() {
    try {
      const apiKey: any = LocalStorage.get('cohereAiApiKey') || '';
      const cohereEndpoint = defaultEndpoints.cohereAi;
      if (!cohereEndpoint) {
        return false;
      }
      const response = await fetch(`${cohereEndpoint}/v1/models`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        method: 'GET',
      });
      // const data = await response.json();
      // console.log('checkCohereAi ', data);
      return response.status <= 400;
    } catch (error) {
      // console.error('Error fetching cohere models:', error);
      return false;
    }
  }

  // Claude
  public static async checkClaude() {
    try {
      const apiKey: any = LocalStorage.get('claudeApiKey') || '';
      const claudeEndpoint = defaultEndpoints.claude;
      if (!claudeEndpoint) {
        return false;
      }
      const response = await fetch(`${claudeEndpoint}/v1/complete`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        method: 'POST',
        body: JSON.stringify({}),
      });
      // const data = await response.json();
      return response.status === 400;
    } catch (error) {
      // console.error('Error fetching claude models:', error);
      return false;
    }
  }

  // Docker
  public static async checkDocker() {
    try {
      const response = await DockerProvider.checkDockerInstalled();
      return response;
    } catch (error) {
      // console.error('Error fetching cohere models:', error);
      return false;
    }
  }

  // Redis
  public static async checkRedis() {
    // @ts-ignore
    const redis = new Redis({
      port: 6379,
      connectTimeout: 1000, // Adjust timeout as needed
      retryStrategy(times) {
        if (times > 2) {
          return new Error('Redis is not available');
        }
        return Math.min(times * 50, 2000);
      },
    });

    try {
      await redis.ping();
      redis.disconnect();
      return true; // Redis is available
    } catch (error) {
      redis.disconnect();
      return false; // Redis is not available
    }
  }

  public static async checkAll() {
    return {
      docker: await this.checkDocker(),
      ollama: await this.checkOllama(),
      llamaCpp: await this.checkLlamaCpp(),
      gpt4All: await this.checkGpt4All(),
      redis: await this.checkRedis(),
      unstructured: await this.checkUnstructured(),
      openTts: await this.checkOpenTts(),
      diffusersApi: await this.checkDiffuser(),
      openAi: await this.checkOpenAiCompatible('openAi'),
      mistralAi: await this.checkOpenAiCompatible('mistralAi'),
      groq: await this.checkOpenAiCompatible('groq'),
      cohereAi: await this.checkCohereAi(),
      claude: await this.checkClaude(),
      // comfyUi: await this.checkComfyUi(),
    };
  }
}
