import mongoose, { Schema, Document } from 'mongoose';

export interface ILeavePolicy extends Document {
  leavePolicyId: string;
  name: string;
  description: string;
  leaveTypes: Array<{
    type: string;
    name: string;
    annualQuota: number;
    accrualFrequency: string;
    maxConsecutiveDays: number;
    carryForwardLimit: number;
    requiresDocument: boolean;
    documentThresholdDays?: number;
  }>;
  excludeHolidays: boolean;
  excludeWeekends: boolean;
  allowHalfDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeavePolicySchema = new Schema<ILeavePolicy>(
  {
    leavePolicyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    leaveTypes: { type: Schema.Types.Mixed as any, default: [] },
    excludeHolidays: { type: Boolean, default: true },
    excludeWeekends: { type: Boolean, default: true },
    allowHalfDay: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LeavePolicy = mongoose.model<ILeavePolicy>('LeavePolicy', LeavePolicySchema);
