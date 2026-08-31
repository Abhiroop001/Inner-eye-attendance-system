import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Users,
  ClipboardList,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/employee/attendance', label: 'Attendance Ledger', icon: CalendarCheck2 },
    { to: '/employee/leave', label: 'Leave Management', icon: CalendarDays },
    { to: '/employee/exceptions', label: 'Late Exceptions', icon: AlertTriangle },
    { to: '/employee/documents', label: 'Document Vault', icon: FileText },
    { to: '/employee/profile', label: 'Employee Profile', icon: User },
    { to: '/employee/security', label: 'Security Center', icon: ShieldCheck },
  ];

  const hrLinks = [
    { to: '/hr/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { to: '/hr/employees', label: 'Employee Directory', icon: Users },
    { to: '/hr/attendance', label: 'Organization Attendance', icon: CalendarCheck2 },
    { to: '/hr/leave', label: 'Leave Approvals', icon: CalendarDays },
    { to: '/hr/exceptions', label: 'Exception Reviews', icon: AlertTriangle },
    { to: '/hr/audit', label: 'Compliance Audit Log', icon: ClipboardList },
    { to: '/hr/security', label: 'Security Operations', icon: ShieldCheck },
    { to: '/hr/settings', label: 'Policy & Schedules', icon: Sliders },
  ];

  const activeLinks = isHR ? hrLinks : employeeLinks;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col justify-between py-5 px-4">
        <div>
          {/* Workspace Scope Header */}
          <div className="mb-6 px-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isHR ? 'HR Administration Console' : 'Employee Portal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Enterprise Auth Token Active</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {activeLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-400/30 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Security Badge */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">OWASP ASVS Ready</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-normal">
            Argon2id Hashed • JOSE Bearer • Vector Scoped RAG
          </p>
        </div>
      </div>
    </aside>
  );
};
