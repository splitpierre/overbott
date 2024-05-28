import { OllamaGenerateParams } from '../types/ollama-types';

export default class OllamaProvider {
  public static async fetchOllamaModels(endpoint: string) {
    try {
      const response = await fetch(`${endpoint}/api/tags`);
      const data = await response.json();
      return data.models || [{}];
    } catch (error) {
      console.error('Error fetching ollama models:', error);
      window.electron.dialog.error(
        'Error fetching Ollama models',
        'Make sure Ollama service is running and you have some models available.',
      );
    }
    return [{}];
  }

  public static async ollamaGenerate(
    endpoint: string,
    params: OllamaGenerateParams,
  ) {
    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      if (!response.ok || !response.body) {
        throw response.statusText;
      }
      return response.body;
    } catch (error) {
      console.error('Error fetching ollama models:', error);
      window.electron.dialog.error(
        'Error Generating Ollama Response',
        'Make sure Ollama service is running and you have some models available.',
      );
      return [];
    }
  }

  public static async ollamaPullModel(endpoint: string, name: string) {
    try {
      const response = await fetch(`${endpoint}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok || !response.body) {
        throw response.statusText;
      }
      return response.body;
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      window.electron.dialog.error(
        'Error Pulling Ollama Model',
        'Make sure Ollama service is running and you have some models available.',
      );
      return [];
    }
  }

  public static async ollamaDeleteModel(endpoint: string, name: string) {
    try {
      const response = await fetch(`${endpoint}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok || !response.body) {
        throw response.statusText;
      }
      return response.body;
    } catch (error) {
      console.error('Error deleting Ollama models:', error);
      window.electron.dialog.error(
        'Error Deleting Ollama Model',
        'Make sure Ollama service is running and you have some models available.',
      );
      return [];
    }
  }
}
