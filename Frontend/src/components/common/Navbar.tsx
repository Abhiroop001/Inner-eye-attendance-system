import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Sparkles, LogOut, User, Bell, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { AiAssistantDrawer } from './AiAssistantDrawer.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, employeeProfile, logout } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = employeeProfile?.preferredName || employeeProfile?.legalName || user?.username || 'User';
  const roleLabel = user?.role === 'HR' ? 'HR Administrator' : 'Enterprise Employee';

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400 font-bold shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-black tracking-tight text-slate-900 font-display">
                IECSL <span className="text-amber-600 font-normal">ATTENDANCE</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-1">Security-First Platform</span>
            </div>
          </Link>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-3">
          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300/50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 transition-all hover:bg-amber-500/20 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">AI Policy Assistant</span>
          </button>

          {/* User Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-1.5 pr-3 text-left hover:bg-slate-100 transition focus:outline-none"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold font-display">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <span className="block text-xs font-bold text-slate-800 leading-tight">{displayName}</span>
                  <span className="block text-[10px] font-medium text-slate-500 leading-tight">{roleLabel}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to={user.role === 'HR' ? '/hr/dashboard' : '/employee/profile'}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
};
