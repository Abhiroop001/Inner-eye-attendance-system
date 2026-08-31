import mongoose, { Schema, Document } from 'mongoose';

export type ChallengeStatus = 'ISSUED' | 'CONSUMED' | 'EXPIRED' | 'REVOKED';

export interface IActivationChallenge extends Document {
  challengeId: string;
  requestId: string;
  employeeId: string;
  tokenHash: string;
  status: ChallengeStatus;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  consumedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ActivationChallengeSchema = new Schema<IActivationChallenge>(
  {
    challengeId: { type: String, required: true, unique: true, index: true },
    requestId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['ISSUED', 'CONSUMED', 'EXPIRED', 'REVOKED'],
      default: 'ISSUED',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ActivationChallenge = mongoose.model<IActivationChallenge>('ActivationChallenge', ActivationChallengeSchema);
