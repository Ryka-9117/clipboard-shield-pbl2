import React from 'react';
import { ShieldCheck, ArrowRight, Download, Terminal, Smartphone } from 'lucide-react';
import { oceanAudio } from '../utils/audio';

export const Hero: React.FC = () => {
  const scrollTo = (id: string) => {
    oceanAudio.playBubble();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center z-10">
      {/* Editorial Kicker */}
      <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-700 dark:text-teal-300 bg-teal-500/10 dark:bg-teal-500/15 px-3 py-1.5 rounded-full border border-teal-500/20 backdrop-blur-sm mb-6">
        <span>Native Security Client v1.4.0</span>
        <span aria-hidden="true">·</span>
        <span>NotificationListenerService</span>
        <span aria-hidden="true">·</span>
        <span>Multi-OS</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.12] text-balance">
        Autonomous Financial Interception & Clipboard Defense
      </h1>

      {/* Subtitle */}
      <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
        Silently monitors banking SMS, OTPs, and UPI transfers in the background. Prompts an instant top-level floating overlay authorization before funds or credentials leave your device.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => scrollTo('simulator-section')}
          className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 group"
        >
          <span>Launch Live Simulator</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => scrollTo('download-section')}
          className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 backdrop-blur-sm transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Download Native App (.APK / .EXE)</span>
        </button>
      </div>

      {/* 4 Quantitative Architecture Specs */}
      <div className="mt-14 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            &lt; 0.04ms
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Local Regex Interception Speed
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            100%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-Knowledge On-Device Memory
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            SHA-256
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            HMAC Encrypted Audit Log Pipe
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            5 OS
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cross-Platform Native Packages
          </div>
        </div>
      </div>
    </div>
  );
};
