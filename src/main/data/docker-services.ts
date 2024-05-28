// import dotenv from 'dotenv';

const dockerServices = {
  unstructured: {
    name: 'unstructured-api',
    portExpose: '8007',
    portDefault: '8000',
    image: 'downloads.unstructured.io/unstructured-io/unstructured-api:latest',
  },
  openTts: {
    name: 'open-tts',
    portExpose: '5500',
    portDefault: '5500',
    image: 'synesthesiam/opentts:en',
  },
  diffusersApi: {
    name: 'diffusers-api',
    portExpose: '8077',
    portDefault: '8000',
    image: 'gadicc/diffusers-api:latest',
    envs: `HF_AUTH_TOKEN=${process.env.HF_AUTH_TOKEN}`,
  },
  redis: {
    name: 'redis',
    portExpose: '6379',
    portDefault: '6379',
    image: 'redis:latest',
  },
};

export default dockerServices;
