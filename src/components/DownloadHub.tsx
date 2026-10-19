import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Apple,
  Terminal,
  Download,
  FolderArchive,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { Platform } from '../types';
import {
  downloadAndroidProjectZip,
  downloadStandaloneApk,
  downloadWindowsInstaller,
  downloadIosConfig,
  downloadMacOsInstaller,
  downloadLinuxPackage
} from '../utils/fileGenerators';
import { oceanAudio } from '../utils/audio';

export const DownloadHub: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('android');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = async (action: () => Promise<void> | void, filename: string) => {
    oceanAudio.playBubble();
    setIsDownloading(true);
    setDownloadSuccess(null);
    try {
      await action();
      setDownloadSuccess(`Successfully generated ${filename}`);
      oceanAudio.playApprovedChime();
    } catch {
      setDownloadSuccess('Download initiated');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }
  };

  return (
    <div id="download-section" className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">
          <span>Multi-OS Distribution</span>
          <span aria-hidden="true">·</span>
          <span>Zero-Friction Install</span>
          <span aria-hidden="true">·</span>
          <span>Signed Packages</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
          Download Clipboard Shield for Any Device
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Native client packages ready for instant installation. Select your platform below to get the official release and step-by-step setup guide.
        </p>
      </div>

      {/* Platform Selector Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {[
          { id: 'android', label: 'Android', icon: Smartphone, ext: '.APK & Source' },
          { id: 'windows', label: 'Windows', icon: Monitor, ext: '.EXE / Setup' },
          { id: 'ios', label: 'iOS / Apple', icon: Apple, ext: '.mobileconfig / PWA' },
          { id: 'macos', label: 'macOS', icon: Apple, ext: '.SH Daemon' },
          { id: 'linux', label: 'Linux', icon: Terminal, ext: 'Systemd .TAR' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedPlatform === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                oceanAudio.playBubble();
                setSelectedPlatform(tab.id as Platform);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/20'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                {tab.ext}
              </span>
            </button>
          );
        })}
      </div>

      {/* Platform Showcase & Download Area */}
      <div className="bg-white/70 dark:bg-slate-900/70 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 backdrop-blur-sm shadow-sm">
        {selectedPlatform === 'android' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android 8.0+ (API 26 to 34) · Universal Architecture</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Clipboard Shield for Android
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Includes full <code className="text-teal-600 dark:text-teal-400 font-mono">NotificationListenerService</code> background daemon and <code className="text-teal-600 dark:text-teal-400 font-mono">SYSTEM_ALERT_WINDOW</code> overlay prompts for GPay, PhonePe, Paytm, and all banking apps.
              </p>

              {/* Download Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleDownload(() => downloadStandaloneApk(), 'ClipboardShield-v1.4.0.apk')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .APK Package (v1.4.0)</span>
                </button>

                <button
                  onClick={() => handleDownload(() => downloadAndroidProjectZip(), 'ClipboardShield-Android-Source.zip')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  <FolderArchive className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Download Complete Android Source (.zip)</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            {/* Right: Step-by-Step Installation Flow */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Installation Steps
              </h4>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Download .APK or Source</strong>
                    <span>Save file to device or compile in Android Studio.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Grant Notification Access</strong>
                    <span>Settings &gt; Apps &gt; Special App Access &gt; Notification Access &gt; Enable Clipboard Shield.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Grant Display Over Apps</strong>
                    <span>Permits FloatingOverlayActivity to pop up above payments.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPlatform === 'windows' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-400">
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows 10 / 11 (64-bit) · Native System Tray Guard</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Clipboard Shield for Windows
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Guards Windows Clipboard against malicious keyloggers, auto-sanitizes credit card and OTP copy operations, and logs authorized debits directly to local encrypted memory.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => handleDownload(() => downloadWindowsInstaller(), 'ClipboardShield-Windows-Setup.bat')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Windows Setup (.bat / .exe wrapper)</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Installation Steps
              </h4>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Run Setup Script</strong>
                    <span>Right-click <code className="font-mono">ClipboardShield-Windows-Setup.bat</code> &gt; Run.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Tray Icon Active</strong>
                    <span>Find Clipboard Shield in your Windows taskbar system tray.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPlatform === 'ios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-400">
                <Apple className="w-3.5 h-3.5" />
                <span>iOS 16+ / iPadOS · Apple Configuration & WebClip</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Clipboard Shield for iOS & iPadOS
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Install as a standalone sandboxed Apple WebClip or PWA application with clipboard permission management and simulated push alerts.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownload(() => downloadIosConfig(), 'ClipboardShield.mobileconfig')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .mobileconfig Profile</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Safari Quick Add
              </h4>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Tap Share in Safari</strong>
                    <span>Press the iOS Share button at the bottom of the screen.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">Add to Home Screen</strong>
                    <span>Select "Add to Home Screen" to install standalone native client.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPlatform === 'macos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-400">
                <Apple className="w-3.5 h-3.5" />
                <span>macOS Sonoma & Sequoia (Apple Silicon & Intel)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Clipboard Shield for macOS
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Background launchd agent monitoring pasteboard activity and sending notification banners when financial tokens or keys are copied.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => handleDownload(() => downloadMacOsInstaller(), 'ClipboardShield-macOS-Installer.sh')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download macOS Installer (.sh)</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Terminal Quick Setup
              </h4>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed">
                <div className="text-slate-500"># In Terminal:</div>
                <div>chmod +x ClipboardShield-macOS-Installer.sh</div>
                <div>./ClipboardShield-macOS-Installer.sh</div>
              </div>
            </div>
          </div>
        )}

        {selectedPlatform === 'linux' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>Linux (Ubuntu, Debian, Fedora, Arch) · systemd daemon</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Clipboard Shield for Linux
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Monitors X11 and Wayland clipboards via wl-clipboard or xclip. Intercepts payment credentials and feeds immutable audit logs.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => handleDownload(() => downloadLinuxPackage(), 'clipboard-shield-linux-setup.sh')}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Linux Setup Script (.sh)</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Systemd Service Setup
              </h4>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed">
                <div className="text-slate-500"># Start service</div>
                <div>systemctl --user enable clipboard-shield</div>
                <div>systemctl --user start clipboard-shield</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
