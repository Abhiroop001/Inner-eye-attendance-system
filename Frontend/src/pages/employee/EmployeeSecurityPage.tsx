import React, { useState } from 'react';
import { Shield, KeyRound, Lock, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../services/api.js';

export const EmployeeSecurityPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    setStatusMsg(null);
    setIsSubmitting(true);

    try {
      const res = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setStatusMsg({ type: 'success', text: res.message || 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Security Center</h1>
        <p className="text-xs text-slate-500 mt-1">Manage cryptographic credentials, sessions, and security posture</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Update Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Rotate Permanent Password</h3>
          </div>

          {statusMsg && (
            <div
              className={`mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password (Min. 8 chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* Security Controls Status */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-slate-900 font-display mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Active Security Protections</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Argon2id Memory-Hard Cryptographic Hashing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Short-Lived 15m Access Token + Refresh Family Rotation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Redis-Backed Anti-Brute-Force Rate Limiting</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Single Active Daily Session Invariant Lock</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-900 text-white p-6 shadow-card">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Compliance & Audit Policy</span>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Every authentication attempt, late reason submission, and document ingestion is signed with request correlation IDs and logged to an immutable audit record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
