import React from 'react';
import { ShieldCheck, Lock, KeyRound, Database, FileCheck, ShieldAlert, Cpu, RotateCcw } from 'lucide-react';
import { apiRequest } from '../services/api.js';

export const HRSecurityPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Security Operations & Defense Telemetry
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographic enforcement status, MFA policies, and OWASP ASVS verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Password & Key Security</h3>
              <p className="text-[11px] text-slate-500">Argon2id Memory Hardened</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Hashing Algorithm</span>
              <span className="font-mono font-bold text-slate-900">Argon2id (m=65536, t=3, p=4)</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>MFA Standard</span>
              <span className="font-mono font-bold text-emerald-600">RFC 6238 TOTP (SHA-1)</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Recovery Codes</span>
              <span className="font-mono font-bold text-slate-900">10 Single-Use SHA-256 Hashes</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Data & Storage Security</h3>
              <p className="text-[11px] text-slate-500">Encrypted at Rest & Transit</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Session Storage</span>
              <span className="font-mono font-bold text-slate-900">Redis TLS (Upstash)</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Document Engine</span>
              <span className="font-mono font-bold text-slate-900">MongoDB GridFS Chunked</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Malware Defense</span>
              <span className="font-mono font-bold text-emerald-600">Magic Number Header Inspection</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  apiRequest('/hr/cache/clear', { method: 'POST' })
                    .then((res) => alert(`✅ Redis Cache Cleared! (${res.flushedKeysCount} keys purged)`))
                    .catch((err) => alert(`Error: ${err.message}`));
                }}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs hover:bg-slate-800 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Flush Redis & Memory Cache</span>
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">AI Agent & RAG Governance</h3>
              <p className="text-[11px] text-slate-500">Vector Search Scoped Guardrails</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Agent Framework</span>
              <span className="font-mono font-bold text-slate-900">LangGraph State Machine</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Inference Engine</span>
              <span className="font-mono font-bold text-amber-600">Groq OpenAI GPT-OSS-120B</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span>Injection Guard</span>
              <span className="font-mono font-bold text-emerald-600">Strict JSON Zod Validation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
