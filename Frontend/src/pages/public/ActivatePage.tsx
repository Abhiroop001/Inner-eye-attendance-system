import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Shield, KeyRound, Lock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../services/api.js';

export const ActivatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const challengeId = searchParams.get('challengeId') || '';
  const token = searchParams.get('token') || '';

  const [employeeInfo, setEmployeeInfo] = useState<{
    legalName: string;
    workEmail: string;
    department: string;
    employeeId: string;
  } | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!challengeId || !token) {
      setError('Missing activation challenge parameters. Please check your activation link.');
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const data = await apiRequest<{
          valid: boolean;
          employeeId: string;
          legalName: string;
          workEmail: string;
          department: string;
        }>('/registration/verify', {
          method: 'POST',
          body: JSON.stringify({ challengeId, token }),
        });

        setEmployeeInfo(data);
        setUsername(data.workEmail.split('@')[0].replace('.', '_'));
      } catch (err: any) {
        setError(err.message || 'Invalid or expired activation challenge.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [challengeId, token]);

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await apiRequest('/registration/activate', {
        method: 'POST',
        body: JSON.stringify({
          challengeId,
          token,
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      setIsSuccess(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setError(err.message || 'Failed to complete activation.');
    } finally {
      setIsSubmitting(false);
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
          Establish Permanent Credentials
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Single-Use Challenge Consumption & Password Configuration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isVerifying ? (
            <div className="text-center py-8">
              <KeyRound className="h-8 w-8 text-amber-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Validating one-time cryptographic challenge...</p>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Activation Complete!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your permanent account credentials have been securely registered. You can now log in to the employee attendance portal.
              </p>
              <Link
                to="/login"
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </Link>
            </div>
          ) : employeeInfo ? (
            <form onSubmit={handleActivationSubmit} className="space-y-4">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Employee Name:</span>
                  <span className="font-bold text-slate-900">{employeeInfo.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Employee ID:</span>
                  <span className="font-mono text-slate-800">{employeeInfo.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="text-slate-800">{employeeInfo.department}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preferred Username
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-mono"
                  />
                  <User className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Set Permanent Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-mono"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-mono"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 transition"
              >
                <span>{isSubmitting ? 'Establishing Security Credentials...' : 'Activate Account'}</span>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-600">Please provide a valid challenge link to activate your account.</p>
              <Link to="/register" className="mt-4 inline-block text-xs font-bold text-amber-700 hover:underline">
                Request new activation link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
