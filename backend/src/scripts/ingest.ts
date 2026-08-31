import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { RagDocument } from '../models/RagDocument.js';
import { getEmbedding } from '../ai/embeddingProvider.js';

interface DocMetadata {
  document_id: string;
  version: string;
  document_type: string;
  title: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  effective_from?: string;
  effective_to?: string;
  access_scope: string[];
}

function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // retain overlap
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 5)).join(' ');
      currentChunk = overlapWords + '\n\n' + para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function runIngestion() {
  console.log('🔄 Starting RAG Policy Ingestion Pipeline...');
  await connectDatabase();

  const kbDir = path.resolve(process.cwd(), '../rag/knowledge-base');
  const files = fs.readdirSync(kbDir).filter((f) => f.endsWith('.md'));

  let totalChunksIngested = 0;

  for (const file of files) {
    const fullPath = path.join(kbDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Parse Frontmatter
    const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      console.warn(`⚠️ Skipping ${file}: No YAML frontmatter found.`);
      continue;
    }

    const frontmatterRaw = match[1];
    const bodyContent = match[2];
    const metadata = yaml.load(frontmatterRaw) as DocMetadata;

    const chunks = chunkText(bodyContent);
    console.log(`📄 Ingesting [${metadata.document_id}] "${metadata.title}" -> ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${metadata.document_id}_chunk_${i + 1}`;
      const checksum = crypto.createHash('sha256').update(chunk).digest('hex');
      const embedding = await getEmbedding(chunk);

      await RagDocument.findOneAndUpdate(
        { chunkId },
        {
          documentId: metadata.document_id,
          chunkId,
          documentType: metadata.document_type || 'policy',
          title: metadata.title,
          content: chunk,
          embedding,
          metadata: {
            sourceFile: file,
            chunkIndex: i + 1,
            totalChunks: chunks.length,
          },
          sensitivity: metadata.sensitivity || 'INTERNAL',
          source: file,
          version: metadata.version || '1.0',
          effectiveFrom: metadata.effective_from,
          effectiveTo: metadata.effective_to,
          accessScope: metadata.access_scope || ['EMPLOYEE', 'HR'],
          checksum,
        },
        { upsert: true, new: true }
      );

      totalChunksIngested++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`  ✅ RAG Ingestion Complete!`);
  console.log(`  📚 Total policy files processed: ${files.length}`);
  console.log(`  🧩 Total vector chunks upserted: ${totalChunksIngested}`);
  console.log(`======================================================\n`);

  await disconnectDatabase();
}

if (process.argv[1]?.includes('ingest.ts')) {
  runIngestion().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
  });
}
