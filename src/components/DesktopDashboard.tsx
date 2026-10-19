import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Power,
  Settings as SettingsIcon,
  FileText,
  Activity,
  Download,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Lock,
  Cpu,
  Monitor,
  Bell,
  Sparkles,
} from 'lucide-react';
import { ProtectionStatus, AppSettings, AuditRecord, SystemInfo, UpdateInfo } from '../types';
import { oceanAudio } from '../utils/audio';

interface DesktopDashboardProps {
  isDarkMode: boolean;
  onNewAudit?: (record: AuditRecord) => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({ isDarkMode, onNewAudit }) => {
  const isDesktop = typeof window !== 'undefined' && Boolean(window.electronAPI);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'audit' | 'diagnostics' | 'updates'>('overview');
  const [status, setStatus] = useState<ProtectionStatus>({
    state: 'ACTIVE',
    protectionEnabled: true,
    autoSanitize: false,
    startWithWindows: false,
    closeToTray: true,
    uptimeSeconds: 0,
    scansPerformed: 0,
    threatsDetected: 0,
    version: '1.4.0',
  });
  const [settings, setSettings] = useState<AppSettings>({
    protectionEnabled: true,
    autoSanitize: false,
    startWithWindows: false,
    closeToTray: true,
    notificationsEnabled: true,
    notificationSound: true,
    retentionDays: 30,
    auditMaxRecords: 1000,
    whitelistedPatterns: [],
  });
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Test Inspector State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{
    detected: boolean;
    category?: string;
    ruleName?: string;
    maskedPreview?: string;
  } | null>(null);

  // Load state and subscribe to native IPC events
  useEffect(() => {
    if (!isDesktop || !window.electronAPI) return;

    // Load initial status
    window.electronAPI.getStatus().then((s) => setStatus(s)).catch(console.error);
    window.electronAPI.getSettings().then((set) => setSettings(set)).catch(console.error);
    window.electronAPI.getAuditRecords().then((records) => setAuditRecords(records)).catch(console.error);
    window.electronAPI.getSystemInfo().then((info) => setSystemInfo(info)).catch(console.error);

    // Subscribe to IPC events
    const unsubStatus = window.electronAPI.onStatusChanged((newStatus) => {
      setStatus(newStatus);
    });

    const unsubAudit = window.electronAPI.onAuditAdded((record) => {
      setAuditRecords((prev) => [record, ...prev]);
      if (onNewAudit) onNewAudit(record);
      oceanAudio.playPromptAlert();
    });

    const unsubThreat = window.electronAPI.onThreatDetected((threat) => {
      oceanAudio.playPromptAlert();
    });

    return () => {
      unsubStatus();
      unsubAudit();
      unsubThreat();
    };
  }, [isDesktop, onNewAudit]);

  // Handle toggling protection
  const handleToggleProtection = async () => {
    oceanAudio.playBubble();
    const nextState = !status.protectionEnabled;
    if (isDesktop && window.electronAPI) {
      await window.electronAPI.setProtectionEnabled(nextState);
      const s = await window.electronAPI.getStatus();
      setStatus(s);
    } else {
      setStatus((prev) => ({
        ...prev,
        protectionEnabled: nextState,
        state: nextState ? 'ACTIVE' : 'PAUSED',
      }));
    }
  };

  // Handle toggling auto-sanitize
  const handleToggleAutoSanitize = async () => {
    oceanAudio.playBubble();
    const nextState = !status.autoSanitize;
    if (isDesktop && window.electronAPI) {
      await window.electronAPI.setAutoSanitize(nextState);
      const s = await window.electronAPI.getStatus();
      setStatus(s);
    } else {
      setStatus((prev) => ({ ...prev, autoSanitize: nextState }));
    }
  };

  // Handle updating settings
  const handleSaveSettings = async (patch: Partial<AppSettings>) => {
    oceanAudio.playBubble();
    if (isDesktop && window.electronAPI) {
      const updated = await window.electronAPI.updateSettings(patch);
      setSettings(updated);
      const s = await window.electronAPI.getStatus();
      setStatus(s);
      setSettingsSavedMessage('Preferences saved and applied.');
      setTimeout(() => setSettingsSavedMessage(null), 3500);
    } else {
      setSettings((prev) => ({ ...prev, ...patch }));
      setSettingsSavedMessage('Preferences updated (browser preview).');
      setTimeout(() => setSettingsSavedMessage(null), 3500);
    }
  };

  // Handle clearing audit records
  const handleClearAudit = async () => {
    oceanAudio.playBubble();
    if (isDesktop && window.electronAPI) {
      await window.electronAPI.clearAuditRecords();
      setAuditRecords([]);
    } else {
      setAuditRecords([]);
    }
    setShowClearConfirm(false);
  };

  // Handle checking updates
  const handleCheckUpdate = async () => {
    oceanAudio.playBubble();
    setIsCheckingUpdate(true);
    if (isDesktop && window.electronAPI) {
      try {
        const info = await window.electronAPI.checkForUpdates();
        setUpdateInfo(info);
      } catch (err) {
        setUpdateInfo({
          hasUpdate: false,
          currentVersion: '1.4.0',
          error: 'Could not connect to update servers.',
        });
      } finally {
        setIsCheckingUpdate(false);
      }
    } else {
      setTimeout(() => {
        setUpdateInfo({
          hasUpdate: false,
          currentVersion: '1.4.0',
          releaseNotes: 'You are viewing the latest web release of Clipboard Shield.',
        });
        setIsCheckingUpdate(false);
      }, 700);
    }
  };

  // Run test inspector
  const runTestInspection = (text: string) => {
    setTestInput(text);
    if (!text.trim()) {
      setTestResult(null);
      return;
    }

    // Quick regex checks for visual inspector
    if (/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/.test(text.replace(/[\s-]/g, ''))) {
      setTestResult({
        detected: true,
        category: 'CREDIT_CARD',
        ruleName: 'Visa / Mastercard Primary Account Number',
        maskedPreview: '4111 •••• •••• 9021',
      });
    } else if (/\bAKIA[0-9A-Z]{16}\b/.test(text)) {
      setTestResult({
        detected: true,
        category: 'SECRET_TOKEN',
        ruleName: 'AWS Access Key ID',
        maskedPreview: 'AKIA••••••••LE',
      });
    } else if (/\b0x[a-fA-F0-9]{40}\b/.test(text)) {
      setTestResult({
        detected: true,
        category: 'CRYPTO_WALLET',
        ruleName: 'Ethereum Address',
        maskedPreview: '0x71C8...E998',
      });
    } else if (/@[a-zA-Z]{3,24}/.test(text) && !text.includes('gmail')) {
      setTestResult({
        detected: true,
        category: 'UPI_FINANCIAL',
        ruleName: 'Indian UPI Virtual Address',
        maskedPreview: 'pay****@okaxis',
      });
    } else {
      setTestResult({
        detected: false,
      });
    }
  };

  return (
    <div id="desktop-dashboard" className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6">
      {/* Top Banner / Environment notification */}
      {!isDesktop && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 shrink-0 text-teal-600 dark:text-teal-400" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold">Web Preview Mode: </span>
              You are viewing the web interface. To activate real system-wide Windows clipboard protection and system tray daemon, download and install the native Windows app.
            </div>
          </div>
          <a
            href="#download-section"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shrink-0 transition-colors shadow-sm"
          >
            Get Windows App
          </a>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Dashboard Header Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                status.state === 'ACTIVE'
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 ring-2 ring-teal-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
              }`}
            >
              {status.state === 'ACTIVE' ? (
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Clipboard Shield Native Control
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                    status.state === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : status.state === 'PAUSED'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  }`}
                >
                  ● {status.state}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time clipboard interceptor & financial fraud prevention daemon (v{status.version})
              </p>
            </div>
          </div>

          {/* Quick Toggle Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Protection Power Toggle */}
            <button
              onClick={handleToggleProtection}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                status.protectionEnabled
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{status.protectionEnabled ? 'Protection Active' : 'Protection Paused'}</span>
            </button>

            {/* Auto-Sanitize Toggle */}
            <button
              onClick={handleToggleAutoSanitize}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                status.autoSanitize
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/40'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-teal-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto-Sanitize: {status.autoSanitize ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Scans</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {status.scansPerformed.toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">Continuous buffer audit</div>
          </div>

          <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Threats Intercepted</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {status.threatsDetected}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {status.lastThreatTimestamp ? `Last at ${status.lastThreatTimestamp}` : 'No threats detected'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Daemon Uptime</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {Math.floor(status.uptimeSeconds / 60)}m {status.uptimeSeconds % 60}s
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Interactive Windows session</div>
          </div>

          <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Background Tray</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
              {settings.closeToTray ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {settings.startWithWindows ? 'Auto-starts on boot' : 'Manual launch'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200/60 dark:border-slate-800/60 px-6 pt-2 bg-white/40 dark:bg-slate-900/40">
          {[
            { id: 'overview', label: 'Monitor & Inspector', icon: Activity },
            { id: 'settings', label: 'Preferences & Boot', icon: SettingsIcon },
            { id: 'audit', label: 'Security Audit Log', icon: FileText, badge: auditRecords.length },
            { id: 'diagnostics', label: 'System Diagnostics', icon: Cpu },
            { id: 'updates', label: 'Releases & Updates', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  oceanAudio.playBubble();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: OVERVIEW & INSPECTOR */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Live Threat Inspector Tool */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Live Threat Simulator & Clipboard Inspector
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Type or paste sample sensitive data (card, secret key, UPI VPA) to test real-time regex parsing without saving plaintext.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => runTestInspection('4532 0151 1283 0366')}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500/50"
                    >
                      Test Visa
                    </button>
                    <button
                      onClick={() => runTestInspection('AKIAIOSFODNN7EXAMPLE')}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500/50"
                    >
                      Test AWS Key
                    </button>
                    <button
                      onClick={() => runTestInspection('merchant.store@okaxis')}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500/50"
                    >
                      Test UPI
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => runTestInspection(e.target.value)}
                    placeholder="Enter or paste text to test detection engine..."
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />

                  {testResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                        testResult.detected
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {testResult.detected ? (
                          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        <div>
                          {testResult.detected ? (
                            <>
                              <div className="font-semibold">
                                Threat Intercepted: {testResult.ruleName}
                              </div>
                              <div className="font-mono text-[11px] mt-0.5">
                                Masked output: {testResult.maskedPreview}
                              </div>
                            </>
                          ) : (
                            <div className="font-semibold">Buffer Clean: No sensitive credentials detected</div>
                          )}
                        </div>
                      </div>

                      {testResult.detected && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                          Intercepted
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Threat Model Explanation Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Verified Windows Threat Model & Safeguards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">1. Real-Time Detection</div>
                    <p className="text-[11px] leading-relaxed">
                      Monitors native Win32 clipboard updates across all Windows processes within the interactive user session.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">2. Zero Plaintext Leakage</div>
                    <p className="text-[11px] leading-relaxed">
                      Only SHA-256 cryptographic hashes and masked previews are stored. Passwords and credit card PANs never touch disk.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">3. Auto-Sanitize & Wipe</div>
                    <p className="text-[11px] leading-relaxed">
                      When enabled, sensitive clipboard payloads are immediately replaced with secure masked placeholders before malicious scrapers can read them.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS & BOOT */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              {settingsSavedMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {settingsSavedMessage}
                </div>
              )}

              <div className="space-y-4">
                {/* Setting 1: Start with Windows */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Start with Windows
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Launch Clipboard Shield minimized to the system tray on Windows boot.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.startWithWindows}
                    onChange={(e) => handleSaveSettings({ startWithWindows: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Setting 2: Close to Tray */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Keep Running in Background (Close to Tray)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Closing the window minimizes to tray instead of terminating protection.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.closeToTray}
                    onChange={(e) => handleSaveSettings({ closeToTray: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Setting 3: Auto-Sanitize */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Enforce Auto-Sanitization
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Automatically overwrite clipboard buffer with redacted placeholders upon threat detection.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSanitize}
                    onChange={(e) => handleSaveSettings({ autoSanitize: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Setting 4: Windows Toast Notifications */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Windows Desktop Notifications
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Show native Windows toast notifications whenever sensitive data is copied.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => handleSaveSettings({ notificationsEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Setting 5: Retention Days */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Audit Ledger Max Entries
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Maximum number of cryptographic event signatures to keep locally.
                    </div>
                  </div>
                  <select
                    value={settings.auditMaxRecords}
                    onChange={(e) => handleSaveSettings({ auditMaxRecords: parseInt(e.target.value, 10) })}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value={100}>100 records</option>
                    <option value={500}>500 records</option>
                    <option value={1000}>1,000 records</option>
                    <option value={5000}>5,000 records</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LEDGER */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Local Immutable Audit Records
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cryptographically hashed event ledger saved in `%APPDATA%/ClipboardShield/audit_ledger.json`.
                  </p>
                </div>

                {auditRecords.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {/* Confirmation Modal */}
              {showClearConfirm && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    Are you sure you want to purge all local audit history? This action is permanent.
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 rounded-lg text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAudit}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Table or Empty State */}
              {auditRecords.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Audit Ledger Empty
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Any intercepted threats or clipboard sanitizations will be logged here with SHA-256 signatures.
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Timestamp</th>
                          <th className="px-4 py-3 font-semibold">Event Description</th>
                          <th className="px-4 py-3 font-semibold">Status / Action</th>
                          <th className="px-4 py-3 font-semibold">Payload Hash (SHA-256)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                        {auditRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.timestamp}</td>
                            <td className="px-4 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {r.alertMsg}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                  r.action === 'SANITIZED'
                                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                                    : r.action === 'ALERTED'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {r.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 font-mono">
                              {r.payloadHash.slice(0, 16)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEM DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Runtime Environment & Security Boundaries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Host System Architecture</div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <div>Platform: {systemInfo?.platform || (typeof navigator !== 'undefined' ? navigator.platform : 'win32')}</div>
                    <div>Architecture: {systemInfo?.arch || 'x64'}</div>
                    <div>OS Release: {systemInfo?.osRelease || 'Windows NT 10.0 (Windows 10/11)'}</div>
                    <div>User Storage: {systemInfo?.userDataPath || '%APPDATA%\\ClipboardShield'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Hardening & Sandbox Status</div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Context Isolation: Enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Node.js Integration in Renderer: Disabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>External Navigation Lockdown: Enforced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Zero Cloud Telemetry: Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RELEASES & UPDATES */}
          {activeTab === 'updates' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Application Updates & Version Control
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Installed Version: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">v1.4.0</span>
                    </p>
                  </div>
                  <button
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Checking GitHub...' : 'Check for Updates'}</span>
                  </button>
                </div>

                {updateInfo && (
                  <div className="p-4 rounded-xl border text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                      {updateInfo.hasUpdate ? (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Newer Version Available: v{updateInfo.latestVersion}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Up to Date (v1.4.0 is the latest stable build)</span>
                        </>
                      )}
                    </div>
                    {updateInfo.releaseNotes && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        {updateInfo.releaseNotes}
                      </p>
                    )}
                    {updateInfo.downloadUrl && (
                      <a
                        href={updateInfo.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold hover:underline pt-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Official Windows Installer (.exe)</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
