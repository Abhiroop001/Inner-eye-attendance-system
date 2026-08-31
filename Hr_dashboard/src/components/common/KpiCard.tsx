import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:shadow-card-hover ${
        highlight
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white border-slate-700 shadow-md'
          : 'bg-white text-slate-900 border-slate-200/80 shadow-subtle'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>
          {title}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            highlight ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight font-display">{value}</span>
        {subtitle && (
          <span className={`text-xs ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</span>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive
                ? 'text-emerald-600'
                : trend.isPositive === false
                ? 'text-rose-600'
                : highlight
                ? 'text-slate-300'
                : 'text-slate-600'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && (
            <span className={highlight ? 'text-slate-400' : 'text-slate-500'}>{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};
