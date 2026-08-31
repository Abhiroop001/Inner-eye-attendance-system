import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Sparkles,
  CalendarCheck2,
  Users,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
  Fingerprint,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Corporate Banner */}
      <div className="bg-slate-950 text-slate-300 py-2.5 px-4 text-xs font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Enterprise Attendance Management System • ISO/IEC 27001 & OWASP ASVS Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>LangGraph Agentic RAG</span>
            <span>MongoDB Vector Search</span>
            <span>Redis Distributed Locks</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-bold shadow-md">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 font-display">
                IECSL <span className="text-amber-600 font-normal">ENTERPRISE</span>
              </span>
              <span className="block text-[11px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">
                Attendance & Workforce Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="text-xs font-bold text-slate-700 hover:text-slate-950 px-4 py-2.5 rounded-xl transition"
            >
              Employee Activation
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 hover:shadow-lg transition-all"
            >
              <span>Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
              <span>MERN + MongoDB Vector Search + LangGraph + Groq + Redis</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 font-display leading-[1.1]">
              Authoritative, Security-First <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 bg-clip-text text-transparent">
                Workforce Attendance
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              An enterprise HR operating platform where human authority meets deterministic calculation engines and advisory LangGraph agents. No public account creation without an HR-verified master record.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-slate-800 hover:shadow-2xl transition-all"
              >
                <span>Launch Enterprise Portal</span>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-8 py-3.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
              >
                <span>Submit Activation Request</span>
              </Link>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200/90 p-6 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Pre-Configured Evaluation Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span>HR Administrator Role</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Full Admin Scope</span>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-600 space-y-0.5">
                  <p><span className="text-slate-400">Email:</span> hr.admin@company.local</p>
                  <p><span className="text-slate-400">Password:</span> AdminSecurePass123!</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span>Employee Role</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Personal Scope</span>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-600 space-y-0.5">
                  <p><span className="text-slate-400">Email:</span> aarav.sharma@company.local</p>
                  <p><span className="text-slate-400">Password:</span> EmployeePass123!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Enterprise Security Guarantees</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">
              Engineered for Compliance & Rigor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200/80 p-8 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-6 shadow-sm">
                <Fingerprint className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">HR-First Identity Chain</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Direct account creation is forbidden. HR creates the authoritative master record. Registration is a one-time activation process with hashed 15-minute challenges and neutral enumeration defense.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-8 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-6 shadow-sm">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Deterministic Calculations</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Working minutes, 15-minute grace periods, early departure, overtime, and leave deductions are calculated by deterministic Luxon engines. AI never touches raw payroll or attendance calculations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-8 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-6 shadow-sm">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Vector Scoped Retrieval</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                MongoDB Vector Search retrieves policy context pre-filtered strictly by authorization scope. The AI explains company policy with citations while adhering to non-negotiable prompt injection defenses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Shield className="h-4 w-4" />
            </div>
            <span>IECSL Enterprise Attendance Management Platform • Production Assessment Build</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">One-Time Activation</Link>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">&copy; 2026 Enterprise Security Engineering</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
