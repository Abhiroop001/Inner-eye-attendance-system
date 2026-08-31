import mongoose, { Schema, Document } from 'mongoose';

export type LeaveType = 'CASUAL' | 'SICK' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY' | 'LOP';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ILeaveRequest extends Document {
  leaveRequestId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  isHalfDay: boolean;
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  reason: string;
  supportingDocumentId?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewerComment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    leaveRequestId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    leaveType: {
      type: String,
      enum: ['CASUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'LOP'],
      required: true,
    },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String, required: true, index: true },
    totalDays: { type: Number, required: true },
    isHalfDay: { type: Boolean, default: false },
    halfDaySession: { type: String, enum: ['FIRST_HALF', 'SECOND_HALF', null], default: null },
    reason: { type: String, required: true },
    supportingDocumentId: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewerComment: { type: String, default: null },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
