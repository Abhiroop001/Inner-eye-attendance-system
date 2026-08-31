import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('hr.admin@company.local');
  const [password, setPassword] = useState('AdminSecurePass123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login({ usernameOrEmail, password });
      if (res.mfaRequired && res.tempToken) {
        setMfaRequired(true);
        setTempToken(res.tempToken);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid HR Administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setError(null);
    setIsLoading(true);

    try {
      await verifyMfa({ tempToken, code: mfaCode, isRecovery });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid MFA authentication code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-white font-display">
          IECSL HR Console Sign In
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Executive People Operations & Security Terminal (Port 5174)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-950 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-950/60 border border-rose-800 p-3.5 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!mfaRequired ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  HR Admin Work Email
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 shadow-sm font-mono"
                  />
                  <User className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Administrator Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 shadow-sm font-mono"
                  />
                  <Lock className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-3 text-xs font-bold text-slate-950 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400/30 disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Verifying HR Credentials...' : 'Authenticate HR Console'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-800 text-xs text-amber-300">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  <span>Two-Factor Authentication Required</span>
                </p>
                <p className="mt-1 text-[11px] text-amber-400">
                  {isRecovery
                    ? 'Enter one of your 10-character emergency backup recovery codes.'
                    : 'Enter the 6-digit verification code from your Authenticator app.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isRecovery ? 'Recovery Code' : '6-Digit TOTP Code'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRecovery ? 'XXXXX-XXXXX' : '000000'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setIsRecovery(!isRecovery)}
                  className="text-amber-400 hover:underline font-medium"
                >
                  {isRecovery ? 'Use Authenticator App' : 'Lost Device? Use Recovery Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-3 text-xs font-bold text-slate-950 shadow-md disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Verifying Code...' : 'Complete MFA Verification'}</span>
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-500">
            <span>Employee Self-Service? </span>
            <a href="http://localhost:5173" className="font-bold text-amber-400 hover:underline">
              Open Employee Portal (Port 5173)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
