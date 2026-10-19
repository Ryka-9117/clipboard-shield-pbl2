import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  CheckCircle2,
  XCircle,
  Copy,
  Terminal,
  Send,
  Lock,
  RefreshCw,
  Eye,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { NotificationItem, AuditRecord } from '../types';
import { oceanAudio } from '../utils/audio';

interface NativeAppSimulatorProps {
  onNewAudit: (record: AuditRecord) => void;
  isDarkMode: boolean;
}

const PRESET_NOTIFICATIONS: Omit<NotificationItem, 'id' | 'timestamp'>[] = [
  {
    sender: 'Google Pay',
    appName: 'com.google.android.apps.nbu.paisa.user',
    title: 'GPay Alert',
    text: '₹4,850 debited from HDFC A/c **4102 to Zomato UPI. Ref: 982140',
    isFinancial: true,
    matchedKeywords: ['debited', '₹'],
    amount: '₹4,850',
  },
  {
    sender: 'HDFC Bank',
    appName: 'com.snapwork.hdfc',
    title: 'OTP Verification',
    text: 'Your confidential OTP is 894102 for transaction of ₹12,999 at Reliance Retail. Do not share.',
    isFinancial: true,
    matchedKeywords: ['OTP', '₹'],
    amount: '₹12,999',
  },
  {
    sender: 'PhonePe',
    appName: 'com.phonepe.app',
    title: 'PhonePe Payment',
    text: '₹1,500 credited to your account from Priya Sharma. UTR: 48910271',
    isFinancial: true,
    matchedKeywords: ['credited', '₹'],
    amount: '₹1,500',
  },
  {
    sender: 'Chase Mobile',
    appName: 'com.chase.sig.android',
    title: 'Fraud Alert',
    text: 'A wire transfer of $850.00 was initiated from Checking **8831. Approve or decline.',
    isFinancial: true,
    matchedKeywords: ['debited', '$'],
    amount: '$850.00',
  },
  {
    sender: 'WhatsApp',
    appName: 'com.whatsapp',
    title: 'Family Group',
    text: 'Hey everyone, the dinner is scheduled at 8:00 PM tonight at the bay view restaurant!',
    isFinancial: false,
    matchedKeywords: [],
  },
];

export const NativeAppSimulator: React.FC<NativeAppSimulatorProps> = ({
  onNewAudit,
  isDarkMode,
}) => {
  // Simulator State
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'windows'>('android');
  const [activeOverlayMsg, setActiveOverlayMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customInputText, setCustomInputText] = useState('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>(['debited', 'credited', 'OTP', '₹', '$']);
  const [clipboardContent, setClipboardContent] = useState<string>('4111 2049 8831 9021');
  const [clipboardSanitized, setClipboardSanitized] = useState<boolean>(false);
  const [autoSanitizeEnabled, setAutoSanitizeEnabled] = useState<boolean>(true);
  const [showSourceCode, setShowSourceCode] = useState<boolean>(false);

  // Trigger floating prompt
  const triggerNotification = (notif: typeof PRESET_NOTIFICATIONS[0]) => {
    oceanAudio.playBubble();

    // Check regex matching as in NotificationService.java
    const matches: string[] = [];
    activeKeywords.forEach((kw) => {
      if (notif.text.toLowerCase().includes(kw.toLowerCase())) {
        matches.push(kw);
      }
    });

    if (matches.length > 0) {
      oceanAudio.playPromptAlert();
      setActiveOverlayMsg(notif.text);
    } else {
      showToast(`Notification passed (No financial trigger detected)`);
    }
  };

  const handleCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputText.trim()) return;

    const notif = {
      sender: 'Incoming Alert',
      appName: 'com.custom.notifier',
      title: 'Real-time Event',
      text: customInputText,
      isFinancial: true,
      matchedKeywords: [],
      amount: undefined,
    };
    triggerNotification(notif);
    setCustomInputText('');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleApprove = () => {
    if (!activeOverlayMsg) return;
    oceanAudio.playApprovedChime();

    const timestamp = new Date().toLocaleTimeString();
    const hash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const sig = 'ECDSA-SHA256:' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const record: AuditRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      alertMsg: activeOverlayMsg,
      action: 'APPROVED',
      platform: activePlatform.toUpperCase(),
      payloadHash: hash,
      signature: sig,
    };

    onNewAudit(record);
    showToast('Transaction Approved');
    setActiveOverlayMsg(null);
  };

  const handleCancel = () => {
    if (!activeOverlayMsg) return;
    oceanAudio.playBubble();

    const timestamp = new Date().toLocaleTimeString();
    const hash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const record: AuditRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      alertMsg: activeOverlayMsg,
      action: 'CANCELLED',
      platform: activePlatform.toUpperCase(),
      payloadHash: hash,
      signature: 'BLOCKED_BY_USER',
    };

    onNewAudit(record);
    showToast('Transaction Cancelled');
    setActiveOverlayMsg(null);
  };

  // Clipboard Test handlers
  const handleTestClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setClipboardContent(text);
          setClipboardSanitized(false);
          showToast('Copied from browser clipboard!');
          return;
        }
      }
    } catch {
      // Permission fallback
    }
    setClipboardContent('5424 1800 2931 9920 - CVV: 891');
    setClipboardSanitized(false);
  };

  const handleSanitizeClipboard = () => {
    oceanAudio.playBubble();
    // Scrub numbers and secrets
    const sanitized = clipboardContent.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '•••• •••• •••• [REDACTED]')
      .replace(/\b\d{3,6}\b/g, '[REDACTED_OTP]');
    setClipboardContent(sanitized);
    setClipboardSanitized(true);
    showToast('Clipboard sanitized and encrypted');
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-12 px-4 sm:px-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">
          <span>Interactive Runtime</span>
          <span aria-hidden="true">·</span>
          <span>NotificationListenerService</span>
          <span aria-hidden="true">·</span>
          <span>Floating System Overlay</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
          Experience Clipboard Shield in Action
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Simulate real-time financial SMS and push notification interception. See the native background service trigger the system alert dialog and audit pipe.
        </p>
      </div>

      {/* Main Grid: Device Simulator on Left, Controls & Specs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Device Viewport Column (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* Platform Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl mb-4 backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50">
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activePlatform === 'android'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Native</span>
            </button>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activePlatform === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS / PWA</span>
            </button>
            <button
              onClick={() => setActivePlatform('windows')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activePlatform === 'windows'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Windows Daemon</span>
            </button>
          </div>

          {/* Device Frame */}
          <div className="relative w-full max-w-[370px] aspect-[9/18.5] bg-slate-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800/80 border-4 border-slate-700/60 overflow-hidden flex flex-col justify-between">
            {/* Camera cutout / Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/80"></div>
            </div>

            {/* Device Screen Background (Simulating Banking / Home app) */}
            <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 text-white flex flex-col justify-between p-4 pt-10 select-none">
              {/* Screen Top Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-teal-400" />
                  <span>5G</span>
                  <span>98%</span>
                </div>
              </div>

              {/* Simulated Host App Header */}
              <div className="my-auto text-center px-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 mb-3">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">UPI & Banking App</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active background listener guarding clipboard and notifications
                </p>

                {/* Status Indicator */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-xs text-teal-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>NotificationService: Active</span>
                </div>
              </div>

              {/* FLOATING SYSTEM OVERLAY PROMPT (SYSTEM_ALERT_WINDOW) */}
              {activeOverlayMsg && (
                <div className="absolute inset-x-3 top-16 z-40 bg-slate-900/95 border border-teal-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-400">
                      Clipboard Shield Prompt
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans mb-4 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    {activeOverlayMsg}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCancel}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}

              {/* Native Android / System Toast notification */}
              {toastMessage && (
                <div className="absolute bottom-12 inset-x-8 z-50 bg-slate-800/90 text-white text-xs py-2 px-3 rounded-full text-center shadow-lg border border-slate-700/60 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {toastMessage}
                </div>
              )}

              {/* Virtual Home Bar */}
              <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2"></div>
            </div>
          </div>
        </div>

        {/* Interactive Controls & Test Harness Column (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card: Preset Notifications trigger */}
          <div className="p-6 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Simulate Inbound Notifications
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any test alert to feed into NotificationService.java
                </p>
              </div>
              <button
                onClick={() => setShowSourceCode(!showSourceCode)}
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showSourceCode ? 'Hide Code' : 'View Code'}</span>
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              {PRESET_NOTIFICATIONS.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => triggerNotification(item)}
                  className="group p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 cursor-pointer transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.sender}
                      </span>
                      {item.isFinancial ? (
                        <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                          Trigger: {item.matchedKeywords.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          Ignored (Non-financial)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {item.text}
                    </p>
                  </div>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 mt-1 transition-colors" />
                </div>
              ))}
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleCustomTrigger} className="mt-4 flex gap-2">
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder="Type custom SMS (e.g. ₹500 debited from SBI...)"
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                Send
              </button>
            </form>
          </div>

          {/* Card: Clipboard Guard & Sanitizer */}
          <div className="p-6 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Live Clipboard Sanitizer
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {clipboardSanitized ? 'Status: Protected' : 'Status: Sensitive Data'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs border border-slate-800 mb-3 flex items-center justify-between">
              <span className="truncate pr-2">{clipboardContent}</span>
              <button
                onClick={handleTestClipboard}
                title="Paste / Read Clipboard"
                className="text-slate-400 hover:text-white p-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSanitizeClipboard}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sanitize Clipboard</span>
              </button>
              <button
                onClick={() => {
                  setClipboardContent('5520 8910 2419 8831 (CVV: 394)');
                  setClipboardSanitized(false);
                }}
                className="py-2 px-3 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>

          {/* Optional Code Inspector */}
          {showSourceCode && (
            <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner">
              <div className="text-teal-400 font-semibold mb-2">
                // FloatingOverlayActivity.java (Active in foreground)
              </div>
              <pre>{`Button btnApprove = findViewById(R.id.btn_approve);
btnApprove.setOnClickListener(v -> {
    Toast.makeText(this, "Transaction Approved", Toast.LENGTH_SHORT).show();
    sendAuthorizationToSpringBoot();
    finish();
});`}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
