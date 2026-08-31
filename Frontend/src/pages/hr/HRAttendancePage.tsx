import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2, Filter, Search, Building } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { AttendanceRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const HRAttendancePage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    records: AttendanceRecord[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['hrAttendance', date, department, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (department) params.append('department', department);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', '25');
      return apiRequest(`/hr/attendance?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Organization Attendance Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">Live daily attendance records across all departments and locations</p>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Security">Security</option>
              <option value="Design">Design</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Filter</label>
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
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setDate('');
            setDepartment('');
            setStatusFilter('');
            setPage(1);
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying organization attendance ledger..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Check-In</th>
                  <th className="px-6 py-3.5">Check-Out</th>
                  <th className="px-6 py-3.5">Work Hours</th>
                  <th className="px-6 py-3.5">Late Mins</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.records.map((r) => (
                  <tr key={r.attendanceId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{r.employeeName || r.employeeId}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{r.department}</td>
                    <td className="px-6 py-4 font-mono">{r.checkInAt ? r.checkInAt.slice(11, 19) : '—'}</td>
                    <td className="px-6 py-4 font-mono">{r.checkOutAt ? r.checkOutAt.slice(11, 19) : '—'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono">
                      {(r.workingMinutes / 60).toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {r.lateMinutes > 0 ? (
                        <span className="text-amber-700 font-bold">{r.lateMinutes} min</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                  </tr>
                ))}
                {(!data || data.records.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No attendance entries found for the selected date and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
