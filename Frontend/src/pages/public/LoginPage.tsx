import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, KeyRound, AlertCircle, ArrowRight, CheckCircle2, Smartphone, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('aarav.sharma@company.local');
  const [password, setPassword] = useState('EmployeePass123!');
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
      } else if (res.user) {
        if (res.user.role === 'HR') {
          // Alert user that HR accounts belong to Port 5174
          window.location.href = 'http://localhost:5174/dashboard';
        } else {
          navigate('/employee/dashboard');
        }
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid employee username or password.');
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
      const verifiedUser = await verifyMfa({ tempToken, code: mfaCode, isRecovery });
      if (verifiedUser.role === 'HR') {
        window.location.href = 'http://localhost:5174/dashboard';
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid MFA authentication code.');
    } finally {
      setIsLoading(false);
    }
  };

  const setEmployeeDemo = (email: string) => {
    setError(null);
    setUsernameOrEmail(email);
    setPassword('EmployeePass123!');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-bold shadow-md">
            <Shield className="h-6 w-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Employee Self-Service Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Attendance Terminal • Mobile & Desktop Enabled
        </p>
      </div>

      <div className="mt-6 w-full max-w-md mx-auto">
        <div className="bg-white py-6 sm:py-8 px-5 sm:px-8 shadow-card rounded-2xl border border-slate-200/80">
          {/* Quick Demo Selector */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center sm:text-left">
              Quick Sign In Profiles:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEmployeeDemo('aarav.sharma@company.local')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-left ${
                  usernameOrEmail === 'aarav.sharma@company.local'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block truncate">Aarav Sharma</span>
                <span className="block text-[10px] font-normal opacity-80">Engineering Lead</span>
              </button>

              <button
                type="button"
                onClick={() => setEmployeeDemo('priya.patel@company.local')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-left ${
                  usernameOrEmail === 'priya.patel@company.local'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block truncate">Priya Patel</span>
                <span className="block text-[10px] font-normal opacity-80">Product Manager</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!mfaRequired ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Corporate Work Email
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. name@company.local"
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-xs font-mono"
                  />
                  <User className="h-4 w-4 text-slate-400 absolute right-3.5 top-3 sm:top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-xs font-mono"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute right-3.5 top-3 sm:top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <Link to="/forgot-password" className="font-semibold text-amber-700 hover:text-amber-800">
                  Forgot Password?
                </Link>
                <Link to="/register" className="font-semibold text-slate-600 hover:text-slate-900">
                  First-Time Activation
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Employee Portal'}</span>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-amber-700" />
                  <span>Two-Factor Authentication Required</span>
                </p>
                <p className="mt-1 text-[11px] text-amber-800">
                  {isRecovery
                    ? 'Enter one of your 10-character emergency backup recovery codes.'
                    : 'Enter the 6-digit verification code from your Authenticator app.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isRecovery ? 'Recovery Code' : '6-Digit TOTP Code'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRecovery ? 'XXXXX-XXXXX' : '000000'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setIsRecovery(!isRecovery)}
                  className="text-amber-700 hover:text-amber-900 font-semibold"
                >
                  {isRecovery ? 'Use Authenticator App' : 'Lost Device? Use Recovery Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-3 text-xs font-bold text-white shadow-md disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Verifying Code...' : 'Complete Sign In'}</span>
              </button>
            </form>
          )}

          {/* HR Switch Prompt */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            <span className="block sm:inline">Human Resources Administrator? </span>
            <a
              href="http://localhost:5174/login"
              className="font-bold text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center gap-1"
            >
              <span>Access HR Console (Port 5174)</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
