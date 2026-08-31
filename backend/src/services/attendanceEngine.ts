import { DateTime } from 'luxon';
import { IWorkSchedule } from '../models/WorkSchedule.js';
import { AttendanceStatus } from '../models/Attendance.js';

export interface CalculationInput {
  checkInAt: Date;
  checkOutAt?: Date | null;
  schedule: {
    expectedStartTime: string; // "09:00"
    expectedEndTime: string;   // "17:00"
    graceMinutes: number;      // 15
    unpaidBreakMinutes: number; // 60
    minimumWorkingMinutes: number; // 420
    timezone: string;          // "Asia/Kolkata"
  };
}

export interface CalculationResult {
  workingMinutes: number;
  scheduledMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: AttendanceStatus;
}

/**
 * Deterministic Attendance Engine using Luxon
 * All calculations are timezone-aware and policy-driven.
 */
export function calculateAttendanceMetrics(input: CalculationInput): CalculationResult {
  const { checkInAt, checkOutAt, schedule } = input;
  const tz = schedule.timezone || 'Asia/Kolkata';

  const checkInLuxon = DateTime.fromJSDate(checkInAt).setZone(tz);
  const dateStr = checkInLuxon.toFormat('yyyy-MM-dd');

  // Parse scheduled start and end in employee local timezone
  const [startHour, startMin] = schedule.expectedStartTime.split(':').map(Number);
  const [endHour, endMin] = schedule.expectedEndTime.split(':').map(Number);

  const scheduledStart = checkInLuxon.set({ hour: startHour, minute: startMin, second: 0, millisecond: 0 });
  const scheduledEnd = checkInLuxon.set({ hour: endHour, minute: endMin, second: 0, millisecond: 0 });

  const scheduledMinutes = Math.max(0, Math.round(scheduledEnd.diff(scheduledStart, 'minutes').minutes));

  // 1. Calculate Late Arrival Minutes
  // lateMinutes = max(0, actualCheckIn - scheduledStart - graceMinutes)
  const diffFromStart = Math.round(checkInLuxon.diff(scheduledStart, 'minutes').minutes);
  const lateMinutes = Math.max(0, diffFromStart - schedule.graceMinutes);
  const isLate = diffFromStart > schedule.graceMinutes;

  let workingMinutes = 0;
  let overtimeMinutes = 0;
  let earlyDepartureMinutes = 0;
  let status: AttendanceStatus = isLate ? 'LATE' : 'PRESENT';

  if (checkOutAt) {
    const checkOutLuxon = DateTime.fromJSDate(checkOutAt).setZone(tz);
    const totalElapsedMinutes = Math.max(0, Math.round(checkOutLuxon.diff(checkInLuxon, 'minutes').minutes));

    // workingMinutes = max(0, totalElapsed - unpaidBreakMinutes)
    workingMinutes = Math.max(0, totalElapsedMinutes - schedule.unpaidBreakMinutes);

    // earlyDepartureMinutes = max(0, scheduledEnd - actualCheckOut)
    const diffToEnd = Math.round(scheduledEnd.diff(checkOutLuxon, 'minutes').minutes);
    earlyDepartureMinutes = Math.max(0, diffToEnd);

    // overtimeMinutes = max(0, workingMinutes - scheduledWorkingMinutes)
    const scheduledNetMinutes = Math.max(0, scheduledMinutes - schedule.unpaidBreakMinutes);
    overtimeMinutes = Math.max(0, workingMinutes - scheduledNetMinutes);

    // Determine final status
    if (workingMinutes < 210) {
      status = 'HALF_DAY'; // Less than half day minimum
    } else if (workingMinutes < schedule.minimumWorkingMinutes) {
      status = isLate ? 'LATE' : 'HALF_DAY';
    } else if (isLate) {
      status = 'LATE';
    } else {
      status = 'PRESENT';
    }
  } else {
    // Only check-in recorded so far
    status = isLate ? 'LATE' : 'PRESENT';
  }

  return {
    workingMinutes,
    scheduledMinutes,
    overtimeMinutes,
    lateMinutes,
    earlyDepartureMinutes,
    status,
  };
}
