import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2, Search, Filter, Clock } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { AttendanceRecord } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

export const HRAttendancePage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    records: AttendanceRecord[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['hrAttendance', date, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (date) params.append('startDate', date);
      if (date) params.append('endDate', date);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', '50');
      return apiRequest(`/hr/attendance?${params.toString()}`);
    },
  });

  const records = data?.records || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Organization Attendance Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">Company-wide biometric, mobile, and web punch logs</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing {records.length} of {data?.total || 0} Records
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying organization attendance logs..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Punch In</th>
                  <th className="px-6 py-4">Punch Out</th>
                  <th className="px-6 py-4">Working Time</th>
                  <th className="px-6 py-4">Tardiness</th>
                  <th className="px-6 py-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{rec.employeeName || rec.employeeId}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{rec.employeeId} {rec.department ? `• ${rec.department}` : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-mono">{rec.checkInAt ? new Date(rec.checkInAt).toLocaleTimeString() : '—'}</td>
                    <td className="px-6 py-4 font-mono">{rec.checkOutAt ? new Date(rec.checkOutAt).toLocaleTimeString() : '—'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{(rec.workingMinutes / 60).toFixed(1)} hrs</td>
                    <td className="px-6 py-4">
                      {rec.lateMinutes > 0 ? (
                        <span className="text-amber-700 font-bold font-mono">+{rec.lateMinutes} mins</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{rec.checkInSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
