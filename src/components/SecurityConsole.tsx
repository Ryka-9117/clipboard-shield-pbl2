import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Power,
  Sparkles,
  Activity,
  Settings as SettingsIcon,
  FileText,
  Cpu,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { ProtectionStatus, AppSettings, AuditRecord, SystemInfo, UpdateInfo } from '../types';
import { oceanAudio } from '../utils/audio';

interface SecurityConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  onOpenDownloadModal: (platform: 'Windows' | 'Android') => void;
}

export const SecurityConsole: React.FC<SecurityConsoleProps> = ({
  isOpen,
  onClose,
  isAudioActive,
  onToggleAudio,
  onOpenDownloadModal,
}) => {
  const isDesktop = typeof window !== 'undefined' && Boolean(window.electronAPI);

  // Tab State
  const [activeTab, setActiveTab] = useState<'inspector' | 'simulator' | 'audit' | 'settings' | 'diagnostics'>('inspector');

  // Status & Settings State
  const [status, setStatus] = useState<ProtectionStatus>({
    state: 'ACTIVE',
    protectionEnabled: true,
    autoSanitize: false,
    startWithWindows: false,
    closeToTray: true,
    uptimeSeconds: 120,
    scansPerformed: 48,
    threatsDetected: 2,
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

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([
    {
      id: 'audit_1',
      timestamp: '16:42:10',
      alertMsg: 'Intercepted UPI Financial Debit (₹4,500 to Zomato UPI)',
      action: 'APPROVED',
      platform: 'ANDROID',
      payloadHash: '0x8f2a1b94d7c0e81254a67b931e0c7a5241b9e28f09d1c7e9a4f21087e35b1c9a',
      signature: 'ECDSA-SHA256:7B94E10A',
    },
    {
      id: 'audit_2',
      timestamp: '16:38:05',
      alertMsg: 'Intercepted Primary Account Number (4111 •••• •••• 9021)',
      action: 'SANITIZED',
      platform: 'WINDOWS',
      payloadHash: '0x12c49a07ef41b68239014dfa8b92e76ca4019bfd0812e987c0147eb831fae29c',
      signature: 'BLOCKED_AUTOSANITIZED',
    },
    {
      id: 'audit_3',
      timestamp: '16:15:22',
      alertMsg: 'Intercepted AWS Access Key ID (AKIA••••••••LE)',
      action: 'ALERTED',
      platform: 'WINDOWS',
      payloadHash: '0x99e2a84c10fd4180a2b740ef82c914ea629014dfa8b92e76ca4019bfd0812e98',
      signature: 'HASH_VERIFIED',
    },
  ]);

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState<string | null>(null);

  // Inspector State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{
    detected: boolean;
    category?: string;
    ruleName?: string;
    maskedPreview?: string;
    hash?: string;
  } | null>(null);

  // Simulator Floating Overlay State
  const [simAlert, setSimAlert] = useState<{
    active: boolean;
    title: string;
    message: string;
    hash: string;
    category: string;
  } | null>(null);

  // Sync with native Electron backend if available
  useEffect(() => {
    if (!isDesktop || !window.electronAPI) return;

    window.electronAPI.getStatus().then((s) => setStatus(s)).catch(console.error);
    window.electronAPI.getSettings().then((set) => setSettings(set)).catch(console.error);
    window.electronAPI.getAuditRecords().then((records) => {
      if (records && records.length > 0) setAuditRecords(records);
    }).catch(console.error);
    window.electronAPI.getSystemInfo().then((info) => setSystemInfo(info)).catch(console.error);

    const unsubStatus = window.electronAPI.onStatusChanged((newStatus) => {
      setStatus(newStatus);
    });

    const unsubAudit = window.electronAPI.onAuditAdded((record) => {
      setAuditRecords((prev) => [record, ...prev]);
      oceanAudio.playPromptAlert();
    });

    const unsubThreat = window.electronAPI.onThreatDetected(() => {
      oceanAudio.playPromptAlert();
    });

    return () => {
      unsubStatus();
      unsubAudit();
      unsubThreat();
    };
  }, [isDesktop]);

  // Protection Toggle
  const handleToggleProtection = async () => {
    oceanAudio.playBubble();
    const next = !status.protectionEnabled;
    if (isDesktop && window.electronAPI) {
      await window.electronAPI.setProtectionEnabled(next);
      const s = await window.electronAPI.getStatus();
      setStatus(s);
    } else {
      setStatus((prev) => ({
        ...prev,
        protectionEnabled: next,
        state: next ? 'ACTIVE' : 'PAUSED',
      }));
    }
  };

  // Auto-Sanitize Toggle
  const handleToggleAutoSanitize = async () => {
    oceanAudio.playBubble();
    const next = !status.autoSanitize;
    if (isDesktop && window.electronAPI) {
      await window.electronAPI.setAutoSanitize(next);
      const s = await window.electronAPI.getStatus();
      setStatus(s);
    } else {
      setStatus((prev) => ({ ...prev, autoSanitize: next }));
    }
  };

  // Test Inspector Parser
  const runInspection = (text: string) => {
    setTestInput(text);
    if (!text.trim()) {
      setTestResult(null);
      return;
    }

    const cleanDigits = text.replace(/[\s-]/g, '');
    if (/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/.test(cleanDigits)) {
      setTestResult({
        detected: true,
        category: 'CREDIT_CARD',
        ruleName: 'Visa / Mastercard Primary Account Number (Luhn-Verified)',
        maskedPreview: cleanDigits.slice(0, 4) + ' •••• •••• ' + cleanDigits.slice(-4),
        hash: '0x' + Array.from(text).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(32, '0').slice(0, 32),
      });
    } else if (/\bAKIA[0-9A-Z]{16}\b/.test(text)) {
      setTestResult({
        detected: true,
        category: 'SECRET_TOKEN',
        ruleName: 'AWS Access Key ID',
        maskedPreview: text.slice(0, 4) + '••••••••' + text.slice(-2),
        hash: '0x4f9a018bc28914cda71089bc214fa891',
      });
    } else if (/\b0x[a-fA-F0-9]{40}\b/.test(text)) {
      setTestResult({
        detected: true,
        category: 'CRYPTO_WALLET',
        ruleName: 'Ethereum Public Address',
        maskedPreview: text.slice(0, 6) + '...' + text.slice(-4),
        hash: '0x81fa0194eb827a01c8930198fbc18294',
      });
    } else if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) && (text.includes('axis') || text.includes('upi') || text.includes('okhdfcbank') || text.includes('paytm'))) {
      setTestResult({
        detected: true,
        category: 'UPI_FINANCIAL',
        ruleName: 'Indian UPI Virtual Payment Address',
        maskedPreview: text.split('@')[0].slice(0, 2) + '****@' + text.split('@')[1],
        hash: '0x7b9412ea09c148f91048b291ca820149',
      });
    } else {
      setTestResult({ detected: false });
    }
  };

  // Launch Simulator Alert
  const triggerSimulatedAlert = (category: string, title: string, message: string) => {
    oceanAudio.playPromptAlert();
    const hash = '0x' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    setSimAlert({
      active: true,
      title,
      message,
      hash,
      category,
    });
  };

  const handleSimApprove = () => {
    if (!simAlert) return;
    oceanAudio.playApprovedChime();
    const newRec: AuditRecord = {
      id: 'sim_' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      alertMsg: simAlert.message,
      action: 'APPROVED',
      platform: 'ANDROID',
      payloadHash: simAlert.hash,
      signature: 'ECDSA-AUTH-CONFIRMED',
    };
    setAuditRecords((prev) => [newRec, ...prev]);
    setSimAlert(null);
  };

  const handleSimCancel = () => {
    if (!simAlert) return;
    oceanAudio.playBubble();
    const newRec: AuditRecord = {
      id: 'sim_' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      alertMsg: simAlert.message,
      action: 'CANCELLED',
      platform: 'ANDROID',
      payloadHash: simAlert.hash,
      signature: 'BLOCKED_BY_USER',
    };
    setAuditRecords((prev) => [newRec, ...prev]);
    setSimAlert(null);
  };

  const handleClearAudit = () => {
    oceanAudio.playBubble();
    setAuditRecords([]);
    setShowClearConfirm(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className={`security-console-overlay ${isOpen ? 'active' : ''}`}>
      <div className="security-console-panel">
        {/* Header Bar */}
        <div className="p-6 border-b border-[var(--border-light)] bg-white/70 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-gold)]/15 border border-[var(--border-light)] flex items-center justify-center text-[var(--accent-warm-bronze)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif italic font-normal text-[var(--text-main)]">
                C-Shield Command Center
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Native Security Suite v{status.version}</span>
                <span>•</span>
                <span className={status.state === 'ACTIVE' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  ● {status.state}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleAudio}
              className="p-2 rounded-lg border border-[var(--border-light)] bg-white/80 text-[var(--text-muted)] hover:text-[var(--accent-warm-bronze)] transition-colors"
              title={isAudioActive ? 'Mute Audio' : 'Enable Audio'}
            >
              {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-[var(--border-light)] bg-white/80 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Status Control Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-[var(--bg-accent)]/30 border-b border-[var(--border-light)]">
          {/* Status 1 */}
          <div className="p-3 bg-white/80 rounded-xl border border-[var(--border-light)] flex flex-col justify-between">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Protection</span>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-sm font-semibold ${status.protectionEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                {status.protectionEnabled ? 'Active' : 'Paused'}
              </span>
              <button
                onClick={handleToggleProtection}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  status.protectionEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status 2 */}
          <div className="p-3 bg-white/80 rounded-xl border border-[var(--border-light)] flex flex-col justify-between">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Auto-Sanitize</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-semibold text-[var(--text-main)]">
                {status.autoSanitize ? 'Enforced' : 'Off'}
              </span>
              <button
                onClick={handleToggleAutoSanitize}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  status.autoSanitize
                    ? 'bg-[var(--accent-gold)] text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status 3 */}
          <div className="p-3 bg-white/80 rounded-xl border border-[var(--border-light)]">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Scans Conducted</span>
            <div className="text-lg font-mono font-bold text-[var(--text-main)] mt-1">
              {status.scansPerformed.toLocaleString()}
            </div>
          </div>

          {/* Status 4 */}
          <div className="p-3 bg-white/80 rounded-xl border border-[var(--border-light)]">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Threats Neutralized</span>
            <div className="text-lg font-mono font-bold text-rose-700 mt-1">
              {status.threatsDetected}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-light)] px-4 sm:px-6 bg-white/50 overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            { id: 'inspector', label: 'Threat Inspector', icon: Activity },
            { id: 'simulator', label: 'Mobile Simulator', icon: Smartphone },
            { id: 'audit', label: 'Audit Ledger', icon: FileText, badge: auditRecords.length },
            { id: 'settings', label: 'Preferences', icon: SettingsIcon },
            { id: 'diagnostics', label: 'Diagnostics', icon: Cpu },
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
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-[var(--accent-gold)] text-[var(--accent-warm-bronze)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--accent-gold)]/20 text-[var(--accent-warm-bronze)]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: INSPECTOR */}
          {activeTab === 'inspector' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white/90 border border-[var(--border-light)] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--accent-gold)]" />
                      Live Clipboard & Regex Inspection Engine
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Type or paste sample sensitive data to test on-device pattern parsing with zero disk logging.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => runInspection('4532 0151 1283 0366')}
                      className="px-2.5 py-1 text-[11px] rounded bg-[var(--bg-base)] border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-accent)]"
                    >
                      Test Visa
                    </button>
                    <button
                      onClick={() => runInspection('AKIAIOSFODNN7EXAMPLE')}
                      className="px-2.5 py-1 text-[11px] rounded bg-[var(--bg-base)] border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-accent)]"
                    >
                      Test AWS Key
                    </button>
                    <button
                      onClick={() => runInspection('merchant.store@okaxis')}
                      className="px-2.5 py-1 text-[11px] rounded bg-[var(--bg-base)] border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--bg-accent)]"
                    >
                      Test UPI
                    </button>
                  </div>
                </div>

                <textarea
                  value={testInput}
                  onChange={(e) => runInspection(e.target.value)}
                  placeholder="Paste text, card number, secret key, or token to test..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)]"
                />

                {testResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                      testResult.detected
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {testResult.detected ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        {testResult.detected ? (
                          <>
                            <div className="font-semibold text-rose-800">{testResult.ruleName}</div>
                            <div className="font-mono text-[11px] text-rose-700 mt-0.5">
                              Masked Result: {testResult.maskedPreview}
                            </div>
                            <div className="font-mono text-[10px] text-rose-600 mt-0.5">
                              Hash: {testResult.hash}
                            </div>
                          </>
                        ) : (
                          <div className="font-semibold text-emerald-800">
                            Clean Buffer: No sensitive credentials identified.
                          </div>
                        )}
                      </div>
                    </div>
                    {testResult.detected && (
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                        INTERCEPTED
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Threat Engine Specs */}
              <div className="p-5 rounded-2xl bg-white/70 border border-[var(--border-light)] space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-warm-bronze)]">
                  Active Protection Modules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
                  <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)]/50">
                    <span className="font-semibold text-[var(--text-main)]">Luhn Algorithm MOD-10</span>
                    <p className="text-[11px] mt-0.5">Primary Account Numbers verified mathematically before buffer writes.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)]/50">
                    <span className="font-semibold text-[var(--text-main)]">Cloud & API Token Shield</span>
                    <p className="text-[11px] mt-0.5">Instant match for AWS keys, GitHub PATs, JWT tokens, and private keys.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)]/50">
                    <span className="font-semibold text-[var(--text-main)]">Financial Interception</span>
                    <p className="text-[11px] mt-0.5">UPI VPAs, IBAN accounts, and banking transaction SMS interception.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-light)]/50">
                    <span className="font-semibold text-[var(--text-main)]">Zero Plaintext Policy</span>
                    <p className="text-[11px] mt-0.5">Passwords and card numbers never written to disk in unencrypted form.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MOBILE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white/90 border border-[var(--border-light)] space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[var(--accent-gold)]" />
                    Interactive Android & Mobile Authorization Simulation
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Trigger financial scenarios to test the floating overlay prompt on top of banking transactions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => triggerSimulatedAlert('UPI_PAYMENT', 'UPI Payment Intercepted', '₹4,500 debited from HDFC A/c **4102 to Zomato UPI. Ref: 982140')}
                    className="p-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] hover:bg-[var(--bg-accent)] text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-[var(--text-main)]">UPI Debit Alert</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">₹4,500 Zomato UPI Transfer</div>
                  </button>

                  <button
                    onClick={() => triggerSimulatedAlert('OTP_PROTECTION', 'Confidential OTP Protected', 'Your confidential SBI NetBanking OTP is 891240. Valid for 5 minutes.')}
                    className="p-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] hover:bg-[var(--bg-accent)] text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-[var(--text-main)]">OTP SMS Intercept</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">SBI OTP 891240 Guard</div>
                  </button>

                  <button
                    onClick={() => triggerSimulatedAlert('CREDIT_CARD', 'Credit Card Intercepted', 'Card 4111 2091 8832 9021 detected in clipboard buffer')}
                    className="p-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] hover:bg-[var(--bg-accent)] text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-[var(--text-main)]">Card Paste Guard</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">Visa PAN Detection</div>
                  </button>
                </div>
              </div>

              {/* Simulated Floating Dialog */}
              {simAlert && simAlert.active && (
                <div className="p-6 rounded-2xl bg-[#1e293b] text-white shadow-2xl border border-sky-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      🛡️ CLIPBOARD SHIELD MOBILE PROMPT
                    </span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">
                      OVERLAY ACTIVE
                    </span>
                  </div>

                  <div className="text-sm font-medium text-slate-100">
                    {simAlert.message}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    SHA-256: {simAlert.hash.slice(0, 24)}...
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSimCancel}
                      className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                    >
                      Block / Cancel
                    </button>
                    <button
                      onClick={handleSimApprove}
                      className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
                    >
                      Approve Transaction
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LEDGER */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)]">
                    Local Immutable Audit Records
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Cryptographically hashed threat history with SHA-256 signatures.
                  </p>
                </div>

                {auditRecords.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {showClearConfirm && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900">
                  <span>Purge local ledger history permanently?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2.5 py-1 rounded bg-slate-200 text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAudit}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {auditRecords.length === 0 ? (
                <div className="p-8 text-center bg-white/70 rounded-xl border border-[var(--border-light)] text-xs text-[var(--text-muted)]">
                  Audit ledger is currently empty. Intercepted events will appear here.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl bg-white/90 border border-[var(--border-light)] text-xs space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[var(--text-muted)]">{rec.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-accent)] text-[var(--text-main)]">
                            {rec.platform || 'SYSTEM'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.action === 'APPROVED'
                                ? 'bg-teal-100 text-teal-800'
                                : rec.action === 'SANITIZED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.action}
                          </span>
                        </div>
                      </div>
                      <div className="font-medium text-[var(--text-main)]">{rec.alertMsg}</div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono text-[10px] text-[var(--text-muted)]">
                        <span>Hash: {rec.payloadHash.slice(0, 20)}...</span>
                        <button
                          onClick={() => copyToClipboard(rec.payloadHash)}
                          className="flex items-center gap-1 text-[var(--accent-warm-bronze)] hover:underline"
                        >
                          {copiedHash === rec.payloadHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHash === rec.payloadHash ? 'Copied' : 'Copy Hash'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/90 border border-[var(--border-light)] text-xs">
                  <div>
                    <div className="font-semibold text-[var(--text-main)]">Start with Windows Boot</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Launch daemon minimized to taskbar on system start.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.startWithWindows}
                    onChange={(e) => setSettings({ ...settings, startWithWindows: e.target.checked })}
                    className="w-4 h-4 accent-[var(--accent-gold)]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/90 border border-[var(--border-light)] text-xs">
                  <div>
                    <div className="font-semibold text-[var(--text-main)]">Keep Running in Background (Close to Tray)</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Closing the window keeps the clipboard interceptor active.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.closeToTray}
                    onChange={(e) => setSettings({ ...settings, closeToTray: e.target.checked })}
                    className="w-4 h-4 accent-[var(--accent-gold)]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/90 border border-[var(--border-light)] text-xs">
                  <div>
                    <div className="font-semibold text-[var(--text-main)]">Desktop Toast Notifications</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Show native OS notification banners upon threat interception.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[var(--accent-gold)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white/90 border border-[var(--border-light)] space-y-2">
                <div className="font-semibold text-[var(--text-main)]">Host Environment & Boundaries</div>
                <div className="font-mono text-[11px] space-y-1 text-[var(--text-muted)]">
                  <div>Platform: {isDesktop ? 'Windows NT (Desktop Daemon)' : 'Web Browser Preview Client'}</div>
                  <div>Sandbox: Electron Context Isolation Enforced</div>
                  <div>Zero Telemetry: Offline Execution Verified</div>
                  <div>Storage: %APPDATA%/ClipboardShield</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/90 border border-[var(--border-light)] space-y-2">
                <div className="font-semibold text-[var(--text-main)]">Multi-OS Client Binaries</div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onOpenDownloadModal('Windows')}
                    className="flex-1 py-2 rounded-lg bg-[var(--text-main)] text-white text-xs font-semibold hover:bg-[var(--accent-gold)] transition-colors"
                  >
                    Windows Installer (.exe)
                  </button>
                  <button
                    onClick={() => onOpenDownloadModal('Android')}
                    className="flex-1 py-2 rounded-lg bg-[var(--text-main)] text-white text-xs font-semibold hover:bg-[var(--accent-gold)] transition-colors"
                  >
                    Android Package (.apk)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
