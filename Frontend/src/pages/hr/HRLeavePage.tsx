import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { LeaveRequestRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';

export const HRLeavePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [adjudicateReq, setAdjudicateReq] = useState<LeaveRequestRecord | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    requests: LeaveRequestRecord[];
    total: number;
  }>({
    queryKey: ['hrLeaveRequests', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      return apiRequest(`/hr/leave?${params.toString()}`);
    },
  });

  const adjudicateMutation = useMutation({
    mutationFn: () => {
      if (!adjudicateReq) return Promise.resolve();
      const endpoint = actionType === 'APPROVE' ? 'approve' : 'reject';
      return apiRequest(`/hr/leave/${adjudicateReq.leaveRequestId}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });
    },
    onSuccess: () => {
      setAdjudicateReq(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['hrLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['hrDashboard'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to adjudicate leave request');
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Leave Approvals Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review time-off requests. Approvals automatically execute deterministic balance deductions and record ON_LEAVE entries.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All Requests'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-semibold">{data?.total || 0} Requests</span>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Fetching leave requests queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Date Range</th>
                  <th className="px-6 py-3.5">Working Days</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.requests.map((req) => (
                  <tr key={req.leaveRequestId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{req.employeeName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{req.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{req.department}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{req.leaveType}</td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {req.totalDays} {req.isHalfDay ? `(Half-Day ${req.halfDaySession})` : 'days'}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">{req.reason}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setErrorMsg(null);
                              setAdjudicateReq(req);
                              setActionType('APPROVE');
                              setComment('Approved by HR Operations');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"
                            title="Approve Leave"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setErrorMsg(null);
                              setAdjudicateReq(req);
                              setActionType('REJECT');
                              setComment('Insufficient departmental coverage');
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold"
                            title="Reject Leave"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Adjudicated</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.requests.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No leave requests found in this queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjudicate Modal */}
      <Modal
        isOpen={!!adjudicateReq}
        onClose={() => setAdjudicateReq(null)}
        title={actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
        subtitle={`Employee: ${adjudicateReq?.employeeName} (${adjudicateReq?.employeeId})`}
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            adjudicateMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Leave Type:</span>
              <span className="font-bold text-slate-900">{adjudicateReq?.leaveType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Working Days to Deduct:</span>
              <span className="font-bold text-slate-900">{adjudicateReq?.totalDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason:</span>
              <span className="text-slate-800">{adjudicateReq?.reason}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reviewer Decision Comment
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAdjudicateReq(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjudicateMutation.isPending}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow transition ${
                actionType === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {adjudicateMutation.isPending
                ? 'Processing...'
                : actionType === 'APPROVE'
                ? 'Confirm & Deduct Balance'
                : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
