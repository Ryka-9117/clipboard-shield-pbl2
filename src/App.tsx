import React, { useState, useEffect, useRef } from 'react';
import { SecurityConsole } from './components/SecurityConsole';
import {
  downloadWindowsInstaller,
  downloadWindowsPortable,
  WINDOWS_RELEASE_INFO,
} from './utils/fileGenerators';
import { oceanAudio } from './utils/audio';

export default function App() {
  // Navigation / Presentation Stages
  const [stage, setStage] = useState<'dissolve' | 'login' | 'landing'>('dissolve');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSecurityConsoleOpen, setIsSecurityConsoleOpen] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Custom Cursor State
  const cursorRef = useRef<HTMLDivElement>(null);

  // Dissolve Screen State
  const [dissolvedIndices, setDissolvedIndices] = useState<Set<number>>(new Set());
  const [isHexClusterEmerged, setIsHexClusterEmerged] = useState<boolean>(false);

  // Login Form State
  const [email, setEmail] = useState('demo@cshield.com');
  const [password, setPassword] = useState('••••••••');

  // Executive Download Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    osName: 'Windows' | 'Android' | null;
    title: string;
    description: string;
    isReady: boolean;
  }>({
    isOpen: false,
    osName: null,
    title: '',
    description: '',
    isReady: false,
  });

  // Track cursor movement & element hovering
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !cursorRef.current) return;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        cursorRef.current.classList.add('typing');
      } else if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('.flip-card') ||
        target.closest('.modal-card') ||
        target.closest('.download-action-btn') ||
        target.closest('.btn-login')
      ) {
        cursorRef.current.classList.add('hovering');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !cursorRef.current) return;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        cursorRef.current.classList.remove('typing');
      } else {
        cursorRef.current.classList.remove('hovering');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // Stage 1 Dissolve sequence on initial load
  useEffect(() => {
    const hexTimer = setTimeout(() => {
      setIsHexClusterEmerged(true);
    }, 150);

    const totalTiles = 1000;
    const indices = Array.from({ length: totalTiles }, (_, i) => i);
    // Shuffle indices for organic dissolve
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const dissolveInterval = 2000 / totalTiles;
    const dissolveTimers: NodeJS.Timeout[] = [];

    const startTimer = setTimeout(() => {
      indices.forEach((tileIdx, step) => {
        const t = setTimeout(() => {
          setDissolvedIndices((prev) => new Set(prev).add(tileIdx));
        }, step * dissolveInterval);
        dissolveTimers.push(t);
      });
    }, 500);

    const finishTimer = setTimeout(() => {
      setStage('login');
    }, 2600);

    return () => {
      clearTimeout(hexTimer);
      clearTimeout(startTimer);
      clearTimeout(finishTimer);
      dissolveTimers.forEach(clearTimeout);
    };
  }, []);

  // Handle Login submission -> Landing page
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    oceanAudio.playBubble();
    setStage('landing');
  };

  // Card Flip Handler
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('#downloadAndroidBtn') || target.closest('#downloadWindowsBtn')) {
      return;
    }
    oceanAudio.playBubble();
    setIsFlipped((prev) => !prev);
  };

  // Trigger Download Modal & Automatic Installer Download
  const triggerDownload = (os: 'Windows' | 'Android') => {
    oceanAudio.playPromptAlert();
    setModalState({
      isOpen: true,
      osName: os,
      title: `Preparing ${os} Package`,
      description: `Establishing secure encrypted connection with C-Shield distribution servers...`,
      isReady: false,
    });

    // Step 2 Progress after 1.4s
    const t1 = setTimeout(() => {
      setModalState((prev) => ({
        ...prev,
        description: `Verifying system integrity and building secure sandbox for ${os}...`,
      }));
    }, 1400);

    // Step 3 Ready + Auto Trigger Download after 3.0s
    const t2 = setTimeout(() => {
      setModalState((prev) => ({
        ...prev,
        title: `Ready for Download`,
        description:
          os === 'Windows'
            ? `Thank you for downloading C-Shield for Windows. Your official installer (Clipboard-Shield-Setup-1.4.0.exe) is ready.`
            : `Thank you for downloading C-Shield for Android. Your official mobile security package (ClipboardShield-v1.4.0.apk) is ready.`,
        isReady: true,
      }));

      // Automatically trigger the real file download
      if (os === 'Windows') {
        downloadWindowsInstaller();
      } else {
        downloadAndroidApk();
      }
      oceanAudio.playApprovedChime();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  // Direct Android APK Download
  const downloadAndroidApk = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = document.createElement('a');
    link.href = `${origin}/downloads/ClipboardShield-v1.4.0.apk`;
    link.download = 'ClipboardShield-v1.4.0.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Android Source Zip Download
  const downloadAndroidSourceZip = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = document.createElement('a');
    link.href = `${origin}/downloads/ClipboardShield-Android-Source.zip`;
    link.download = 'ClipboardShield-Android-Source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeDownloadModal = () => {
    oceanAudio.playBubble();
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleAudio = () => {
    const active = oceanAudio.toggleMute();
    setIsAudioActive(active);
  };

  return (
    <>
      {/* Reactive Custom Cursor */}
      <div id="custom-cursor" ref={cursorRef}></div>

      {/* Dynamic Animated Gradient Background */}
      <div className="dynamic-bg"></div>

      {/* Moving Horizontal Bricks Pattern Overlay */}
      <div className="brick-layer"></div>

      {/* 1. PPT Dissolve Screen */}
      {stage === 'dissolve' && (
        <div id="dissolve-screen">
          <div className="hexagon-emergence-container">
            <div className={`hex-cluster ${isHexClusterEmerged ? 'emerge' : ''}`} id="hexCluster">
              <div className="hex-block"></div>
              <div className="hex-block"></div>
              <div className="hex-block"></div>
            </div>
          </div>
          <div className="dissolve-grid" id="dissolveGrid">
            {Array.from({ length: 1000 }).map((_, idx) => (
              <div
                key={idx}
                className={`dissolve-tile ${dissolvedIndices.has(idx) ? 'dissolved' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Login Screen with Cube Boundary */}
      <div id="login-screen" className={stage === 'login' ? 'active' : ''}>
        <div className="login-cube-wrapper">
          <div className="cube-boundary" id="cubeBoundary">
            {Array.from({ length: 120 }).map((_, i) => (
              <div key={i} className="boundary-cube"></div>
            ))}
          </div>
          <div className="login-box">
            <h2>C-Shield</h2>
            <p>Authentication Required</p>
            <form id="loginForm" onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@cshield.com"
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn-login">
                Access Portal
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Landing Page (Strictly Locked 760px x 420px 3D Flip Card Scene) */}
      <div id="landing-page" className={stage === 'landing' ? 'active' : ''}>
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="nav-logo">C-SHIELD</div>
          <div className="nav-right">
            <span>Security Gateway</span>
            <button
              onClick={() => setIsSecurityConsoleOpen(true)}
              className="nav-btn"
            >
              Security Console
            </button>
          </div>
        </nav>

        {/* 3D Flip Card Scene */}
        <main className="card-scene">
          <div
            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            id="flipCard"
            onClick={handleCardClick}
          >
            {/* Front Side: C-Shield Info */}
            <div className="card-face card-front">
              <div className="linkedin-bg-pattern"></div>
              <h1 className="cshield-title">C-Shield</h1>
              <p className="app-info">
                Clipboard Shield is a genuine Windows desktop application that protects your clipboard against financial fraud, credential harvesting, and inadvertent secret disclosure. Operating as an interactive background daemon in your Windows taskbar system notification tray, it continuously monitors clipboard buffer updates and sanitizes sensitive credentials before untrusted applications can capture them.
              </p>
              <div className="flip-hint">Click card to view download options</div>
            </div>

            {/* Back Side: Shifted Left DOWNLOAD, Tall Rounded Vertical Action Buttons */}
            <div className="card-face card-back">
              <div className="linkedin-bg-pattern"></div>

              {/* Rotated DOWNLOAD label shifted closer to left edge */}
              <div className="rotated-download-label">DOWNLOAD</div>

              {/* Download Buttons Column */}
              <div className="download-buttons-column">
                {/* Android Download Button */}
                <div
                  className="download-action-btn"
                  id="downloadAndroidBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerDownload('Android');
                  }}
                >
                  <div className="btn-title">Android</div>
                  <div className="btn-dots">
                    <div className="btn-dot"></div>
                    <div className="btn-dot"></div>
                    <div className="btn-dot"></div>
                  </div>
                </div>

                {/* Windows Download Button */}
                <div
                  className="download-action-btn"
                  id="downloadWindowsBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerDownload('Windows');
                  }}
                >
                  <div className="btn-title">Windows</div>
                  <div className="btn-dots">
                    <div className="btn-dot"></div>
                    <div className="btn-dot"></div>
                    <div className="btn-dot"></div>
                  </div>
                </div>
              </div>

              <div className="flip-hint" style={{ bottom: '18px' }}>
                Click outside buttons to flip back
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Executive Modal Overlay for Download States */}
      <div
        id="download-modal-overlay"
        className={modalState.isOpen ? 'active' : ''}
      >
        <div className="modal-card">
          {!modalState.isReady ? (
            <div className="modal-spinner" id="modalSpinner"></div>
          ) : (
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
              ✓
            </div>
          )}

          <h3 className="modal-title" id="modalTitle">
            {modalState.title}
          </h3>

          <p className="modal-desc" id="modalDesc">
            {modalState.description}
          </p>

          {modalState.isReady && (
            <div className="space-y-3 mt-4">
              {modalState.osName === 'Windows' && (
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={downloadWindowsInstaller}
                    className="modal-btn"
                  >
                    Download Setup (.exe)
                  </button>
                  <button
                    onClick={downloadWindowsPortable}
                    className="modal-btn modal-btn-secondary"
                  >
                    Portable Standalone
                  </button>
                </div>
              )}

              {modalState.osName === 'Android' && (
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={downloadAndroidApk}
                    className="modal-btn"
                  >
                    Download Android APK (.apk)
                  </button>
                  <button
                    onClick={downloadAndroidSourceZip}
                    className="modal-btn modal-btn-secondary"
                  >
                    Source Project (.zip)
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  className="modal-btn"
                  onClick={closeDownloadModal}
                  style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Retained Security Console (Live Inspector, Simulator, Audit Ledger, Settings) */}
      <SecurityConsole
        isOpen={isSecurityConsoleOpen}
        onClose={() => setIsSecurityConsoleOpen(false)}
        isAudioActive={isAudioActive}
        onToggleAudio={toggleAudio}
        onOpenDownloadModal={(os) => {
          setIsSecurityConsoleOpen(false);
          triggerDownload(os);
        }}
      />
    </>
  );
}
