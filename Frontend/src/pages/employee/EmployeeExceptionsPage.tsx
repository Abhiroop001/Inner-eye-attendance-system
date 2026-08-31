import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FileText, CheckCircle2, Clock, Upload, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { AttendanceRecord, LateReasonRecord } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../context/AuthContext.js';

export const EmployeeExceptionsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedException, setSelectedException] = useState<{
    attendance: AttendanceRecord;
    lateReason?: LateReasonRecord | null;
  } | null>(null);

  const [reasonCategory, setReasonCategory] = useState<string>('TRAFFIC_TRANSIT');
  const [explanation, setExplanation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<
    Array<{ attendance: AttendanceRecord; lateReason: LateReasonRecord | null }>
  >({
    queryKey: ['myExceptions'],
    enabled: !!user?.employeeId,
    queryFn: () => apiRequest('/me/exceptions'),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedException) return;
      let docIds: string[] = [];

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const docRes = await apiRequest(`/me/exceptions/${selectedException.attendance.attendanceId}/documents`, {
          method: 'POST',
          body: formData,
        });
        if (docRes.documentId) docIds.push(docRes.documentId);
      }

      return await apiRequest(`/me/exceptions/${selectedException.attendance.attendanceId}/reason`, {
        method: 'POST',
        body: JSON.stringify({
          reasonCategory,
          employeeExplanation: explanation,
          supportingDocumentIds: docIds,
        }),
      });
    },
    onSuccess: () => {
      setSelectedException(null);
      setExplanation('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['myExceptions'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit late explanation');
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Late Arrival Exceptions</h1>
        <p className="text-xs text-slate-500 mt-1">Review flagged attendance exceptions, submit explanations, and track HR reviews</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Fetching attendance exceptions..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Late Minutes</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Explanation</th>
                  <th className="px-6 py-3.5">HR Adjudication</th>
                  <th className="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.map((item) => (
                  <tr key={item.attendance.attendanceId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">{item.attendance.attendanceDate}</td>
                    <td className="px-6 py-4 font-mono text-amber-700 font-bold">{item.attendance.lateMinutes} mins</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.attendance.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">{item.lateReason?.reasonCategory || '—'}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      {item.lateReason?.employeeExplanation || 'Pending submission'}
                    </td>
                    <td className="px-6 py-4">
                      {item.lateReason ? (
                        <StatusBadge status={item.lateReason.status} size="sm" />
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Explanation Required</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!item.lateReason || item.lateReason.status === 'NEEDS_MORE_INFO' ? (
                        <button
                          onClick={() => {
                            setFormError(null);
                            setSelectedException(item);
                            if (item.lateReason) {
                              setExplanation(item.lateReason.employeeExplanation);
                              setReasonCategory(item.lateReason.reasonCategory);
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg"
                        >
                          <span>{item.lateReason ? 'Update Reason' : 'Submit Reason'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">Under HR Review</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal">
                      No late arrival exceptions recorded. Excellent punctuality!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exception Submission Modal */}
      <Modal
        isOpen={!!selectedException}
        onClose={() => setSelectedException(null)}
        title="Submit Late Arrival Explanation"
        subtitle="Policy rules evaluate supporting proof and category consistency"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Reason Category</label>
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
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Detailed Explanation (Min. 10 chars)</label>
            <textarea
              required
              rows={3}
              placeholder="State why you were delayed..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Attach Supporting Proof (PDF, JPEG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
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
              disabled={submitMutation.isPending || explanation.trim().length < 10}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Explanation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
