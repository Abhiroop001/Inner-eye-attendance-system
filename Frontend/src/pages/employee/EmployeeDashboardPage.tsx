import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck2,
  Clock,
  AlertTriangle,
  CalendarDays,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiRequest } from '../../services/api.js';
import { EmployeeDashboardData } from '../../types/index.js';
import { KpiCard } from '../../components/common/KpiCard.js';
import { PunchClockWidget } from '../../components/common/PunchClockWidget.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export const EmployeeDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLateAttendanceId, setSelectedLateAttendanceId] = useState<string | null>(null);
  const [reasonCategory, setReasonCategory] = useState<string>('TRAFFIC_TRANSIT');
  const [explanation, setExplanation] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<EmployeeDashboardData>({
    queryKey: ['employeeDashboard'],
    queryFn: () => apiRequest<EmployeeDashboardData>('/me/dashboard'),
    enabled: !!user?.employeeId && user.role !== 'HR',
    refetchInterval: 30000,
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiRequest('/me/attendance/check-in', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Check-in failed');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => apiRequest('/me/attendance/check-out', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Check-out failed');
    },
  });

  const submitLateReasonMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLateAttendanceId) return;
      let docIds: string[] = [];

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const docRes = await apiRequest(`/me/exceptions/${selectedLateAttendanceId}/documents`, {
          method: 'POST',
          body: formData,
        });
        if (docRes.documentId) docIds.push(docRes.documentId);
      }

      return await apiRequest(`/me/exceptions/${selectedLateAttendanceId}/reason`, {
        method: 'POST',
        body: JSON.stringify({
          reasonCategory,
          employeeExplanation: explanation,
          supportingDocumentIds: docIds,
        }),
      });
    },
    onSuccess: () => {
      setSelectedLateAttendanceId(null);
      setExplanation('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to submit late explanation');
    },
  });

  // Early redirect if authenticated as HR Admin
  if (user?.role === 'HR') {
    return <Navigate to="/hr/dashboard" replace />;
  }

  if (isLoading) return <LoadingSpinner message="Assembling personal attendance metrics..." />;
  if (error || !data) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        Failed to load employee dashboard data.
      </div>
    );
  }

  // Chart data formatting
  const chartData = data.recentHistory.map((r) => ({
    date: r.attendanceDate.slice(5),
    hours: Number((r.workingMinutes / 60).toFixed(1)),
    status: r.status,
  }));

  // Check if today or recent records have unsubmitted late exceptions
  const pendingLateAtt = data.today.status === 'LATE' && !data.today.lateReasonId ? data.today : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Welcome back, {data.employee.preferredName || data.employee.legalName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {data.employee.designation} • {data.employee.department} • {data.employee.employeeId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/employee/leave"
            className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <CalendarDays className="h-4 w-4 text-slate-600" />
            <span>Apply for Leave</span>
          </Link>
        </div>
      </div>

      {/* Main Punch Clock Terminal */}
      <PunchClockWidget
        todayAttendance={data.today}
        timezone={data.employee.timezone}
        onCheckIn={async () => {
          await checkInMutation.mutateAsync();
        }}
        onCheckOut={async () => {
          await checkOutMutation.mutateAsync();
        }}
        isSubmitting={checkInMutation.isPending || checkOutMutation.isPending}
      />

      {/* Late Arrival Alert Action Card */}
      {pendingLateAtt && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 to-amber-600/10 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-slate-950 font-bold rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Late Check-In Flagged ({pendingLateAtt.lateMinutes} mins)</h4>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                  You checked in past the standard 15-minute grace period. Please submit an official explanation and optional proof for HR review.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedLateAttendanceId(pendingLateAtt.attendanceId)}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 shadow transition"
            >
              <span>Submit Reason</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Weekly Hours Logged"
          value={`${data.kpi.weeklyHours} hrs`}
          subtitle="Target: 35.0 hrs"
          icon={<Clock className="h-5 w-5" />}
          trend={{ value: '+2.4 hrs', isPositive: true, label: 'vs last week' }}
        />
        <KpiCard
          title="Monthly Attendance"
          value={`${data.kpi.monthlyAttendanceRate}%`}
          subtitle="Punctuality Score"
          icon={<CalendarCheck2 className="h-5 w-5" />}
          trend={{ value: 'Target: >95%', isPositive: data.kpi.monthlyAttendanceRate >= 95 }}
        />
        <KpiCard
          title="Late Check-Ins"
          value={data.kpi.monthlyLateCount}
          subtitle="This Month"
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          trend={{ value: data.kpi.monthlyLateCount > 3 ? 'Warning' : 'Normal', isPositive: data.kpi.monthlyLateCount <= 3 }}
        />
        <KpiCard
          title="Total Month Hours"
          value={`${data.kpi.totalWorkingHoursMonth} hrs`}
          subtitle="Net Working Time"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          highlight={true}
        />
      </div>

      {/* Analytics Chart & Leave Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Working Hours Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Recent Attendance & Working Hours</h3>
              <p className="text-xs text-slate-500">Daily net working hours across the last 14 sessions</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Standard: 7.0 hrs/day
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl">
                          <p className="font-bold">{d.date}</p>
                          <p className="text-amber-400">{d.hours} net working hours</p>
                          <p className="text-[10px] text-slate-400 capitalize">Status: {d.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Balances Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 font-display">Available Leave Quota</h3>
              <Link to="/employee/leave" className="text-xs font-bold text-amber-700 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {data.leaveBalances.map((b) => (
                <div key={b.leaveType} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{b.leaveType} LEAVE</span>
                    <span className="block text-[10px] text-slate-500">
                      Consumed: {b.consumed} • Opening: {b.openingBalance}
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 font-display">
                    {b.available} <span className="text-xs font-normal text-slate-500">days</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Policy Rule:</span> Weekend days and public holidays are excluded from leave calculations.
          </div>
        </div>
      </div>

      {/* Late Reason Submission Modal */}
      <Modal
        isOpen={!!selectedLateAttendanceId}
        onClose={() => {
          setSelectedLateAttendanceId(null);
          setActionError(null);
        }}
        title="Submit Late Arrival Explanation"
        subtitle="Your explanation will be evaluated by HR with LangGraph advisory policy assistance"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {actionError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLateReasonMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason Category
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              <option value="TRAFFIC_TRANSIT">Traffic / Public Transit Delay</option>
              <option value="MEDICAL">Medical Emergency / Doctor Appointment</option>
              <option value="FAMILY_EMERGENCY">Family / Personal Emergency</option>
              <option value="CLIENT_MEETING">Off-site Client Meeting</option>
              <option value="TECHNICAL_GLITCH">Hardware / Network Glitch</option>
              <option value="OTHER">Other Operational Reason</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Explanation (Min. 10 chars)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the cause of late arrival..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supporting Proof Document (Optional, Mandatory if Medical or &gt;60m)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
            />
            <p className="mt-1 text-[10px] text-slate-400">Accepted: PDF, JPEG, PNG (Max 10 MB). Scanned for integrity.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedLateAttendanceId(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLateReasonMutation.isPending || explanation.trim().length < 10}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {submitLateReasonMutation.isPending ? 'Submitting & Evaluating...' : 'Submit to HR'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
