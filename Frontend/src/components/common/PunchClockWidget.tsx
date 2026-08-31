import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Clock, LogIn, LogOut, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AttendanceRecord } from '../../types/index.js';
import { StatusBadge } from './StatusBadge.js';

interface PunchClockWidgetProps {
  todayAttendance: AttendanceRecord;
  timezone?: string;
  onCheckIn: () => Promise<void>;
  onCheckOut: () => Promise<void>;
  isSubmitting?: boolean;
}

export const PunchClockWidget: React.FC<PunchClockWidgetProps> = ({
  todayAttendance,
  timezone = 'Asia/Kolkata',
  onCheckIn,
  onCheckOut,
  isSubmitting = false,
}) => {
  const [currentTime, setCurrentTime] = useState(DateTime.now().setZone(timezone));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(timezone));
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const hasCheckedIn = !!todayAttendance?.checkInAt;
  const hasCheckedOut = !!todayAttendance?.checkOutAt;

  // Calculate elapsed time if currently checked in
  let elapsedFormatted = '--:--:--';
  if (hasCheckedIn && todayAttendance.checkInAt) {
    const checkInTime = DateTime.fromISO(todayAttendance.checkInAt).setZone(timezone);
    const endTime = hasCheckedOut && todayAttendance.checkOutAt
      ? DateTime.fromISO(todayAttendance.checkOutAt).setZone(timezone)
      : currentTime;

    const diff = endTime.diff(checkInTime, ['hours', 'minutes', 'seconds']);
    const h = String(Math.floor(diff.hours)).padStart(2, '0');
    const m = String(Math.floor(diff.minutes)).padStart(2, '0');
    const s = String(Math.floor(diff.seconds)).padStart(2, '0');
    elapsedFormatted = `${h}:${m}:${s}`;
  }

  // Grace Period Indicator
  const scheduledStart = currentTime.set({ hour: 9, minute: 0, second: 0 });
  const graceEnd = scheduledStart.plus({ minutes: 15 });
  const isWithinGrace = currentTime <= graceEnd;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>Operational Attendance Punch Terminal</span>
          </div>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            {currentTime.toFormat('hh:mm:ss a')}
          </h2>
          <p className="text-xs text-slate-500">
            {currentTime.toFormat('EEEE, MMMM dd, yyyy')} • ({timezone})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={todayAttendance?.status || 'ABSENT'} size="lg" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
        <div>
          <span className="text-xs text-slate-500 font-medium">Check-In Time</span>
          <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
            {todayAttendance?.checkInAt
              ? DateTime.fromISO(todayAttendance.checkInAt).setZone(timezone).toFormat('hh:mm:ss a')
              : 'Not Clocked In'}
          </p>
        </div>

        <div>
          <span className="text-xs text-slate-500 font-medium">Check-Out Time</span>
          <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
            {todayAttendance?.checkOutAt
              ? DateTime.fromISO(todayAttendance.checkOutAt).setZone(timezone).toFormat('hh:mm:ss a')
              : hasCheckedIn
              ? 'Active In Session'
              : 'Not Clocked Out'}
          </p>
        </div>

        <div>
          <span className="text-xs text-slate-500 font-medium">Elapsed Session Duration</span>
          <p className="text-sm font-bold text-amber-700 mt-0.5 font-mono flex items-center gap-1.5">
            {hasCheckedIn && !hasCheckedOut && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            {elapsedFormatted}
          </p>
        </div>
      </div>

      {/* Action Punch Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Biometric & Token Session Protected (Single Daily Instance)</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!hasCheckedIn ? (
            <button
              onClick={onCheckIn}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-700 hover:to-teal-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? 'Recording Punch...' : 'Check-In for Today'}
            </button>
          ) : !hasCheckedOut ? (
            <button
              onClick={onCheckOut}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-slate-800 hover:to-slate-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isSubmitting ? 'Recording Punch...' : 'Check-Out (End Shift)'}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Today’s Attendance Session Complete</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
