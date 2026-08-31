import mongoose, { Schema, Document } from 'mongoose';

export type ScanStatus = 'CLEAN' | 'INFECTED' | 'PENDING' | 'SKIPPED';

export interface ISupportingDocument extends Document {
  documentId: string;
  employeeId: string;
  attendanceId?: string | null;
  lateReasonId?: string | null;
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  sha256: string;
  scanStatus: ScanStatus;
  uploadedAt: Date;
  uploadedBy: string;
  accessPolicy: 'OWNER_AND_HR';
  createdAt: Date;
  updatedAt: Date;
}

const SupportingDocumentSchema = new Schema<ISupportingDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    attendanceId: { type: String, default: null, index: true },
    lateReasonId: { type: String, default: null, index: true },
    originalFilename: { type: String, required: true },
    safeFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true },
    sha256: { type: String, required: true },
    scanStatus: {
      type: String,
      enum: ['CLEAN', 'INFECTED', 'PENDING', 'SKIPPED'],
      default: 'CLEAN',
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, required: true },
    accessPolicy: { type: String, default: 'OWNER_AND_HR' },
  },
  { timestamps: true }
);

export const SupportingDocument = mongoose.model<ISupportingDocument>('SupportingDocument', SupportingDocumentSchema);
