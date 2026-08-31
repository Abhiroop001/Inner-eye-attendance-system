import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Calendar, ShieldCheck, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { EmployeeProfile, AttendanceRecord, LeaveBalanceRecord, LateReasonRecord, SupportingDocumentRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const HREmployeeDetailPage: React.FC = () => {
  const { employeeId } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    employee: EmployeeProfile;
    recentAttendance: AttendanceRecord[];
    leaveBalances: LeaveBalanceRecord[];
    lateReasons: LateReasonRecord[];
    documents: SupportingDocumentRecord[];
  }>({
    queryKey: ['hrEmployeeDetail', employeeId],
    queryFn: () => apiRequest(`/hr/employees/${employeeId}`),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      apiRequest(`/hr/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ employmentStatus: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrEmployeeDetail', employeeId] });
    },
  });

  if (isLoading) return <LoadingSpinner message="Assembling employee 90-day activity record..." />;
  if (!data) return <div className="p-8 text-center text-xs text-rose-600">Employee profile not found.</div>;

  const { employee, recentAttendance, leaveBalances, lateReasons, documents } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/hr/employees"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Employee Directory</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">{employee.legalName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {employee.employeeId} • {employee.designation} • {employee.department}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={employee.employmentStatus} size="lg" />
            <button
              onClick={() => {
                const nextStatus = employee.employmentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                if (confirm(`Are you sure you want to change status to ${nextStatus}?`)) {
                  toggleStatusMutation.mutate(nextStatus);
                }
              }}
              className="text-xs font-bold px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition shadow-sm"
            >
              {employee.employmentStatus === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase text-slate-400">Work Email</span>
          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{employee.workEmail}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase text-slate-400">Schedule Template</span>
          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{employee.workScheduleId}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase text-slate-400">Joining Date</span>
          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{employee.joiningDate}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase text-slate-400">Branch Office</span>
          <p className="text-xs font-bold text-slate-900 mt-1">{employee.location}</p>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 font-display mb-4">Leave Entitlement Balances</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaveBalances.map((b) => (
            <div key={b.leaveType} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">{b.leaveType}</span>
                <span className="block text-[10px] text-slate-400">Consumed: {b.consumed}</span>
              </div>
              <span className="text-xl font-extrabold text-slate-900 font-display">{b.available} <span className="text-xs font-normal text-slate-500">days</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* 90-Day Attendance Ledger */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-display">90-Day Historical Attendance Timeline</h3>
          <span className="text-[11px] text-slate-500">{recentAttendance.length} records populated</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check-In</th>
                <th className="px-6 py-3">Check-Out</th>
                <th className="px-6 py-3">Working Duration</th>
                <th className="px-6 py-3">Late Mins</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentAttendance.map((r) => (
                <tr key={r.attendanceId} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-3.5 font-bold font-mono text-slate-900">{r.attendanceDate}</td>
                  <td className="px-6 py-3.5 font-mono">{r.checkInAt ? r.checkInAt.slice(11, 19) : '—'}</td>
                  <td className="px-6 py-3.5 font-mono">{r.checkOutAt ? r.checkOutAt.slice(11, 19) : '—'}</td>
                  <td className="px-6 py-3.5 font-semibold font-mono text-slate-900">{(r.workingMinutes / 60).toFixed(1)} hrs</td>
                  <td className="px-6 py-3.5 font-mono">{r.lateMinutes > 0 ? `${r.lateMinutes} min` : '0'}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-[11px]">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
