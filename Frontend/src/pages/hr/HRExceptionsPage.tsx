import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, FileText, Download, Sparkles } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { LateReasonRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';

export const HRExceptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedException, setSelectedException] = useState<LateReasonRecord | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO'>('APPROVE');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    exceptions: LateReasonRecord[];
    total: number;
  }>({
    queryKey: ['hrExceptions', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      return apiRequest(`/hr/exceptions?${params.toString()}`);
    },
  });

  const adjudicateMutation = useMutation({
    mutationFn: () => {
      if (!selectedException) return Promise.resolve();
      return apiRequest(`/hr/exceptions/${selectedException.lateReasonId}/adjudicate`, {
        method: 'POST',
        body: JSON.stringify({ action: actionType, comment }),
      });
    },
    onSuccess: () => {
      setSelectedException(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['hrExceptions'] });
      queryClient.invalidateQueries({ queryKey: ['hrDashboard'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to adjudicate exception');
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Late Exception Adjudications</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review employee late arrival explanations, inspect uploaded transit/medical proofs, and apply policy rulings
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', ''].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All Exceptions'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-semibold">{data?.total || 0} Exceptions Found</span>
      </div>

      {/* Exceptions Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying exceptions queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Date & Late Mins</th>
                  <th className="px-6 py-3.5">Reason Category</th>
                  <th className="px-6 py-3.5">Explanation</th>
                  <th className="px-6 py-3.5">AI Advisory Rec</th>
                  <th className="px-6 py-3.5">Attached Docs</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.exceptions.map((ex) => (
                  <tr key={ex.lateReasonId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{ex.employeeName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{ex.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold font-mono text-slate-900 block">{ex.attendanceDate}</span>
                      <span className="text-[11px] font-mono text-amber-700 font-bold">{ex.lateMinutes} mins late</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{ex.reasonCategory}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">{ex.employeeExplanation}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        <span>{ex.aiRecommendation || 'ACCEPT'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ex.documents && ex.documents.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {ex.documents.map((doc) => (
                            <a
                              key={doc.documentId}
                              href={`/api/hr/documents/${doc.documentId}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] hover:bg-amber-100"
                            >
                              <FileText className="h-3 w-3" />
                              <span>View Doc</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None attached</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ex.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setErrorMsg(null);
                          setSelectedException(ex);
                          setActionType('APPROVE');
                          setComment('Late penalty waived per policy review');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                      >
                        Adjudicate
                      </button>
                    </td>
                  </tr>
                ))}
                {(!data || data.exceptions.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No late exception records found in this queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjudication Modal */}
      <Modal
        isOpen={!!selectedException}
        onClose={() => setSelectedException(null)}
        title="Adjudicate Late Exception"
        subtitle={`Employee: ${selectedException?.employeeName} (${selectedException?.employeeId})`}
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
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-900">{selectedException?.reasonCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Late Duration:</span>
              <span className="font-bold text-amber-800">{selectedException?.lateMinutes} minutes</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Employee Explanation:</span>
              <p className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                {selectedException?.employeeExplanation}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 pt-1">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span>AI Policy Advisory: <strong>{selectedException?.aiRecommendation}</strong> ({selectedException?.aiReasoning})</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Adjudication Decision
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionType('APPROVE');
                  setComment('Late penalty waived per policy review');
                }}
                className={`py-2 rounded-xl font-bold text-xs border transition ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Approve (Waive)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('REJECT');
                  setComment('Unexcused tardiness. Penalty stands.');
                }}
                className={`py-2 rounded-xl font-bold text-xs border transition ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Reject (Penalty)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('REQUEST_INFO');
                  setComment('Please provide a supporting transit slip or medical certificate.');
                }}
                className={`py-2 rounded-xl font-bold text-xs border transition ${
                  actionType === 'REQUEST_INFO'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Request Info
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reviewer Justification / Feedback
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
              onClick={() => setSelectedException(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjudicateMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow"
            >
              {adjudicateMutation.isPending ? 'Applying Decision...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
