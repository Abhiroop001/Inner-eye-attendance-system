import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Shield, Filter, Search } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { AuditLogRecord } from '../types/index.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

export const HRAuditPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    logs: AuditLogRecord[];
    total: number;
  }>({
    queryKey: ['hrAuditLogs', actionFilter, resultFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (resultFilter) params.append('result', resultFilter);
      params.append('page', String(page));
      params.append('limit', '50');
      return apiRequest(`/hr/audit?${params.toString()}`);
    },
  });

  const logs = data?.logs || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Immutable Compliance Audit Stream
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident audit trail for ISO/IEC 27001 and SOC 2 Type II compliance
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="">All Results</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="DENIED">DENIED</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing {logs.length} of {data?.total || 0} Audit Events
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Retrieving cryptographic audit ledger..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp (UTC)</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Result</th>
                  <th className="px-6 py-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {logs.map((l) => (
                  <tr key={l.auditId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-slate-500 font-normal">
                      {new Date(l.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{l.actorId}</span>
                      <span className="block text-[10px] text-slate-400">[{l.actorType}]</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-900 bg-amber-50/60 px-2 py-0.5 rounded">
                      {l.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {l.entityType} ({l.entityId})
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {l.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 max-w-xs truncate">
                      {l.metadata ? JSON.stringify(l.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
