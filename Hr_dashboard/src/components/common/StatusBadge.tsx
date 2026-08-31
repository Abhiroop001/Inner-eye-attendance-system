import React from 'react';
import { AttendanceStatus } from '../../types/index.js';

interface StatusBadgeProps {
  status: AttendanceStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'PRESENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10';
      case 'LATE':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10';
      case 'HALF_DAY':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10';
      case 'ON_LEAVE':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/10';
      case 'ABSENT':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10';
      case 'HOLIDAY':
      case 'WEEK_OFF':
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10';
      case 'SUBMITTED':
      case 'PENDING':
      case 'UNDER_REVIEW':
      case 'PENDING_EXCEPTION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'NEEDS_MORE_INFO':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'ACCEPTED':
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = (s: string) => {
    switch (s) {
      case 'PRESENT':
      case 'ACCEPTED':
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-emerald-500';
      case 'LATE':
      case 'SUBMITTED':
      case 'PENDING':
      case 'UNDER_REVIEW':
        return 'bg-amber-500';
      case 'NEEDS_MORE_INFO':
        return 'bg-sky-500';
      case 'HALF_DAY':
        return 'bg-blue-500';
      case 'ON_LEAVE':
        return 'bg-purple-500';
      case 'ABSENT':
      case 'REJECTED':
      case 'SUSPENDED':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-xs ${getStyle(status)} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(status)}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
