import mongoose, { Schema, Document } from 'mongoose';

export type LateReasonStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_MORE_INFO';
export type LateReasonCategory =
  | 'MEDICAL'
  | 'TRAFFIC_TRANSIT'
  | 'FAMILY_EMERGENCY'
  | 'CLIENT_MEETING'
  | 'TECHNICAL_GLITCH'
  | 'OTHER';

export interface ILateReason extends Document {
  lateReasonId: string;
  employeeId: string;
  attendanceId: string;
  reasonCategory: LateReasonCategory;
  employeeExplanation: string;
  supportingDocumentIds: string[];
  submittedAt: Date;
  status: LateReasonStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewerComment?: string | null;
  aiRecommendation?: string | null;
  aiReasoning?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const LateReasonSchema = new Schema<ILateReason>(
  {
    lateReasonId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    attendanceId: { type: String, required: true, unique: true, index: true },
    reasonCategory: {
      type: String,
      enum: ['MEDICAL', 'TRAFFIC_TRANSIT', 'FAMILY_EMERGENCY', 'CLIENT_MEETING', 'TECHNICAL_GLITCH', 'OTHER'],
      required: true,
    },
    employeeExplanation: { type: String, required: true },
    supportingDocumentIds: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'NEEDS_MORE_INFO'],
      default: 'SUBMITTED',
      index: true,
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewerComment: { type: String, default: null },
    aiRecommendation: { type: String, default: null },
    aiReasoning: { type: String, default: null },
  },
  { timestamps: true }
);

export const LateReason = mongoose.model<ILateReason>('LateReason', LateReasonSchema);
