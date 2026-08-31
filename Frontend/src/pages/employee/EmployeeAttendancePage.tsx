import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { CalendarCheck2, Filter, Search, Download, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { AttendanceRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { useAuth } from '../../context/AuthContext.js';

export const EmployeeAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    records: AttendanceRecord[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['myAttendance', startDate, endDate, statusFilter, page],
    enabled: !!user?.employeeId,
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', '25');
      return apiRequest(`/me/attendance?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Personal Attendance Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Verified check-in/out timestamps and session calculations</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="HALF_DAY">HALF_DAY</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="HOLIDAY">HOLIDAY</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setStartDate('');
            setEndDate('');
            setStatusFilter('');
            setPage(1);
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Attendance History Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Fetching attendance history..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Attendance Date</th>
                  <th className="px-6 py-3.5">Check-In</th>
                  <th className="px-6 py-3.5">Check-Out</th>
                  <th className="px-6 py-3.5">Working Duration</th>
                  <th className="px-6 py-3.5">Late Minutes</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Session Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.records.map((r) => (
                  <tr key={r.attendanceId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">{r.attendanceDate}</td>
                    <td className="px-6 py-4 font-mono">
                      {r.checkInAt ? DateTime.fromISO(r.checkInAt).toFormat('hh:mm:ss a') : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {r.checkOutAt ? DateTime.fromISO(r.checkOutAt).toFormat('hh:mm:ss a') : '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono">
                      {(r.workingMinutes / 60).toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4">
                      {r.lateMinutes > 0 ? (
                        <span className="font-bold text-amber-700 font-mono">{r.lateMinutes} min</span>
                      ) : (
                        <span className="text-slate-400 font-mono">0 min</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {r.notes || (r.isAdjusted ? 'Adjusted by HR' : 'Standard Session')}
                    </td>
                  </tr>
                ))}
                {(!data || data.records.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No attendance records found matching the chosen criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.total > 25 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            <span>Showing page {data.page} of {Math.ceil(data.total / 25)} ({data.total} total records)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * 25 >= data.total}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
