import React from 'react';
import { Sliders, Clock, CalendarDays, Shield, CheckCircle2 } from 'lucide-react';

export const HRSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Work Schedules & Attendance Policy Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configure standard shifts, grace periods, leave entitlements, and holiday calendars</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Schedules */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Configured Work Schedules</h3>
              <p className="text-[11px] text-slate-500">Core hours and tardiness thresholds</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">Standard General Shift (SCH-GEN-01)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Default</span>
              </div>
              <p className="text-slate-500">09:00 AM - 05:00 PM • 15m Grace Period • 60m Unpaid Break</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">Morning Operations Shift (SCH-OPS-01)</span>
              </div>
              <p className="text-slate-500">06:00 AM - 02:00 PM • 10m Grace Period • 45m Break</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">Flexible Product Core Shift (SCH-FLEX-01)</span>
              </div>
              <p className="text-slate-500">10:00 AM - 06:00 PM • 20m Grace Period • Core: 11:00 - 16:00</p>
            </div>
          </div>
        </div>

        {/* Leave Entitlements */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Annual Leave Quota Policy</h3>
              <p className="text-[11px] text-slate-500">Standard LP-STD-2026</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold">Casual Leave (CL)</span>
              <span className="font-bold font-mono">12 Days / Year</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold">Sick / Medical Leave (SL)</span>
              <span className="font-bold font-mono">10 Days / Year</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold">Emergency Unforeseen Leave (EL)</span>
              <span className="font-bold font-mono">5 Days / Year</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold">Maternity & Paternity</span>
              <span className="font-bold font-mono">180 / 15 Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
