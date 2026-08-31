import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, BadgeCheck, ArrowRight, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../services/api.js';

export const RegisterPage: React.FC = () => {
  const [workEmail, setWorkEmail] = useState('samir.deshmukh@company.local');
  const [employeeId, setEmployeeId] = useState('EMP-1021');
  const [result, setResult] = useState<{
    message: string;
    reference: string;
    devActivationDetails?: {
      challengeId: string;
      activationToken: string;
      activationUrl: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const data = await apiRequest('/registration/request', {
        method: 'POST',
        body: JSON.stringify({
          workEmail: workEmail.trim().toLowerCase(),
          employeeId: employeeId.trim().toUpperCase(),
        }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to submit registration request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-bold shadow-md">
            <Shield className="h-6 w-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 font-display">
          Employee One-Time Activation
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Validate authoritative identity master to issue a secure activation challenge
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl sm:px-10 border border-slate-200/80">
          {/* Security Notice */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <span>HR-First Authoritative Provisioning Model</span>
            </div>
            <p>
              Your profile must be created by the HR Department prior to submitting this form. If your records match, a single-use 15-minute activation token will be generated.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  <span>Request Processed (Ref: {result.reference})</span>
                </div>
                <p className="leading-relaxed">{result.message}</p>
              </div>

              {/* Dev mode activation banner */}
              {result.devActivationDetails && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-amber-800 text-[10px]">
                      🔧 Development Activation Link
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-mono px-2 py-0.5 rounded">15m TTL</span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    In development mode, token challenges are displayed directly for evaluation:
                  </p>
                  <Link
                    to={`/activate?challengeId=${result.devActivationDetails.challengeId}&token=${result.devActivationDetails.activationToken}`}
                    className="mt-2 inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                  >
                    <span>Proceed to Set Password</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setResult(null)}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Submit another verification request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Corporate Email
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    required
                    placeholder="name@company.local"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono"
                  />
                  <Mail className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Employee ID
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    required
                    placeholder="EMP-1001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm font-mono uppercase"
                  />
                  <BadgeCheck className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Verifying Identity via LangGraph...' : 'Submit Activation Request'}</span>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            <span>Already completed activation? </span>
            <Link to="/login" className="font-bold text-amber-700 hover:underline">
              Sign In to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
