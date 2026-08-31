import { describe, it, expect } from 'vitest';
import { calculateWorkingDays } from '../../src/services/leaveEngine.js';

describe('Leave Engine - Deterministic Working Days Unit Tests', () => {
  const holidayCalendar2026 = ['2026-01-01', '2026-01-26', '2026-03-04', '2026-08-15'];

  it('should exclude Saturdays and Sundays from leave duration calculation', () => {
    // Friday (2026-03-06) to Monday (2026-03-09): Fri, Sat, Sun, Mon.
    // Working days should be 2 (Friday + Monday).
    const workingDays = calculateWorkingDays({
      startDate: '2026-03-06',
      endDate: '2026-03-09',
      isHalfDay: false,
      weeklyPattern: [1, 2, 3, 4, 5],
      holidayDates: holidayCalendar2026,
      excludeWeekends: true,
      excludeHolidays: true,
    });

    expect(workingDays).toBe(2);
  });

  it('should exclude official public holidays that fall on a weekday', () => {
    // 2026-01-26 is Republic Day (Monday). Leave from 2026-01-23 (Fri) to 2026-01-27 (Tue):
    // Fri (Work), Sat (Off), Sun (Off), Mon (Holiday), Tue (Work) -> 2 working days
    const workingDays = calculateWorkingDays({
      startDate: '2026-01-23',
      endDate: '2026-01-27',
      isHalfDay: false,
      weeklyPattern: [1, 2, 3, 4, 5],
      holidayDates: holidayCalendar2026,
      excludeWeekends: true,
      excludeHolidays: true,
    });

    expect(workingDays).toBe(2);
  });

  it('should evaluate half-day requests as exactly 0.5 days', () => {
    const workingDays = calculateWorkingDays({
      startDate: '2026-03-10',
      endDate: '2026-03-10',
      isHalfDay: true,
      weeklyPattern: [1, 2, 3, 4, 5],
      holidayDates: holidayCalendar2026,
    });

    expect(workingDays).toBe(0.5);
  });

  it('should reject invalid date range where end date precedes start date', () => {
    expect(() => {
      calculateWorkingDays({
        startDate: '2026-03-15',
        endDate: '2026-03-10',
        isHalfDay: false,
        weeklyPattern: [1, 2, 3, 4, 5],
        holidayDates: [],
      });
    }).toThrow();
  });
});
