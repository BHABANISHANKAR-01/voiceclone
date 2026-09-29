import React from 'react';
import { Mic2, Sparkles, Sliders, AudioLines, Library, ArrowLeftRight, HelpCircle } from 'lucide-react';
import { VoiceProfile } from '../types/voice';

interface HeaderProps {
  activeTab: 'clone' | 'script' | 'compare' | 'library';
  setActiveTab: (tab: 'clone' | 'script' | 'compare' | 'library') => void;
  activeVoice: VoiceProfile | null;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeVoice,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                VoiceClone
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Studio AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Clone any voice in ≤ 30s &amp; speak any script
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('clone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'clone'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>1. Clone Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'script'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AudioLines className="w-3.5 h-3.5" />
            <span>2. Speak Script</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'compare'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">A/B Compare</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Voices</span>
          </button>
        </nav>

        {/* Active Voice Pill & Help */}
        <div className="flex items-center gap-2">
          {activeVoice ? (
            <div
              onClick={() => setActiveTab('clone')}
              className="cursor-pointer flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 transition-all max-w-[170px] sm:max-w-xs"
              title="Click to view voice profile"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold truncate">{activeVoice.name}</span>
              <span className="text-[10px] text-indigo-400/80 bg-indigo-900/80 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                {activeVoice.anchorVoice}
              </span>
            </div>
          ) : (
            <div className="text-xs text-amber-400/90 bg-amber-950/40 border border-amber-600/30 px-2.5 py-1 rounded-lg hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>No voice cloned yet</span>
            </div>
          )}

          <button
            onClick={onOpenHelp}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="How Voice Cloning works"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
