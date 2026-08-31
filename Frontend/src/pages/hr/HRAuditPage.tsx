import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Shield, Search, CheckCircle2, XCircle, AlertCircle, Code } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { AuditLogRecord } from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';

export const HRAuditPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<AuditLogRecord | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    logs: AuditLogRecord[];
    total: number;
    page: number;
  }>({
    queryKey: ['hrAuditLogs', actionFilter, actorFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (actorFilter) params.append('actorId', actorFilter);
      params.append('page', String(page));
      params.append('limit', '25');
      return apiRequest(`/hr/audit?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Compliance & Security Audit Stream</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable append-only record of all identity, attendance, exception, and policy mutation events
        </p>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Filter by Actor ID or Email..."
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none min-w-[200px]"
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="ATTENDANCE_CHECK_IN">ATTENDANCE_CHECK_IN</option>
            <option value="ATTENDANCE_CHECK_OUT">ATTENDANCE_CHECK_OUT</option>
            <option value="LATE_REASON_SUBMITTED">LATE_REASON_SUBMITTED</option>
            <option value="LATE_EXCEPTION_APPROVE">LATE_EXCEPTION_APPROVE</option>
            <option value="LEAVE_APPLICATION_SUBMITTED">LEAVE_APPLICATION_SUBMITTED</option>
            <option value="LEAVE_REQUEST_APPROVED">LEAVE_REQUEST_APPROVED</option>
            <option value="REGISTRATION_REQUEST_EVALUATED">REGISTRATION_REQUEST_EVALUATED</option>
            <option value="EMPLOYEE_ACCOUNT_ACTIVATED">EMPLOYEE_ACCOUNT_ACTIVATED</option>
          </select>
        </div>

        <button
          onClick={() => {
            setActionFilter('');
            setActorFilter('');
            setPage(1);
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          Reset Filter
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Streaming immutable compliance logs..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp (UTC)</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">Result</th>
                  <th className="px-6 py-3.5">IP Hash</th>
                  <th className="px-6 py-3.5">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.logs.map((log) => (
                  <tr key={log.auditId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{log.createdAt}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">{log.action}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{log.actorId}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Role: {log.role}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{log.ipHash || '—'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedAudit(log)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded"
                      >
                        <Code className="h-3 w-3" />
                        <span>JSON</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {(!data || data.logs.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No audit events recorded matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Metadata Modal */}
      <Modal
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title="Audit Event Raw Metadata"
        subtitle={`Event ID: ${selectedAudit?.auditId}`}
      >
        <div className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
          <pre>{JSON.stringify(selectedAudit, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};
