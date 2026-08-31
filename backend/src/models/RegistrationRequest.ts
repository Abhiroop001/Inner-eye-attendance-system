import mongoose, { Schema, Document } from 'mongoose';

export type RegistrationStatus = 'PENDING' | 'CHALLENGE_ISSUED' | 'COMPLETED' | 'REJECTED' | 'MANUAL_REVIEW';

export interface IRegistrationRequest extends Document {
  requestId: string;
  publicReference: string;
  employeeId?: string | null;
  submittedEmail: string;
  submittedEmployeeId: string;
  resolutionConfidence: number;
  resolutionMethod: 'DETERMINISTIC' | 'VECTOR_SUPPORTED' | 'MANUAL';
  status: RegistrationStatus;
  riskScore: number;
  challengeId?: string | null;
  submittedAt: Date;
  expiresAt: Date;
  completedAt?: Date | null;
  rejectionReasonCode?: string | null;
  auditMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationRequestSchema = new Schema<IRegistrationRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    publicReference: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, default: null, index: true },
    submittedEmail: { type: String, required: true, lowercase: true, trim: true },
    submittedEmployeeId: { type: String, required: true, trim: true },
    resolutionConfidence: { type: Number, default: 0 },
    resolutionMethod: {
      type: String,
      enum: ['DETERMINISTIC', 'VECTOR_SUPPORTED', 'MANUAL'],
      default: 'DETERMINISTIC',
    },
    status: {
      type: String,
      enum: ['PENDING', 'CHALLENGE_ISSUED', 'COMPLETED', 'REJECTED', 'MANUAL_REVIEW'],
      default: 'PENDING',
      index: true,
    },
    riskScore: { type: Number, default: 0 },
    challengeId: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    rejectionReasonCode: { type: String, default: null },
    auditMetadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

RegistrationRequestSchema.index({ status: 1, createdAt: -1 });

export const RegistrationRequest = mongoose.model<IRegistrationRequest>('RegistrationRequest', RegistrationRequestSchema);
