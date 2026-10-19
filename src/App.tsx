import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UnderwaterScene } from './components/UnderwaterScene';
import { NativeAppSimulator } from './components/NativeAppSimulator';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { DownloadHub } from './components/DownloadHub';
import { AuditLogViewer } from './components/AuditLogViewer';
import { SpecsSection } from './components/SpecsSection';
import { BottomControlDock } from './components/BottomControlDock';
import { Footer } from './components/Footer';
import { AuditRecord } from './types';
import { oceanAudio } from './utils/audio';

export default function App() {
  // Theme state: default to serene light ocean as requested ("serene, calm, light themed", with dark mode toggle)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Initial audit records seeded to demonstrate Spring Boot backend immutability
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([
    {
      id: 'tx_init_1',
      timestamp: '09:38:12',
      alertMsg: '₹4,500 debited from HDFC A/c **4102 to Zomato UPI. Ref: 982140',
      action: 'APPROVED',
      platform: 'ANDROID',
      payloadHash: '0x8f2a1b94d7c0e81254a67b931e0c7a52',
      signature: 'ECDSA-SHA256:7B94E10A',
    },
    {
      id: 'tx_init_2',
      timestamp: '09:21:05',
      alertMsg: 'Suspected clipboard access from com.untrusted.keyboard to OTP 902184',
      action: 'CANCELLED',
      platform: 'ANDROID',
      payloadHash: '0x12c49a07ef41b68239014dfa8b92e76c',
      signature: 'BLOCKED_BY_USER',
    },
  ]);

  // Sync dark class to <html> element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    oceanAudio.playBubble();
    setIsDarkMode((prev) => !prev);
  };

  const toggleAudio = () => {
    const active = oceanAudio.toggleMute();
    setIsAudioActive(active);
  };

  const handleNewAudit = (record: AuditRecord) => {
    setAuditRecords((prev) => [record, ...prev]);
  };

  const handleQuickTestAlert = () => {
    oceanAudio.playPromptAlert();
    const el = document.getElementById('simulator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative ${isDarkMode ? 'bg-[#06141d] text-slate-100' : 'bg-[#e9f7f8] text-slate-900'}`}>
      {/* 3D WebGL Underwater Scene mounted in background */}
      <UnderwaterScene isDarkMode={isDarkMode} />

      {/* Underwater Caustics & Ambient Light Ray Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-overlay animate-caustic"
        style={{
          backgroundImage: isDarkMode
            ? 'radial-gradient(ellipse at 50% 0%, rgba(13, 148, 136, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.35) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Top Bar Navigation */}
      <Navbar
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isAudioActive={isAudioActive}
        onToggleAudio={toggleAudio}
      />

      {/* Main Content Sections */}
      <main className="relative z-10">
        <Hero />

        <div id="simulator-section">
          <NativeAppSimulator
            onNewAudit={handleNewAudit}
            isDarkMode={isDarkMode}
          />
        </div>

        <div id="architecture-section">
          <ArchitectureFlow />
        </div>

        <div id="download-section">
          <DownloadHub />
        </div>

        <div id="audit-section">
          <AuditLogViewer
            records={auditRecords}
            onClear={() => setAuditRecords([])}
          />
        </div>

        <div id="specs-section">
          <SpecsSection />
        </div>
      </main>

      {/* Collapsible Bottom Control Dock */}
      <BottomControlDock
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isAudioActive={isAudioActive}
        onToggleAudio={toggleAudio}
        onQuickTestAlert={handleQuickTestAlert}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
