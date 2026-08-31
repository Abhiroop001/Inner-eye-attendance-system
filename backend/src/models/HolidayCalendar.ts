import mongoose, { Schema, Document } from 'mongoose';

export interface IHolidayCalendar extends Document {
  holidayCalendarId: string;
  name: string;
  year: number;
  timezone: string;
  holidays: Array<{
    date: string; // YYYY-MM-DD
    name: string;
    type: 'PUBLIC' | 'NATIONAL' | 'OPTIONAL';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const HolidayCalendarSchema = new Schema<IHolidayCalendar>(
  {
    holidayCalendarId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    year: { type: Number, required: true, index: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    holidays: {
      type: [
        {
          date: { type: String, required: true },
          name: { type: String, required: true },
          type: { type: String, enum: ['PUBLIC', 'NATIONAL', 'OPTIONAL'], default: 'PUBLIC' },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const HolidayCalendar = mongoose.model<IHolidayCalendar>('HolidayCalendar', HolidayCalendarSchema);
