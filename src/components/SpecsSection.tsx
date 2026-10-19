import React from 'react';
import { ShieldCheck, Cpu, Database, KeyRound, Check, Layers } from 'lucide-react';

export const SpecsSection: React.FC = () => {
  return (
    <div id="specs-section" className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">
          <span>Technical Whitepaper</span>
          <span aria-hidden="true">·</span>
          <span>Security Blueprint</span>
          <span aria-hidden="true">·</span>
          <span>Zero Telemetry</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
          Deep Technical Specifications
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Engineered for zero-leak execution. Learn how Clipboard Shield interacts with native operating system boundaries and encrypted services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Spec Card 1: Android System Permissions */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Native Permission Blueprint
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Operates without root privileges through official Android OS accessibility and notification framework bindings.
          </p>

          <div className="pt-2 space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>android.permission.SYSTEM_ALERT_WINDOW</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>BIND_NOTIFICATION_LISTENER_SERVICE</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>android.permission.FOREGROUND_SERVICE</span>
            </div>
          </div>
        </div>

        {/* Spec Card 2: Regex & Parser Engine */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Deterministic Regex Engine
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Evaluates raw notification payloads on-device in under 40 microseconds using pre-compiled deterministic automata.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-teal-300/90 space-y-1 overflow-x-auto">
            <div>{"/(₹|\\$|€|£)\\s?[0-9,]+(\\.[0-9]{2})?/i"}</div>
            <div>{"/(debited|credited|transferred|withdrawn)/i"}</div>
            <div>{"/\\b(OTP|code|passcode)\\b.*\\b[0-9]{4,8}\\b/i"}</div>
          </div>
        </div>

        {/* Spec Card 3: Spring Boot REST Architecture */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Spring Boot REST & Hash Ledger
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Transaction audits are signed with HMAC-SHA256 and dispatched asynchronously to prevent UI thread blocking.
          </p>

          <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>Endpoint: <code className="font-mono text-teal-600 dark:text-teal-400">POST /api/v1/auth/audit</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>Audit hash: SHA-256 with timestamp salt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>Battery consumption: &lt; 0.1% per 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
