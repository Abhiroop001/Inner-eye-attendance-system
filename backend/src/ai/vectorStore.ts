import { RagDocument, IRagDocument } from '../models/RagDocument.js';
import { getEmbedding } from './embeddingProvider.js';

export interface VectorSearchParams {
  query: string;
  limit?: number;
  accessScope: string[]; // e.g. ["EMPLOYEE", "HR"]
  documentType?: string;
}

export interface RetrievedDocument {
  documentId: string;
  title: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  version: string;
}

/**
 * Cosine similarity helper
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Authorization-Scoped Vector Retrieval
 * Performs MongoDB Vector Search ($vectorSearch in Atlas, or in-memory cosine fallback for local dev)
 * Metadata pre-filtering by accessScope is strictly enforced.
 */
export async function searchKnowledgeBase(params: VectorSearchParams): Promise<RetrievedDocument[]> {
  const { query, limit = 4, accessScope, documentType } = params;

  const queryEmbedding = await getEmbedding(query);

  // Filter criteria
  const matchFilter: Record<string, any> = {
    accessScope: { $in: accessScope },
  };
  if (documentType) {
    matchFilter.documentType = documentType;
  }

  // Attempt Atlas $vectorSearch pipeline if configured
  try {
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit,
          filter: matchFilter,
        },
      },
      {
        $project: {
          documentId: 1,
          title: 1,
          content: 1,
          metadata: 1,
          version: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const atlasResults = await RagDocument.aggregate(pipeline);
    if (atlasResults && atlasResults.length > 0) {
      return atlasResults.map((doc) => ({
        documentId: doc.documentId,
        title: doc.title,
        content: doc.content,
        score: doc.score || 0.85,
        metadata: doc.metadata || {},
        version: doc.version || '1.0',
      }));
    }
  } catch (atlasErr) {
    // Atlas search index not provisioned in local environment; fallback to pre-filtered cosine scan
  }

  // Pre-filtered local cosine similarity scan
  const candidates = await RagDocument.find(matchFilter).select('+embedding');
  const scored = candidates.map((doc) => ({
    documentId: doc.documentId,
    title: doc.title,
    content: doc.content,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
    metadata: doc.metadata,
    version: doc.version,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
