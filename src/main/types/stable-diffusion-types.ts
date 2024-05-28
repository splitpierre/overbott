type StableDiffusionPipelinesOfficial =
  | 'DanceDiffusionPipeline'
  | 'DDIMPipeline'
  | 'DDPMPipeline'
  | 'LDMSuperResolutionPipeline'
  | 'LDMPipeline'
  | 'PNDMPipeline'
  | 'RePaintPipeline'
  | 'ScoreSdeVePipeline'
  | 'KarrasVePipeline'
  | 'AudioDiffusionPipeline'
  | 'AltDiffusionImg2ImgPipeline'
  | 'AltDiffusionPipeline'
  | 'LDMTextToImagePipeline'
  | 'PaintByExamplePipeline'
  | 'CycleDiffusionPipeline'
  | 'StableDiffusionImageVariationPipeline'
  | 'StableDiffusionImg2ImgPipeline'
  | 'StableDiffusionInpaintPipeline'
  | 'StableDiffusionPipeline'
  | 'StableDiffusionUpscalePipeline'
  | 'VersatileDiffusionDualGuidedPipeline'
  | 'VersatileDiffusionImageVariationPipeline'
  | 'VersatileDiffusionPipeline'
  | 'VersatileDiffusionTextToImagePipeline'
  | 'VQDiffusionPipeline';

type StableDiffusionPipelinesCommunity =
  | 'wildcard_stable_diffusion'
  | 'one_step_unet'
  | 'interpolate_stable_diffusion'
  | 'img2img_inpainting'
  | 'multilingual_stable_diffusion'
  | 'text_inpainting'
  | 'lpw_stable_diffusion'
  | 'lpw_stable_diffusion_onnx'
  | 'stable_diffusion_mega'
  | 'clip_guided_stable_diffusion'
  | 'composable_stable_diffusion'
  | 'checkpoint_merger'
  | 'imagic_stable_diffusion'
  | 'speech_to_image_diffusion'
  | 'seed_resize_stable_diffusion'
  | 'sd_text2img_k_diffusion'
  | 'bit_diffusio';

type StableDiffusionSchedulers =
  | 'DPMSolverMultistepScheduler'
  | 'LMSDiscreteScheduler'
  | 'DDIMScheduler'
  | 'PNDMScheduler'
  | 'EulerAncestralDiscreteScheduler'
  | 'EulerDiscreteScheduler';

type StableDiffusionModels =
  | 'runwayml/stable-diffusion-v1-5'
  | 'stabilityai/sdxl-turbo'
  | 'playgroundai/playground-v2.5-1024px-aesthetic';

type StableDiffusionBody = {
  modelInputs: {
    prompt: string;
    num_inference_steps: number;
    guidance_scale: number;
    width: number;
    height: number;
    seed: number;
  };
  callInputs: {
    MODEL_ID: StableDiffusionModels;
    PIPELINE:
      | StableDiffusionPipelinesOfficial
      | StableDiffusionPipelinesCommunity;
    SCHEDULER: StableDiffusionSchedulers;
    safety_checker: boolean;
    MODEL_URL?: string;
  };
};

export type {
  StableDiffusionPipelinesOfficial,
  StableDiffusionPipelinesCommunity,
  StableDiffusionSchedulers,
  StableDiffusionModels,
  StableDiffusionBody,
};
