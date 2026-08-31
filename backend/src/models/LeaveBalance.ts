import mongoose, { Schema, Document } from 'mongoose';
import { LeaveType } from './LeaveRequest.js';

export interface ILeaveBalance extends Document {
  employeeId: string;
  leaveType: LeaveType;
  openingBalance: number;
  credited: number;
  consumed: number;
  adjusted: number;
  available: number;
  asOfDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: { type: String, required: true, index: true },
    leaveType: {
      type: String,
      enum: ['CASUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'LOP'],
      required: true,
    },
    openingBalance: { type: Number, default: 0 },
    credited: { type: Number, default: 0 },
    consumed: { type: Number, default: 0 },
    adjusted: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    asOfDate: { type: String, required: true },
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ employeeId: 1, leaveType: 1 }, { unique: true });

export const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
