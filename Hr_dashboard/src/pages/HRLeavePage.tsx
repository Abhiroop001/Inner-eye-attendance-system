import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, XCircle, Clock, Filter, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { LeaveRequestRecord } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { Modal } from '../components/common/Modal.js';

export const HRLeavePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequestRecord | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!selectedLeave) return Promise.resolve();
      return apiRequest(`/hr/leave/${selectedLeave.leaveRequestId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: actionType, comment }),
      });
    },
    onSuccess: () => {
      setSelectedLeave(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['hrLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['hrDashboard'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit review');
    },
  });

  const requests = data?.requests || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Leave Approval & Quota Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review leave applications, enforce department minimum coverage, and deduct balances</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="">All Applications</option>
            <option value="PENDING">Pending Action</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing {requests.length} of {data?.total || 0} Requests
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading leave queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Total Days</th>
                  <th className="px-6 py-4">Reason Statement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((r) => {
                  const isPending = r.status === 'PENDING';
                  return (
                    <tr key={r.leaveRequestId} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-slate-900 block">{r.employeeName || r.employeeId}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{r.employeeId} {r.department ? `• ${r.department}` : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {r.leaveType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">
                        {r.startDate} &rarr; {r.endDate}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{r.totalDays} Day(s)</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => {
                              setSelectedLeave(r);
                              setActionType('APPROVE');
                              setComment('Approved in accordance with annual leave entitlements.');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title="Leave Adjudication"
        subtitle={`Employee: ${selectedLeave?.employeeName} (${selectedLeave?.employeeId})`}
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            reviewMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">{selectedLeave?.leaveType} LEAVE ({selectedLeave?.totalDays} Days)</p>
            <p className="text-slate-500 font-mono">{selectedLeave?.startDate} to {selectedLeave?.endDate}</p>
            <p className="text-slate-700 italic mt-2">"{selectedLeave?.reason}"</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionType('APPROVE');
                  setComment('Approved in accordance with annual leave entitlements.');
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Deduct</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionType('REJECT');
                  setComment('Insufficient departmental coverage during this operational window.');
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Request</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Review Comments</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedLeave(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition disabled:opacity-50"
            >
              {reviewMutation.isPending ? 'Processing...' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
