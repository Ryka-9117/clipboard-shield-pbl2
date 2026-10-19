import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Smartphone,
  Download,
  Shield,
  Layers
} from 'lucide-react';
import { oceanAudio } from '../utils/audio';

interface BottomControlDockProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  onQuickTestAlert: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  isDarkMode,
  onToggleDarkMode,
  isAudioActive,
  onToggleAudio,
  onQuickTestAlert,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const scrollTo = (id: string) => {
    oceanAudio.playBubble();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside
      aria-label="Scene Controls Dock"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-transform duration-300 max-w-[94vw] w-auto ${
        isCollapsed ? 'translate-y-[calc(100%-12px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab Button */}
      <div className="flex justify-center -mb-2">
        <button
          onClick={() => {
            oceanAudio.playBubble();
            setIsCollapsed(!isCollapsed);
          }}
          className="px-3 py-1 bg-slate-900/90 text-white rounded-t-lg text-[11px] font-medium border-t border-x border-slate-700/60 shadow-lg flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3 text-teal-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 text-teal-400" />
              <span>Ocean Zen Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="p-2 sm:p-2.5 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex items-center gap-1.5 sm:gap-3 text-xs">
        {/* Quick Test Alert trigger */}
        <button
          onClick={onQuickTestAlert}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-sm transition-all whitespace-nowrap"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Test Interception</span>
          <span className="sm:hidden">Test</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 my-auto"></div>

        {/* Section Jumps */}
        <button
          onClick={() => scrollTo('simulator-section')}
          className="px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-500" />
          <span className="hidden md:inline">Simulator</span>
        </button>

        <button
          onClick={() => scrollTo('architecture-section')}
          className="px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <Layers className="w-3.5 h-3.5 text-teal-500" />
          <span className="hidden md:inline">Architecture</span>
        </button>

        <button
          onClick={() => scrollTo('download-section')}
          className="px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5 text-teal-500" />
          <span className="hidden md:inline">Downloads (.APK)</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 my-auto"></div>

        {/* Sound toggle */}
        <button
          onClick={onToggleAudio}
          title={isAudioActive ? 'Mute underwater sound' : 'Unmute underwater sound'}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isAudioActive ? <Volume2 className="w-4 h-4 text-teal-500" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Light Ocean Mode' : 'Abyssal Dark Mode'}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
