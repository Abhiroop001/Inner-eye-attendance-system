import React from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Lock, UserCheck, AlertTriangle } from 'lucide-react';

export const HRSecurityPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Security Operations & Incident Center</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time threat monitoring, brute force defenses, and authentication telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Health KPI */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lockout Defense</span>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">0</span>
              <span className="text-xs text-slate-500">Active Account Lockouts</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
            Rate limiting applies after 5 consecutive failed attempts with a 15-minute cool-down.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TOTP MFA Status</span>
              <KeyRound className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">100%</span>
              <span className="text-xs text-slate-500">HR Enforcement</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
            Mandatory multi-factor authentication for all administrative actions.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Anti-Enumeration</span>
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">ACTIVE</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
            Public registration endpoints emit identical neutral messages regardless of identifier presence.
          </p>
        </div>
      </div>

      {/* Security Architecture Specifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-display">OWASP ASVS Compliance Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">V2: Authentication & Password Security</span>
            <p className="text-slate-600 leading-relaxed">
              Passwords hashed using Argon2id (m=64MB, t=3, p=4). Access tokens short-lived (15m) with refresh token family rotation and reuse revocation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">V4: Access Control & Authorization (RBAC)</span>
            <p className="text-slate-600 leading-relaxed">
              Strict server-side role validation on all endpoints. Employee requests are verified to own their resource IDs (`req.user.employeeId === targetId`), preventing IDOR.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">V12: File Upload & Binary Defense</span>
            <p className="text-slate-600 leading-relaxed">
              MIME validation, magic byte signature check (%PDF, PNG, JPEG), safe UUID filenames, SHA-256 integrity digest, and private MongoDB GridFS vault storage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">AI Guardrail Architecture</span>
            <p className="text-slate-600 leading-relaxed">
              Vector retrieval enforces `accessScope` filtering. Deterministic rules strictly override model outputs. LLMs are barred from direct database mutations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
