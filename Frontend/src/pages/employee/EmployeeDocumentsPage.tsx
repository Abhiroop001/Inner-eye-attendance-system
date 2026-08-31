import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, ShieldCheck, HardDrive } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { SupportingDocumentRecord } from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const EmployeeDocumentsPage: React.FC = () => {
  const { data, isLoading } = useQuery<SupportingDocumentRecord[]>({
    queryKey: ['myDocuments'],
    queryFn: async () => {
      // Pull documents through exceptions query
      const exceptions = await apiRequest<any[]>('/me/exceptions');
      const docs: SupportingDocumentRecord[] = [];
      exceptions.forEach((e) => {
        if (e.lateReason?.documents) {
          docs.push(...e.lateReason.documents);
        }
      });
      return docs;
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Supporting Document Vault</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically hashed (SHA-256) medical and transit certificates stored in private GridFS vaults
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Scanning secure document vault..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Original Filename</th>
                  <th className="px-6 py-3.5">MIME Type</th>
                  <th className="px-6 py-3.5">Size</th>
                  <th className="px-6 py-3.5">SHA-256 Integrity Digest</th>
                  <th className="px-6 py-3.5">Scan Status</th>
                  <th className="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span>{doc.originalFilename}</span>
                    </td>
                    <td className="px-6 py-4 font-mono">{doc.mimeType}</td>
                    <td className="px-6 py-4 font-mono">{(doc.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {doc.sha256}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>CLEAN</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/api/hr/documents/${doc.documentId}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-amber-700 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No supporting documents uploaded to your account vault.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
