import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { LeaveBalanceRecord, LeaveRequestRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../context/AuthContext.js';

export const EmployeeLeavePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'SICK' | 'EMERGENCY'>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    balances: LeaveBalanceRecord[];
    requests: LeaveRequestRecord[];
  }>({
    queryKey: ['myLeaveData'],
    enabled: !!user?.employeeId,
    queryFn: () => apiRequest('/me/leave'),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      apiRequest('/me/leave', {
        method: 'POST',
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          isHalfDay,
          halfDaySession: isHalfDay ? halfDaySession : null,
          reason,
        }),
      }),
    onSuccess: () => {
      setIsApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setIsHalfDay(false);
      queryClient.invalidateQueries({ queryKey: ['myLeaveData'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit leave application');
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-1">Review balance entitlements and submit time-off requests</p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsApplyModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data?.balances.map((b) => (
          <div key={b.leaveType} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{b.leaveType} LEAVE</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Quota: {b.openingBalance}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">{b.available}</span>
              <span className="text-xs text-slate-500">days available</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Consumed: <strong className="text-slate-800">{b.consumed}</strong></span>
              <span>Credited: <strong className="text-slate-800">{b.credited}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Requests History Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-display">My Leave Applications History</h3>
          <span className="text-[11px] text-slate-500">Deterministic working days calculation applied</span>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching leave applications..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Start Date</th>
                  <th className="px-6 py-3.5">End Date</th>
                  <th className="px-6 py-3.5">Working Days</th>
                  <th className="px-6 py-3.5">Reason Narrative</th>
                  <th className="px-6 py-3.5">Approval Status</th>
                  <th className="px-6 py-3.5">Reviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.requests.map((req) => (
                  <tr key={req.leaveRequestId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{req.leaveType}</td>
                    <td className="px-6 py-4 font-mono">{req.startDate}</td>
                    <td className="px-6 py-4 font-mono">{req.endDate}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {req.totalDays} {req.isHalfDay ? `(Half-Day ${req.halfDaySession})` : 'days'}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">{req.reason}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {req.reviewerComment || (req.status === 'PENDING' ? 'Awaiting HR Review' : '—')}
                    </td>
                  </tr>
                ))}
                {(!data || data.requests.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No leave applications submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Application"
        subtitle="Weekends and public holidays are automatically excluded from the calculation"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              <option value="CASUAL">Casual / Privilege Leave</option>
              <option value="SICK">Sick / Medical Leave</option>
              <option value="EMERGENCY">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfDayToggle"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="halfDayToggle" className="font-bold text-slate-700">Apply as Half-Day Absence (0.5 day)</label>
          </div>

          {isHalfDay && (
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Half-Day Session</label>
              <select
                value={halfDaySession}
                onChange={(e) => setHalfDaySession(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="FIRST_HALF">First Half (Morning Session)</option>
                <option value="SECOND_HALF">Second Half (Afternoon Session)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Reason Narrative</label>
            <textarea
              required
              rows={3}
              placeholder="State the operational reason for your leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending || !startDate || !endDate || reason.length < 5}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {applyMutation.isPending ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
