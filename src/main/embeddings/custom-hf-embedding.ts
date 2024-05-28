/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
// import { pipeline } from '@xenova/transformers';
import { Embeddings } from '@langchain/core/embeddings';
import { chunkArray } from '@langchain/core/utils/chunk_array';

// eslint-disable-next-line no-new-func
const TransformersApi = Function('return import("@xenova/transformers")')();

export default class CustomHuggingFaceTransformersEmbeddings extends Embeddings {
  modelName: string;

  batchSize: number;

  stripNewLines: boolean;

  timeout?: number;

  pipelinePromise?: Promise<any>;

  constructor(fields?: {
    modelName?: string;
    batchSize?: number;
    stripNewLines?: boolean;
    timeout?: number;
  }) {
    // @ts-ignore
    super(fields ?? {});

    this.modelName = fields?.modelName ?? 'Xenova/all-MiniLM-L6-v2';
    this.batchSize = fields?.batchSize ?? 512;
    this.stripNewLines = fields?.stripNewLines ?? true;
    this.timeout = fields?.timeout;
  }

  async embedDocuments(texts: string[]): Promise<any[]> {
    const MAX_BATCH_SIZE = 50; // Maximum batch size

    // Chunk the input array into smaller batches
    const batches = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
    }

    const embeddings = [];
    // Process each batch sequentially
    for (const batch of batches) {
      // Strip new lines and remove repeating dots in each batch
      const processedBatch = batch.map(
        (t) =>
          t
            .replace(/\n/g, ' ') // Strip new lines
            .replace(/\.{2,}/g, '.'), // Remove repeating dots
      );

      const batchResponse = await this.runEmbedding(processedBatch);
      embeddings.push(...batchResponse);
    }

    return embeddings;
  }

  async embedDocumentsOrigin(texts: string[]): Promise<any[]> {
    const batches = chunkArray(
      this.stripNewLines
        ? texts.map((t) => {
            const regexNewLines = /\n/g;
            return t.replace(regexNewLines, ' ');
          })
        : texts,
      // strip repeating dots from indexes
      this.batchSize,
    );
    // console.log('batches', batches);
    const batchRequests = batches.map((batch) => {
      console.log('batchMap', batch);
      return this.runEmbedding(batch);
    });
    const batchResponses = await Promise.all(batchRequests);
    const embeddings = [];
    for (let i = 0; i < batchResponses.length; i += 1) {
      const batchResponse = batchResponses[i];
      for (let j = 0; j < batchResponse.length; j += 1) {
        embeddings.push(batchResponse[j]);
      }
    }
    return embeddings;
  }

  async embedQuery(text: string): Promise<any> {
    console.log('will run embedQuery');
    const data = await this.runEmbedding([
      this.stripNewLines ? text.replace(/\n/g, ' ') : text,
    ]);
    return data[0];
  }

  async runEmbedding(texts: string[]): Promise<any> {
    //  table with length of all texts in the list
    const table = texts.map((t) => t.length);
    console.log('runEmbedding', {
      table,
      length: texts.length,
      model: this.modelName,
      batchSize: this.batchSize,
    });
    try {
      const { pipeline, env } = await TransformersApi;
      // const config
      // ??= means if the pipelinePromise is null or undefined, then assign the pipeline to it
      const pipe = await (this.pipelinePromise ??= pipeline(
        'feature-extraction',
        this.modelName,
      ));
      // console.log('run embedding', pipe);
      const output = await pipe(texts, { pooling: 'mean', normalize: true });
      return output.tolist();
    } catch (error) {
      console.log('error', error);
      return [];
    }
  }
}
