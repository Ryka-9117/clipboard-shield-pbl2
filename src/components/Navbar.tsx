import React from 'react';
import { Shield, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { oceanAudio } from '../utils/audio';

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  onToggleDarkMode,
  isAudioActive,
  onToggleAudio,
}) => {
  const scrollTo = (id: string) => {
    oceanAudio.playBubble();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/75 dark:bg-slate-950/75 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 fill-white/20" />
          </div>
          <span>Clipboard Shield</span>
        </a>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => scrollTo('simulator-section')}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0"
          >
            Live Simulator
          </button>
          <button
            onClick={() => scrollTo('architecture-section')}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0"
          >
            Architecture Flow
          </button>
          <button
            onClick={() => scrollTo('download-section')}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0"
          >
            Downloads
          </button>
          <button
            onClick={() => scrollTo('audit-section')}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0"
          >
            Audit Database
          </button>
          <button
            onClick={() => scrollTo('specs-section')}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0"
          >
            Tech Specs
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + toggles */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Audio Ambiance toggle */}
          <button
            onClick={onToggleAudio}
            aria-label="Toggle underwater audio ambiance"
            title={isAudioActive ? 'Mute underwater audio' : 'Play serene underwater ambiance'}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isAudioActive ? <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            title={isDarkMode ? 'Switch to serene shallow light ocean' : 'Switch to abyssal dark trench'}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => scrollTo('download-section')}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            Download App
          </button>
        </div>
      </div>
    </header>
  );
};
