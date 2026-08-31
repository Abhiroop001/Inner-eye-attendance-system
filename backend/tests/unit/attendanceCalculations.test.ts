import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { calculateAttendanceMetrics } from '../../src/services/attendanceEngine.js';

describe('Attendance Calculation Engine - Deterministic Unit Tests', () => {
  const standardSchedule = {
    expectedStartTime: '09:00',
    expectedEndTime: '17:00',
    graceMinutes: 15,
    unpaidBreakMinutes: 60,
    minimumWorkingMinutes: 420,
    timezone: 'Asia/Kolkata',
  };

  it('should classify on-time arrival within grace period as PRESENT with 0 late minutes', () => {
    // Check-in at 09:12 AM (<= 09:15 AM grace)
    const checkIn = DateTime.fromISO('2026-03-02T09:12:00', { zone: 'Asia/Kolkata' }).toJSDate();
    const checkOut = DateTime.fromISO('2026-03-02T17:15:00', { zone: 'Asia/Kolkata' }).toJSDate();

    const result = calculateAttendanceMetrics({
      checkInAt: checkIn,
      checkOutAt: checkOut,
      schedule: standardSchedule,
    });

    expect(result.status).toBe('PRESENT');
    expect(result.lateMinutes).toBe(0);
    // Elapsed: 8 hours 3 mins = 483 mins. Minus 60m break = 423 net mins
    expect(result.workingMinutes).toBe(423);
    expect(result.overtimeMinutes).toBe(3); // 423 - 420
    expect(result.earlyDepartureMinutes).toBe(0);
  });

  it('should classify arrival past grace period as LATE with exact penalty minutes', () => {
    // Check-in at 09:35 AM on 09:00 schedule -> 35 mins elapsed. 35 - 15 grace = 20 late mins
    const checkIn = DateTime.fromISO('2026-03-02T09:35:00', { zone: 'Asia/Kolkata' }).toJSDate();
    const checkOut = DateTime.fromISO('2026-03-02T17:00:00', { zone: 'Asia/Kolkata' }).toJSDate();

    const result = calculateAttendanceMetrics({
      checkInAt: checkIn,
      checkOutAt: checkOut,
      schedule: standardSchedule,
    });

    expect(result.status).toBe('LATE');
    expect(result.lateMinutes).toBe(20);
    // Elapsed: 7 hours 25 mins = 445 mins. Minus 60m break = 385 net mins
    expect(result.workingMinutes).toBe(385);
  });

  it('should calculate early departure minutes accurately', () => {
    // Check-in at 09:00 AM, Check-out at 15:30 PM (Scheduled End: 17:00 PM) -> 90 mins early
    const checkIn = DateTime.fromISO('2026-03-02T09:00:00', { zone: 'Asia/Kolkata' }).toJSDate();
    const checkOut = DateTime.fromISO('2026-03-02T15:30:00', { zone: 'Asia/Kolkata' }).toJSDate();

    const result = calculateAttendanceMetrics({
      checkInAt: checkIn,
      checkOutAt: checkOut,
      schedule: standardSchedule,
    });

    expect(result.earlyDepartureMinutes).toBe(90);
    // Total working: 6.5h - 1h = 5.5h = 330 mins (Classified as HALF_DAY because < 420 mins)
    expect(result.workingMinutes).toBe(330);
    expect(result.status).toBe('HALF_DAY');
  });

  it('should calculate overtime correctly when working beyond scheduled minutes', () => {
    // Check-in at 09:00 AM, Check-out at 19:30 PM (2.5h overtime)
    const checkIn = DateTime.fromISO('2026-03-02T09:00:00', { zone: 'Asia/Kolkata' }).toJSDate();
    const checkOut = DateTime.fromISO('2026-03-02T19:30:00', { zone: 'Asia/Kolkata' }).toJSDate();

    const result = calculateAttendanceMetrics({
      checkInAt: checkIn,
      checkOutAt: checkOut,
      schedule: standardSchedule,
    });

    // 10.5h elapsed - 1h break = 9.5h = 570 mins. Scheduled net: 420 mins. Overtime: 150 mins
    expect(result.workingMinutes).toBe(570);
    expect(result.overtimeMinutes).toBe(150);
    expect(result.status).toBe('PRESENT');
  });
});
