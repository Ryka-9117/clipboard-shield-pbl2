import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Hash,
  Database
} from 'lucide-react';
import { AuditRecord } from '../types';
import { oceanAudio } from '../utils/audio';

interface AuditLogViewerProps {
  records: AuditRecord[];
  onClear: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ records, onClear }) => {
  const [filterAction, setFilterAction] = useState<'ALL' | 'APPROVED' | 'CANCELLED'>('ALL');

  const filtered = records.filter((r) => {
    if (filterAction === 'ALL') return true;
    return r.action === filterAction;
  });

  const exportAuditJson = () => {
    oceanAudio.playBubble();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `clipboard-shield-audit-ledger-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="audit-section" className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">
            <span>Spring Boot REST Backend</span>
            <span aria-hidden="true">·</span>
            <span>Immutable Hash Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Encrypted Audit Log Database
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time verification log dispatched from on-device <code className="font-mono text-teal-600 dark:text-teal-400">FloatingOverlayActivity</code> to the backend.
          </p>
        </div>

        {/* Filter Controls & Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl border border-slate-300/50 dark:border-slate-700/50">
            {(['ALL', 'APPROVED', 'CANCELLED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  oceanAudio.playBubble();
                  setFilterAction(mode);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  filterAction === mode
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode === 'ALL' ? 'All Events' : mode}
              </button>
            ))}
          </div>

          <button
            onClick={exportAuditJson}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500/50 disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden backdrop-blur-sm shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Intercepted Message</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>No audit entries recorded yet. Test notifications in the simulator above!</span>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors font-sans"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {record.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {record.action === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                          <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs sm:max-w-md truncate font-medium text-slate-800 dark:text-slate-200">
                      {record.alertMsg}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 opacity-60" />
                        <span>{record.payloadHash.substring(0, 16)}...</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {record.platform}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
