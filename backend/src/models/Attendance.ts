import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'PENDING_EXCEPTION'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'INCOMPLETE_SESSION';

export interface IAttendance extends Document {
  attendanceId: string;
  employeeId: string;
  attendanceDate: string; // YYYY-MM-DD
  checkInAt?: Date | null;
  checkOutAt?: Date | null;
  workingMinutes: number;
  scheduledMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: AttendanceStatus;
  checkInSource: string;
  checkOutSource?: string | null;
  lateReasonId?: string | null;
  notes?: string;
  isAdjusted: boolean;
  adjustedBy?: string | null;
  adjustedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    attendanceId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    attendanceDate: { type: String, required: true, index: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    workingMinutes: { type: Number, default: 0 },
    scheduledMinutes: { type: Number, default: 480 },
    overtimeMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    earlyDepartureMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'PRESENT',
        'LATE',
        'ABSENT',
        'HALF_DAY',
        'ON_LEAVE',
        'PENDING_EXCEPTION',
        'HOLIDAY',
        'WEEK_OFF',
        'INCOMPLETE_SESSION',
      ],
      default: 'ABSENT',
      index: true,
    },
    checkInSource: { type: String, default: 'WEB_PORTAL' },
    checkOutSource: { type: String, default: null },
    lateReasonId: { type: String, default: null },
    notes: { type: String, default: '' },
    isAdjusted: { type: Boolean, default: false },
    adjustedBy: { type: String, default: null },
    adjustedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });
AttendanceSchema.index({ attendanceDate: 1, status: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
