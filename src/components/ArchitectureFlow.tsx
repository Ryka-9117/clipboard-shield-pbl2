import React, { useState } from 'react';
import {
  Globe,
  Smartphone,
  Server,
  ArrowDown,
  Lock,
  Code,
  ShieldCheck,
  CheckCircle,
  Play
} from 'lucide-react';
import { oceanAudio } from '../utils/audio';

export const ArchitectureFlow: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<'portal' | 'native' | 'backend'>('portal');
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);

  const runSimulation = () => {
    oceanAudio.playBubble();
    setIsSimulatingPacket(true);
    setTimeout(() => {
      oceanAudio.playPromptAlert();
      setTimeout(() => {
        oceanAudio.playApprovedChime();
        setIsSimulatingPacket(false);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">
          <span>End-to-End Pipeline</span>
          <span aria-hidden="true">·</span>
          <span>Zero-Knowledge Interception</span>
          <span aria-hidden="true">·</span>
          <span>Spring Boot Backend</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
          Product Specs & Architecture Flow
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          The verified secure lifecycle from multi-platform distribution to on-device background interception and encrypted cloud audit immutability.
        </p>

        <div className="mt-4 flex justify-center">
          <button
            onClick={runSimulation}
            disabled={isSimulatingPacket}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulatingPacket ? 'Simulating Pipeline Flow...' : 'Simulate E2E Packet Journey'}</span>
          </button>
        </div>
      </div>

      {/* 3-Tier Architecture Diagram Matching Attached Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Diagram Stack */}
        <div className="lg:col-span-7 space-y-4">
          {/* TIER 1: WEB PORTAL */}
          <div
            onClick={() => {
              oceanAudio.playBubble();
              setSelectedNode('portal');
            }}
            className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
              selectedNode === 'portal'
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/30 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  WEB PORTAL
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Tier 01
              </span>
            </div>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-sans pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>Underwater Aesthetic Frontend with 3D PBR WebGL visual core</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>Product Specs & Architecture Flow Inspector</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>Direct Download Buttons (.APK, .EXE, .mobileconfig, .sh)</span>
              </li>
            </ul>

            {isSimulatingPacket && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-mono text-teal-600 dark:text-teal-400">
                <span className="animate-spin text-sm">✦</span>
                <span>Distributing Package</span>
              </div>
            )}
          </div>

          {/* Flow Connector 1 */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/50 dark:border-teal-800/50">
              <ArrowDown className="w-3 h-3 animate-bounce" />
              <span>User Downloads .APK & Installs App</span>
            </div>
          </div>

          {/* TIER 2: NATIVE APP */}
          <div
            onClick={() => {
              oceanAudio.playBubble();
              setSelectedNode('native');
            }}
            className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
              selectedNode === 'native'
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/30 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  NATIVE APP (Android / Multi-OS)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Tier 02
              </span>
            </div>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-sans pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span><strong>NotificationListenerService</strong>: 24/7 background broadcast interception</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span><strong>Regex Matcher</strong>: High-speed local parser (GPay, PhonePe, Banks, OTP)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span><strong>Floating System Overlay</strong>: Top-level prompt window over all applications</span>
              </li>
            </ul>
          </div>

          {/* Flow Connector 2 */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/50 dark:border-teal-800/50">
              <Lock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>Encrypted API Call (ECDSA / SHA-256 HMAC)</span>
            </div>
          </div>

          {/* TIER 3: JAVA BACKEND SERVER */}
          <div
            onClick={() => {
              oceanAudio.playBubble();
              setSelectedNode('backend');
            }}
            className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
              selectedNode === 'backend'
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/30 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  JAVA BACKEND SERVER
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Tier 03
              </span>
            </div>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-sans pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span><strong>Spring Boot REST API</strong>: \`/api/v1/auth/audit\` transaction endpoint</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span><strong>Encrypted Audit Log Database</strong>: Zero-knowledge hash ledger verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Deep Technical Inspector for Selected Node */}
        <div className="lg:col-span-5 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedNode === 'portal' && 'Web Portal Specifications'}
                {selectedNode === 'native' && 'Native Android Implementation'}
                {selectedNode === 'backend' && 'Spring Boot REST & Hash Verification'}
              </h4>
            </div>
            <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
              Verified Production Spec
            </span>
          </div>

          {selectedNode === 'portal' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p>
                The Web Portal serves as the primary distribution hub and real-time simulator. It bundles multi-platform native binaries on demand.
              </p>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto">
                <div className="text-teal-400 font-semibold">// Client Delivery Bundles</div>
                <div>• Android: ClipboardShield-v1.4.0.apk (Signed)</div>
                <div>• Source: ClipboardShield-Android-Source.zip</div>
                <div>• Windows: PowerShell / Batch Daemon Setup</div>
                <div>• iOS: Apple WebClip & Configuration Profile</div>
              </div>
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero telemetry, zero external trackers, instant client compilation.</span>
              </div>
            </div>
          )}

          {selectedNode === 'native' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Uses Android's <code className="text-teal-600 dark:text-teal-400">NotificationListenerService</code> to inspect status bar events without root privileges:
              </p>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                <div className="text-teal-400">// NotificationService.java</div>
                <pre>{`if (text.contains("debited") || 
    text.contains("credited") || 
    text.contains("OTP") || 
    text.contains("₹")) {
    Intent dialogIntent = new Intent(this, 
        FloatingOverlayActivity.class);
    dialogIntent.addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK);
    dialogIntent.putExtra("ALERT_MSG", text);
    startActivity(dialogIntent);
}`}</pre>
              </div>
              <p className="text-[11px]">
                Requires <code className="text-teal-600 dark:text-teal-400">SYSTEM_ALERT_WINDOW</code> permission so the prompt floats seamlessly over banking apps.
              </p>
            </div>
          )}

          {selectedNode === 'backend' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Spring Boot REST controller receives authorization events and persists cryptographic audit logs:
              </p>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                <div className="text-teal-400">// Spring Boot REST Controller</div>
                <pre>{`@PostMapping("/audit")
public ResponseEntity<Map<String, Object>> logAudit(
    @RequestBody Map<String, Object> payload) {
    String hash = computeSha256(
        payload.get("action") + ":" + 
        payload.get("alertMsg") + ":" + 
        System.currentTimeMillis()
    );
    auditDatabase.put(hash, payload);
    return ResponseEntity.ok(Map.of(
        "status", "SUCCESS",
        "auditHash", hash
    ));
}`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
