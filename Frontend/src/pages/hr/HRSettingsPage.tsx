import React from 'react';
import { Sliders, Calendar, Clock, Shield } from 'lucide-react';

export const HRSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Work Schedules & Holiday Calendars</h1>
        <p className="text-xs text-slate-500 mt-1">Configure operational shifts, grace minutes, break rules, and gazetted holidays</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Schedules */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Active Work Schedules</h3>
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

        {/* Holiday Calendar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">2026 Gazetted Public Holidays</h3>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { date: '2026-01-01', name: "New Year's Day" },
              { date: '2026-01-26', name: 'Republic Day' },
              { date: '2026-03-04', name: 'Holi Festival' },
              { date: '2026-04-03', name: 'Good Friday' },
              { date: '2026-05-01', name: "International Workers' Day" },
              { date: '2026-08-15', name: 'Independence Day' },
              { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti' },
              { date: '2026-11-08', name: 'Diwali Festival' },
              { date: '2026-12-25', name: 'Christmas Day' },
            ].map((h) => (
              <div key={h.date} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">{h.name}</span>
                <span className="font-mono text-slate-500">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
