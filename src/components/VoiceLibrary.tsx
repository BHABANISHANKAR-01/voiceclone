import React, { useState } from 'react';
import {
  Library,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  Plus,
  Sparkles,
  User,
  Clock,
  Mic2,
} from 'lucide-react';
import { VoiceProfile } from '../types/voice';
import { PRESET_VOICES } from '../constants/presets';

interface VoiceLibraryProps {
  voices: VoiceProfile[];
  activeVoice: VoiceProfile | null;
  onSelectVoice: (voice: VoiceProfile) => void;
  onDeleteVoice: (id: string) => void;
  onNewCloneClick: () => void;
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  voices,
  activeVoice,
  onSelectVoice,
  onDeleteVoice,
  onNewCloneClick,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'custom' | 'presets'>('custom');
  const audioMap = React.useRef<Record<string, HTMLAudioElement>>({});

  const togglePlayVoice = (voice: VoiceProfile) => {
    let audio = audioMap.current[voice.id];
    if (!audio) {
      if (!voice.sampleAudioUrl) return;
      audio = new Audio(voice.sampleAudioUrl);
      audioMap.current[voice.id] = audio;
      audio.onended = () => setPlayingId(null);
    }

    if (playingId === voice.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      Object.values(audioMap.current).forEach((a) => a.pause());
      audio.currentTime = 0;
      audio.play();
      setPlayingId(voice.id);
    }
  };

  const displayedVoices = activeTab === 'custom' ? voices : PRESET_VOICES;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cloned Voice Library
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and switch between saved cloned voices and calibrated presets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Filter */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'custom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Clones ({voices.length})
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Famous Presets ({PRESET_VOICES.length})
            </button>
          </div>

          <button
            onClick={onNewCloneClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Clone New Voice</span>
          </button>
        </div>
      </div>

      {/* Voice Cards Grid */}
      {displayedVoices.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Mic2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No Custom Voices Cloned Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Record or upload a voice sample in the <strong>Clone Voice</strong> tab, or explore our
            Famous Presets library.
          </p>
          <button
            onClick={onNewCloneClick}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Record Voice Sample Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedVoices.map((voice) => {
            const isSelected = activeVoice?.id === voice.id;
            const isPlaying = playingId === voice.id;

            return (
              <div
                key={voice.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{voice.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-indigo-300 mt-0.5">{voice.accent}</p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {voice.anchorVoice}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      Pitch:{' '}
                      <strong className="text-cyan-400">{Math.round(voice.metrics.f0Hz)} Hz</strong>
                    </div>
                    <div>
                      Pace: <strong className="text-indigo-300">{voice.metrics.wordsPerMinute} WPM</strong>
                    </div>
                    <div>
                      Register: <span className="capitalize">{voice.metrics.vocalRegister}</span>
                    </div>
                    <div>
                      Sample: <span>{voice.sampleDuration}s</span>
                    </div>
                  </div>

                  {voice.sampleTranscription && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 italic">
                      "{voice.sampleTranscription}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  {voice.sampleAudioUrl && (
                    <button
                      onClick={() => togglePlayVoice(voice)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Preview voice sample"
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => onSelectVoice(voice)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isSelected ? '✓ In Use' : 'Use This Voice'}
                  </button>

                  {!voice.isPreset && (
                    <button
                      onClick={() => onDeleteVoice(voice.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete cloned voice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
