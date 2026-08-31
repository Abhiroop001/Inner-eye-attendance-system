import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Shield,
  Calendar,
  AlertTriangle,
  Clock,
  KeyRound,
  FileText,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { EmployeeProfile, AttendanceRecord, LeaveBalanceRecord } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

export const HREmployeeDetailPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    employee: EmployeeProfile;
    recentAttendance: AttendanceRecord[];
    leaveBalances: LeaveBalanceRecord[];
  }>({
    queryKey: ['hrEmployeeDetail', employeeId],
    queryFn: () => apiRequest(`/hr/employees/${employeeId}`),
  });

  const generateActivationMutation = useMutation({
    mutationFn: () => apiRequest(`/hr/employees/${employeeId}/activation-link`, { method: 'POST' }),
    onSuccess: (res: any) => {
      alert(`New Activation Link Generated:\n${res.activationUrl || res.token}`);
    },
  });

  if (isLoading) return <LoadingSpinner message="Retrieving personnel profile records..." />;
  if (!data || !data.employee) {
    return <div className="p-8 text-center text-xs text-rose-600">Employee profile not found.</div>;
  }

  const { employee, recentAttendance, leaveBalances } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <Link
        to="/employees"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Employee Directory</span>
      </Link>

      {/* Profile Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-display text-xl font-bold shadow-md">
            {employee.legalName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">{employee.legalName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {employee.employeeId} • {employee.designation} • {employee.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateActivationMutation.mutate()}
            disabled={generateActivationMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <KeyRound className="h-4 w-4 text-amber-600" />
            <span>Generate Activation Token</span>
          </button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {leaveBalances.map((b) => (
          <div key={b.leaveType} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.leaveType} Balance</span>
            <p className="text-xl font-black text-slate-900 font-display mt-1">{b.available} Days</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Consumed: {b.consumed}</span>
          </div>
        ))}
      </div>

      {/* Attendance History */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 font-display mb-4">Recent Attendance Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Working Duration</th>
                <th className="px-4 py-3">Tardiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentAttendance.map((rec) => (
                <tr key={rec.attendanceId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold">{rec.attendanceDate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rec.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-mono">{rec.checkInAt ? new Date(rec.checkInAt).toLocaleTimeString() : '—'}</td>
                  <td className="px-4 py-3 font-mono">{rec.checkOutAt ? new Date(rec.checkOutAt).toLocaleTimeString() : '—'}</td>
                  <td className="px-4 py-3">{(rec.workingMinutes / 60).toFixed(1)} hrs</td>
                  <td className="px-4 py-3">
                    {rec.lateMinutes > 0 ? (
                      <span className="text-amber-700 font-bold font-mono">+{rec.lateMinutes} mins</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
