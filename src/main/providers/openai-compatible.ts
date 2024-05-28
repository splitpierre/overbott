export default class OpenAICompatibleProvider {
  public static async fetchModels(endpoint: string, apiKey: string) {
    try {
      console.log('OpenAICompatibleProvider fetchModels:', endpoint, apiKey);
      const response = await fetch(`${endpoint}/v1/models`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        method: 'GET',
      });
      const data = await response.json();
      console.log('OpenAICompatibleProvider models:', data);
      return data.data || [{}];
    } catch (error) {
      console.error('Error fetching  models:', error);
      window.electron.dialog.error(
        'Error fetching models',
        'Make sure service is running and you have some models available.',
      );
    }
    return [{}];
  }

  // public static async ollamaGenerate(
  //   endpoint: string,
  //   params: OllamaGenerateParams,
  // ) {
  //   try {
  //     const response = await fetch(`${endpoint}/api/generate`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(params),
  //     });
  //     if (!response.ok || !response.body) {
  //       throw response.statusText;
  //     }
  //     return response.body;
  //   } catch (error) {
  //     console.error('Error fetching ollama models:', error);
  //     window.electron.dialog.error(
  //       'Error Generating Ollama Response',
  //       'Make sure Ollama service is running and you have some models available.',
  //     );
  //     return [];
  //   }
  // }

  // public static async ollamaPullModel(endpoint: string, name: string) {
  //   try {
  //     const response = await fetch(`${endpoint}/api/pull`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ name }),
  //     });
  //     if (!response.ok || !response.body) {
  //       throw response.statusText;
  //     }
  //     return response.body;
  //   } catch (error) {
  //     console.error('Error fetching Ollama models:', error);
  //     window.electron.dialog.error(
  //       'Error Pulling Ollama Model',
  //       'Make sure Ollama service is running and you have some models available.',
  //     );
  //     return [];
  //   }
  // }

  // public static async ollamaDeleteModel(endpoint: string, name: string) {
  //   try {
  //     const response = await fetch(`${endpoint}/api/delete`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ name }),
  //     });
  //     if (!response.ok || !response.body) {
  //       throw response.statusText;
  //     }
  //     return response.body;
  //   } catch (error) {
  //     console.error('Error deleting Ollama models:', error);
  //     window.electron.dialog.error(
  //       'Error Deleting Ollama Model',
  //       'Make sure Ollama service is running and you have some models available.',
  //     );
  //     return [];
  //   }
  // }
}
