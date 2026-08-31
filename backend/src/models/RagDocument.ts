import mongoose, { Schema, Document } from 'mongoose';

export interface IRagDocument extends Document {
  documentId: string;
  chunkId: string;
  documentType: string;
  title: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  source: string;
  version: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  accessScope: string[];
  checksum: string;
  createdAt: Date;
  updatedAt: Date;
}

const RagDocumentSchema = new Schema<IRagDocument>(
  {
    documentId: { type: String, required: true, index: true },
    chunkId: { type: String, required: true, unique: true, index: true },
    documentType: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true }, // MiniLM-L6-v2 is 384 dimensions
    metadata: { type: Schema.Types.Mixed, default: {} },
    sensitivity: { type: String, enum: ['PUBLIC', 'INTERNAL', 'RESTRICTED'], default: 'INTERNAL', index: true },
    source: { type: String, required: true },
    version: { type: String, default: '1.0' },
    effectiveFrom: { type: String },
    effectiveTo: { type: String },
    accessScope: { type: [String], default: ['EMPLOYEE', 'HR'], index: true },
    checksum: { type: String, required: true },
  },
  { timestamps: true }
);

// MongoDB Vector Search index definition notes:
// Index name: "vector_index"
// Fields:
//   - embedding: { type: "vector", dimensions: 384, similarity: "cosine" }
//   - accessScope: { type: "filter" }
//   - documentType: { type: "filter" }
//   - sensitivity: { type: "filter" }

export const RagDocument = mongoose.model<IRagDocument>('RagDocument', RagDocumentSchema);
