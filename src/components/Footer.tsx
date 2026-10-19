import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
          <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 fill-white/20" />
          </div>
          <span>Clipboard Shield</span>
          <span className="text-slate-400 font-normal">· Native Financial Defense</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="#simulator-section"
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Live Simulator
          </a>
          <a
            href="#architecture-section"
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Architecture
          </a>
          <a
            href="#download-section"
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Downloads (.APK)
          </a>
          <a
            href="#audit-section"
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Audit Ledger
          </a>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          © 2026 Clipboard Shield. Apache 2.0 License.
        </div>
      </div>
    </footer>
  );
};
