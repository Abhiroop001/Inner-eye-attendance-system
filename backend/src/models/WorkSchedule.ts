import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkSchedule extends Document {
  scheduleId: string;
  name: string;
  timezone: string;
  expectedStartTime: string; // HH:mm
  expectedEndTime: string; // HH:mm
  graceMinutes: number;
  unpaidBreakMinutes: number;
  minimumWorkingMinutes: number;
  weeklyPattern: number[]; // 1=Mon, 7=Sun
  holidayCalendarId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkScheduleSchema = new Schema<IWorkSchedule>(
  {
    scheduleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    expectedStartTime: { type: String, required: true },
    expectedEndTime: { type: String, required: true },
    graceMinutes: { type: Number, default: 15 },
    unpaidBreakMinutes: { type: Number, default: 60 },
    minimumWorkingMinutes: { type: Number, default: 420 },
    weeklyPattern: { type: [Number], default: [1, 2, 3, 4, 5] },
    holidayCalendarId: { type: String, default: 'CAL-IN-2026' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const WorkSchedule = mongoose.model<IWorkSchedule>('WorkSchedule', WorkScheduleSchema);
