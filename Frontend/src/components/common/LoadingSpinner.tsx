import React from 'react';
import { Shield } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Loading verified enterprise data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shadow-md animate-pulse">
        <Shield className="h-7 w-7 animate-spin" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{message}</p>
    </div>
  );
};
