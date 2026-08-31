import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Download,
  Sparkles,
  Search,
  Clock,
  ShieldAlert,
  User,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { apiRequest, getDocumentDownloadUrl } from '../services/api.js';
import { LateReasonRecord } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { Modal } from '../components/common/Modal.js';

export const HRExceptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const exceptionsList = data?.exceptions || [];

  // Filter by search query (employee name, ID, or explanation)
  const filteredExceptions = exceptionsList.filter((ex) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (ex.employeeName && ex.employeeName.toLowerCase().includes(q)) ||
      (ex.employeeId && ex.employeeId.toLowerCase().includes(q)) ||
      (ex.employeeExplanation && ex.employeeExplanation.toLowerCase().includes(q)) ||
      (ex.reasonCategory && ex.reasonCategory.toLowerCase().includes(q))
    );
  });

  // Calculate high-level summary KPIs
  const totalCount = exceptionsList.length;
  const pendingCount = exceptionsList.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'UNDER_REVIEW'
  ).length;
  const criticalLateCount = exceptionsList.filter((e) => (e.lateMinutes || 0) >= 60).length;
  const medicalCount = exceptionsList.filter((e) => e.reasonCategory === 'MEDICAL').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Late Arrival Exception Adjudications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review tardiness explanations, inspect transit & medical certificates, and apply policy-grounded rulings
          </p>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Exceptions</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 font-display">{totalCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Cumulative exceptions recorded</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Pending Review</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-950 font-display">{pendingCount}</p>
          <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Awaiting HR adjudication</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Critical (&gt;60 mins)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-950 font-display">{criticalLateCount}</p>
          <span className="text-[11px] text-rose-700 mt-1 block">Mandatory proof policy applies</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Medical Verified</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 font-display">{medicalCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Doctor note verified</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by employee name, ID, or reason keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {[
              { label: 'All', value: '' },
              { label: 'Pending', value: 'SUBMITTED' },
              { label: 'Under Review', value: 'UNDER_REVIEW' },
              { label: 'Accepted', value: 'ACCEPTED' },
              { label: 'Rejected', value: 'REJECTED' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === tab.value
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing {filteredExceptions.length} of {totalCount} Exceptions
        </span>
      </div>

      {/* Exceptions Grid / Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying exception queues..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Attendance Date & Delay</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 max-w-xs">Employee Statement</th>
                  <th className="px-6 py-4">AI Advisory Assessment</th>
                  <th className="px-6 py-4">Attached Proof</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Adjudication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredExceptions.map((ex) => {
                  const isPending = ex.status === 'SUBMITTED' || ex.status === 'UNDER_REVIEW';
                  const isSevere = (ex.lateMinutes || 0) >= 60;

                  return (
                    <tr key={ex.lateReasonId} className="hover:bg-slate-50/80 transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold font-display text-xs">
                            {(ex.employeeName || 'E').charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {ex.employeeName || 'Employee'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {ex.employeeId} {ex.department ? `• ${ex.department}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold font-mono text-slate-900 block">{ex.attendanceDate}</span>
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] mt-0.5 rounded px-1.5 py-0.5 ${
                            isSevere
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{ex.lateMinutes || 0} mins late</span>
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {ex.reasonCategory}
                        </span>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2" title={ex.employeeExplanation}>
                          {ex.employeeExplanation}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full w-fit">
                            <Sparkles className="h-3 w-3 text-amber-600" />
                            <span>{ex.aiRecommendation || 'WAIVE_PENALTY'}</span>
                          </span>
                          {ex.aiReasoning && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[160px]" title={ex.aiReasoning}>
                              {ex.aiReasoning}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {ex.documents && ex.documents.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ex.documents.map((doc) => (
                              <a
                                key={doc.documentId}
                                href={getDocumentDownloadUrl(doc.documentId)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-800 font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 px-2 py-1 rounded text-[11px] transition shadow-xs"
                              >
                                <FileText className="h-3 w-3 text-amber-600" />
                                <span>Certificate</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No document</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={ex.status} size="sm" />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setErrorMsg(null);
                            setSelectedException(ex);
                            setActionType('APPROVE');
                            setComment('Late penalty waived per company policy exception review.');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
                            isPending
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>{isPending ? 'Review' : 'Re-evaluate'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredExceptions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No late arrival exceptions found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enhanced Adjudication Modal */}
      <Modal
        isOpen={!!selectedException}
        onClose={() => setSelectedException(null)}
        title="Late Exception Adjudication Terminal"
        subtitle={`Employee: ${selectedException?.employeeName} • ID: ${selectedException?.employeeId}`}
        maxWidth="2xl"
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
          {/* Employee Statement & Timeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Date & Delay</span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {selectedException?.attendanceDate}
              </p>
              <span className="text-amber-700 font-bold font-mono text-xs">
                +{selectedException?.lateMinutes} minutes tardy
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Reason Category</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {selectedException?.reasonCategory}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Attached Proof</span>
              {selectedException?.documents && selectedException.documents.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedException.documents.map((d) => (
                    <a
                      key={d.documentId}
                      href={getDocumentDownloadUrl(d.documentId)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded hover:bg-amber-100 transition"
                    >
                      <FileText className="h-3 w-3 text-amber-600" />
                      <span>Inspect Certificate</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-500 mt-0.5">None Submitted</p>
              )}
            </div>
          </div>

          {/* Statement Block */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Employee Explanation Statement
            </label>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed text-xs">
              {selectedException?.employeeExplanation}
            </div>
          </div>

          {/* AI Policy Assessment Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 rounded-xl border border-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span>LangGraph Policy Recommendation: <strong>{selectedException?.aiRecommendation || 'WAIVE_PENALTY'}</strong></span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {selectedException?.aiReasoning ||
                'Reason aligns with company emergency policy allowance. No consecutive pattern observed.'}
            </p>
          </div>

          {/* Adjudication Decision Segmented Buttons */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Adjudication Action
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActionType('APPROVE');
                  setComment('Late penalty waived per policy exception review.');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mb-1" />
                <span>Approve & Waive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionType('REJECT');
                  setComment('Unexcused tardiness. Standard attendance penalty recorded.');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="h-4 w-4 mb-1" />
                <span>Reject (Penalty)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionType('REQUEST_INFO');
                  setComment('Please upload a supporting transit slip or medical certificate to verify delay.');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  actionType === 'REQUEST_INFO'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="h-4 w-4 mb-1" />
                <span>Request Info</span>
              </button>
            </div>
          </div>

          {/* Decision Rationale */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reviewer Decision Rationale / Notes (Recorded in Audit Stream)
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedException(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjudicateMutation.isPending}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                actionType === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : actionType === 'REJECT'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              } disabled:opacity-50`}
            >
              {adjudicateMutation.isPending ? 'Submitting Ruling...' : 'Confirm Adjudication Ruling'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
