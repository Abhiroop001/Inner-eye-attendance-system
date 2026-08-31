import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceEventType = 'CHECK_IN' | 'CHECK_OUT' | 'MANUAL_ADJUSTMENT' | 'EXCEPTION_APPLIED';

export interface IAttendanceEvent extends Document {
  eventId: string;
  employeeId: string;
  attendanceId: string;
  eventType: AttendanceEventType;
  eventAt: Date;
  requestId?: string;
  sourceIpHash?: string;
  userAgentSummary?: string;
  deviceMetadata?: Record<string, any>;
  createdAt: Date;
}

const AttendanceEventSchema = new Schema<IAttendanceEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    attendanceId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ['CHECK_IN', 'CHECK_OUT', 'MANUAL_ADJUSTMENT', 'EXCEPTION_APPLIED'],
      required: true,
    },
    eventAt: { type: Date, required: true, index: true },
    requestId: { type: String, default: null },
    sourceIpHash: { type: String, default: null },
    userAgentSummary: { type: String, default: null },
    deviceMetadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AttendanceEventSchema.index({ employeeId: 1, eventAt: -1 });

export const AttendanceEvent = mongoose.model<IAttendanceEvent>('AttendanceEvent', AttendanceEventSchema);
