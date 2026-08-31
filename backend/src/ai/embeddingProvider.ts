import crypto from 'crypto';
import { HfInference } from '@huggingface/inference';
import { env } from '../config/env.js';
import { logger } from '../audit/auditLogger.js';

let hfClient: HfInference | null = null;

if (env.HF_TOKEN && env.HF_TOKEN.length > 5 && !env.HF_TOKEN.includes('placeholder')) {
  hfClient = new HfInference(env.HF_TOKEN);
}

/**
 * Deterministic local feature-hash vectorizer (384 dimensions)
 * Used when HF_TOKEN is offline or during local unit testing
 */
export function generateLocalEmbedding(text: string, dimensions = 384): number[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  const vector = new Array(dimensions).fill(0);

  if (words.length === 0) return vector;

  words.forEach((word, idx) => {
    // Generate 32-bit hash for word
    const hash = crypto.createHash('sha256').update(word).digest();
    for (let i = 0; i < 8; i++) {
      const val = hash.readInt32LE(i * 4);
      const targetIndex = Math.abs(val) % dimensions;
      vector[targetIndex] += (val % 100) / 100.0;
    }
  });

  // Normalize L2 vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    return vector.map((v) => v / norm);
  }

  return vector;
}

/**
 * Enterprise Embedding Provider
 * Tries Hugging Face Inference Provider; gracefully falls back to deterministic local embedding
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (hfClient) {
    try {
      const response = await hfClient.featureExtraction({
        model: env.HF_EMBEDDING_MODEL,
        inputs: text,
      });

      if (Array.isArray(response) && typeof response[0] === 'number') {
        return response as number[];
      } else if (Array.isArray(response) && Array.isArray(response[0])) {
        return response[0] as number[];
      }
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Hugging Face API call failed, falling back to local vectorizer');
    }
  }

  return generateLocalEmbedding(text, 384);
}
