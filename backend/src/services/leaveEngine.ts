import { DateTime, Interval } from 'luxon';
import { IHolidayCalendar } from '../models/HolidayCalendar.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveType } from '../models/LeaveRequest.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CalculateLeaveDaysInput {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isHalfDay: boolean;
  weeklyPattern: number[]; // e.g. [1, 2, 3, 4, 5] (Mon-Fri)
  holidayDates: string[];  // e.g. ["2026-01-01", "2026-01-26"]
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
}

/**
 * Deterministic Working-Days Calculator for Leave Requests
 * Iterates across date interval and excludes weekends/holidays based on policy
 */
export function calculateWorkingDays(input: CalculateLeaveDaysInput): number {
  const {
    startDate,
    endDate,
    isHalfDay,
    weeklyPattern = [1, 2, 3, 4, 5],
    holidayDates = [],
    excludeWeekends = true,
    excludeHolidays = true,
  } = input;

  if (isHalfDay) {
    return 0.5;
  }

  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);

  if (end < start) {
    throw new AppError('End date cannot precede start date', 400, 'INVALID_DATE_RANGE');
  }

  let totalWorkingDays = 0;
  let cursor = start;

  while (cursor <= end) {
    const dayOfWeek = cursor.weekday; // 1=Mon, 7=Sun
    const dateStr = cursor.toFormat('yyyy-MM-dd');

    const isWeekend = excludeWeekends && !weeklyPattern.includes(dayOfWeek);
    const isHoliday = excludeHolidays && holidayDates.includes(dateStr);

    if (!isWeekend && !isHoliday) {
      totalWorkingDays += 1;
    }

    cursor = cursor.plus({ days: 1 });
  }

  return totalWorkingDays;
}

export async function validateAndDeductLeaveBalance(
  employeeId: string,
  leaveType: LeaveType,
  daysToDeduct: number
): Promise<{ previousBalance: number; newBalance: number }> {
  const balanceDoc = await LeaveBalance.findOne({ employeeId, leaveType });

  if (!balanceDoc) {
    throw new AppError(`No leave balance record found for type ${leaveType}`, 404, 'BALANCE_NOT_FOUND');
  }

  if (balanceDoc.available < daysToDeduct) {
    throw new AppError(
      `Insufficient ${leaveType} leave balance. Available: ${balanceDoc.available}, Requested: ${daysToDeduct}`,
      400,
      'INSUFFICIENT_BALANCE',
      { available: balanceDoc.available, requested: daysToDeduct }
    );
  }

  const previousBalance = balanceDoc.available;
  balanceDoc.consumed += daysToDeduct;
  balanceDoc.available = balanceDoc.openingBalance + balanceDoc.credited + balanceDoc.adjusted - balanceDoc.consumed;
  await balanceDoc.save();

  return {
    previousBalance,
    newBalance: balanceDoc.available,
  };
}
