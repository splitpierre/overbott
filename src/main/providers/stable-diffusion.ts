import defaultEndpoints from '../data/default-endpoints';
import LocalStorage from './local-storage';

/**
 * example Body
 {
  "modelInputs": {
    "prompt": "Super dog",
    "num_inference_steps": 50,
    "guidance_scale": 7.5,
    "width": 512,
    "height": 512,
    "seed": 3239022079
  },
  "callInputs": {
    "MODEL_ID": "runwayml/stable-diffusion-v1-5",
    "PIPELINE": "StableDiffusionPipeline",
    "SCHEDULER": "LMSDiscreteScheduler",
    "safety_checker": true
  }
}
 *
 */
let controller: AbortController = new AbortController();

class DiffusersApiProvider {
  /**
   * Aborts the current stream
   */
  public static async abortRequest() {
    LocalStorage.set('executionDescription', 'Aborting request');

    LocalStorage.set('streamResponse', '');
    LocalStorage.set('isLoading', 'false');
    controller.abort();
    controller = new AbortController();
    LocalStorage.set('executionDescription', '');
  }

  public static async textToImage(text: string) {
    const image = await fetch(defaultEndpoints.diffusersApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelInputs: {
          prompt: text,
          num_inference_steps: 25, // 25-50
          guidance_scale: 7.5,
          width: 512,
          height: 512,
          seed: 3239022079,
        },
        callInputs: {
          MODEL_ID: 'runwayml/stable-diffusion-v1-5',
          PIPELINE: 'StableDiffusionPipeline',
          SCHEDULER: 'LMSDiscreteScheduler',
          safety_checker: true,
        },
      }),
      signal: controller.signal,
    });
    const imageJson = await image.json();
    const base64Image = imageJson.image_base64;
    // repair base64 string
    // const base64ImageRepaired = base64Image
    //   .replace(/_/g, '/')
    //   .replace(/-/g, '+');

    console.log();
    const imgSrc = `data:image/png;base64,${base64Image}`;
    return imgSrc;
  }
}

export default DiffusersApiProvider;
