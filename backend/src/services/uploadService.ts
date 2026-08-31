import crypto from 'crypto';
import { Readable } from 'stream';
import { getGridFSBucket } from '../config/database.js';
import { SupportingDocument, ISupportingDocument } from '../models/SupportingDocument.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates binary magic bytes to prevent executable file extension spoofing
 */
export function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  if (buffer.length < 4) return false;

  // PDF: %PDF (25 50 44 46)
  if (declaredMime === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // JPEG: FF D8 FF
  if (declaredMime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (declaredMime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  return false;
}

export interface StoreDocumentParams {
  employeeId: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
  attendanceId?: string | null;
  lateReasonId?: string | null;
  uploadedBy: string;
}

export async function storeSupportingDocument(params: StoreDocumentParams): Promise<ISupportingDocument> {
  const { employeeId, originalFilename, mimeType, buffer, attendanceId, lateReasonId, uploadedBy } = params;

  // 1. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new AppError(
      `Unsupported file MIME type '${mimeType}'. Only PDF, JPEG, and PNG files are accepted.`,
      400,
      'INVALID_FILE_TYPE'
    );
  }

  // 2. Validate Size
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new AppError('File size exceeds the 10MB threshold limit.', 400, 'FILE_TOO_LARGE');
  }

  // 3. Validate Magic Signature
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new AppError(
      'Binary signature check failed. The file contents do not match the declared extension/MIME type.',
      400,
      'CORRUPT_OR_DISGUISED_FILE'
    );
  }

  // 4. Calculate SHA-256 Checksum
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // 5. Generate safe UUID storage key
  const documentId = 'doc_' + crypto.randomUUID();
  const fileExt = originalFilename.split('.').pop()?.toLowerCase() || 'bin';
  const safeFilename = `${documentId}.${fileExt}`;

  // 6. Stream to GridFS
  const bucket = getGridFSBucket();
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);

  const uploadStream = bucket.openUploadStream(safeFilename, {
    metadata: {
      documentId,
      employeeId,
      originalFilename,
      mimeType,
      sha256,
      uploadedBy,
    },
  });

  await new Promise((resolve, reject) => {
    readableStream.pipe(uploadStream).on('error', reject).on('finish', resolve);
  });

  // 7. Save Document Metadata record
  const doc = await SupportingDocument.create({
    documentId,
    employeeId,
    attendanceId: attendanceId || null,
    lateReasonId: lateReasonId || null,
    originalFilename,
    safeFilename,
    mimeType,
    sizeBytes: buffer.length,
    storageKey: uploadStream.id.toString(),
    sha256,
    scanStatus: 'CLEAN',
    uploadedAt: new Date(),
    uploadedBy,
    accessPolicy: 'OWNER_AND_HR',
  });

  return doc;
}
