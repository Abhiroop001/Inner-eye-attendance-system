import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-bold shadow-md">
            <Shield className="h-6 w-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 font-display">
          Credential Recovery Policy
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Security-First Password Reset Protocol
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl sm:px-10 border border-slate-200/80 space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Managed Administrative Recovery</p>
              <p className="mt-1 text-[11px]">
                To prevent account takeover and unauthorized SIM-swap/email compromise attacks, automated self-service email resets are disabled by security policy.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">How to reset your password:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Contact your assigned HR Operations Representative or Department Lead.</li>
              <li>Complete identity re-attestation through verified corporate communication.</li>
              <li>HR will issue an authoritative one-time credential reset challenge.</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-amber-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>

            <span className="text-[11px] text-slate-400">hr.support@company.local</span>
          </div>
        </div>
      </div>
    </div>
  );
};
