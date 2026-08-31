import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CalendarCheck2,
  AlertTriangle,
  CalendarDays,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiRequest } from '../../services/api.js';
import { HRDashboardData, HRInsightsResponse } from '../../types/index.js';
import { KpiCard } from '../../components/common/KpiCard.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Link } from 'react-router-dom';

export const HRDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery<HRDashboardData>({
    queryKey: ['hrDashboard'],
    queryFn: () => apiRequest<HRDashboardData>('/hr/dashboard'),
    refetchInterval: 30000,
  });

  const { data: aiInsights, isLoading: isAiLoading } = useQuery<HRInsightsResponse>({
    queryKey: ['hrAiInsights'],
    queryFn: () => apiRequest<HRInsightsResponse>('/ai/hr-insights', { method: 'POST' }),
  });

  if (isLoading) return <LoadingSpinner message="Aggregating workforce operations intelligence..." />;
  if (!data) return <div className="p-8 text-center text-xs text-rose-600">Failed to load HR dashboard data.</div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            People Operations & Attendance Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workforce presence, exception adjudication queues, and analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/hr/employees"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            <Users className="h-4 w-4 text-amber-400" />
            <span>Manage Employees</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Headcount"
          value={data.kpi.totalEmployees}
          subtitle="Active Employees"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Present Today"
          value={data.kpi.presentToday}
          subtitle="On-Time Attendance"
          icon={<CalendarCheck2 className="h-5 w-5 text-emerald-600" />}
          trend={{ value: `${data.kpi.averageAttendanceRate}%`, isPositive: true, label: 'attendance rate' }}
        />
        <KpiCard
          title="Late Arrivals Today"
          value={data.kpi.lateToday}
          subtitle="Flagged Exceptions"
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          trend={{ value: `${data.kpi.pendingExceptions} pending review`, label: '' }}
        />
        <KpiCard
          title="Pending Approvals"
          value={data.kpi.pendingLeaves + data.kpi.pendingExceptions}
          subtitle={`${data.kpi.pendingLeaves} Leave • ${data.kpi.pendingExceptions} Exceptions`}
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          highlight={true}
        />
      </div>

      {/* AI Activity Insight Panel */}
      <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/5 p-6 shadow-card">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-amber-400 font-bold shadow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              LangGraph Workforce Operations Intelligence
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Autonomous Exception & Punctuality Synthesis
            </span>
          </div>
        </div>

        {isAiLoading ? (
          <div className="p-4 text-xs text-slate-500 animate-pulse">
            Analyzing workforce attendance patterns and calculating risk factors...
          </div>
        ) : aiInsights ? (
          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <p className="font-semibold text-slate-900">{aiInsights.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-subtle space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Key Operational Observations
                </span>
                <ul className="space-y-1 text-slate-600">
                  {aiInsights.keyObservations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-subtle space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Recommended Priority Actions
                </span>
                <ul className="space-y-1 text-slate-600">
                  {aiInsights.actionRecommendations.map((act, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Attendance Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">7-Day Attendance Distribution</h3>
              <p className="text-xs text-slate-500">Present vs Late vs Absent counts over the last week</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1">{d.date}</p>
                          <p className="text-emerald-400">Present: {d.present}</p>
                          <p className="text-amber-400">Late: {d.late}</p>
                          <p className="text-rose-400">Absent: {d.absent}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#0f172a" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="late" fill="#d97706" radius={[4, 4, 0, 0]} name="Late Arrivals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Headcount Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 font-display mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {data.departmentStats.map((d) => (
              <div key={d.department} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-800">{d.department}</span>
                </div>
                <span className="text-xs font-extrabold text-slate-900 font-display bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  {d.count} employees
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
