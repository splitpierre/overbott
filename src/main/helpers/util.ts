import { URL } from 'url';
import path from 'path';
import { app } from 'electron';
import os from 'os';
import LocalStorage from '../providers/local-storage';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../../assets');

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    if (!htmlFileName.includes('index.html')) url.pathname = htmlFileName;
    // url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

export function calculateCPUUsage(): number {
  const loadAverage = os.loadavg();
  const numCPUs = os.cpus().length;
  const averageLoad = loadAverage[0]; // We can choose to use load for 1 minute (index 0)
  // Calculate CPU usage as a percentage of total capacity
  const cpuUsage = (averageLoad / numCPUs) * 100;
  return cpuUsage;
}

export function calculateMemoryUsage(): number {
  return os.freemem() / os.totalmem();
}

export const isMac = os.platform() === 'darwin';
export const isWindows = os.platform() === 'win32';
export const isLinux = os.platform() === 'linux';

export const countTokenSum = (output: any) => {
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
    return tokenSum;
  }
  return 0;
};

/**
 * Extracts pairs of integers and letters from a string (e.g. "1 A 2 B 3 C")
 * This function was initially build to process answer tables from PDF exam files
 * @param text
 * @returns
 */
export function extractPairs(text: string) {
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
// interface CustomRequestInit extends RequestInit {
//   timeout?: number;
// }

// export async function fetchWithTimeout(
//   url: string,
//   options: CustomRequestInit,
// ): Promise<Response> {
//   const controller = new AbortController();
//   const { timeout = 300000, ...fetchOptions } = options; // Default timeout: 300 seconds

//   const timeoutId = setTimeout(() => {
//     controller.abort(); // Abort the fetch request on timeout
//   }, timeout);

//   try {
//     const response = await fetch(url, {
//       ...fetchOptions,
//       signal: controller.signal,
//     });
//     clearTimeout(timeoutId); // Clear the timeout timer
//     return response;
//   } catch (error: any) {
//     if (error.name === 'AbortError') {
//       throw new Error('Request timed out');
//     } else {
//       throw error;
//     }
//   }
// }
