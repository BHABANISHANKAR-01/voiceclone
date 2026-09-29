import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  Sparkles,
  Volume2,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  Edit2,
  Music,
} from 'lucide-react';
import { VoiceProfile } from '../types/voice';

interface AcousticProfileCardProps {
  profile: VoiceProfile;
  onSelectSuggestion?: (script: string) => void;
  onUpdateDsp?: (dsp: VoiceProfile['dsp']) => void;
}

export const AcousticProfileCard: React.FC<AcousticProfileCardProps> = ({
  profile,
  onSelectSuggestion,
  onUpdateDsp,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bassGain, setBassGain] = useState(profile.dsp?.eqBassGain ?? 1.5);
  const [midGain, setMidGain] = useState(profile.dsp?.eqMidGain ?? 0);
  const [trebleGain, setTrebleGain] = useState(profile.dsp?.eqTrebleGain ?? 1.0);

  const handleDspChange = (newBass: number, newMid: number, newTreble: number) => {
    setBassGain(newBass);
    setMidGain(newMid);
    setTrebleGain(newTreble);
    if (onUpdateDsp) {
      onUpdateDsp({
        ...profile.dsp,
        eqBassGain: newBass,
        eqMidGain: newMid,
        eqTrebleGain: newTreble,
      });
    }
  };

  const { metrics } = profile;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Title & Anchor Voice Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/30">
              ✓
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Acoustic DNA: {profile.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Biometric analysis extracted from {profile.sampleDuration}s audio sample
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Anchor Model:</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            {profile.anchorVoice}
          </span>
        </div>
      </div>

      {/* Transcription snippet if available */}
      {profile.sampleTranscription && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample Audio Transcription</span>
          </div>
          <p className="text-xs text-slate-300 italic">
            "{profile.sampleTranscription}"
          </p>
        </div>
      )}

      {/* Acoustic Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pitch F0 */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Pitch Frequency</div>
          <div className="text-base font-bold text-cyan-400 mt-0.5">
            {Math.round(metrics.f0Hz)} Hz
          </div>
          <div className="text-[10px] text-slate-500 capitalize">
            {metrics.vocalRegister} register
          </div>
        </div>

        {/* Cadence / WPM */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Speaking Pace</div>
          <div className="text-base font-bold text-indigo-400 mt-0.5">
            {metrics.wordsPerMinute} WPM
          </div>
          <div className="text-[10px] text-slate-500">
            {metrics.wordsPerMinute > 150 ? 'Brisk / Fast' : metrics.wordsPerMinute < 125 ? 'Deliberate / Slow' : 'Moderate'}
          </div>
        </div>

        {/* Accent / Dialect */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Accent / Dialect</div>
          <div className="text-xs font-bold text-violet-300 mt-1 truncate">
            {profile.accent}
          </div>
          <div className="text-[10px] text-slate-500 capitalize">
            {profile.gender} • {profile.ageGroup}
          </div>
        </div>

        {/* Emotional Tone */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Vocal Persona</div>
          <div className="text-xs font-bold text-emerald-400 mt-1 truncate">
            {profile.emotionalTone}
          </div>
          <div className="text-[10px] text-slate-500">
            Baseline emotion
          </div>
        </div>
      </div>

      {/* Acoustic Timbre Bars */}
      <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-2">
          <span>Harmonic &amp; Timbre Signature</span>
          <span className="text-[10px] text-slate-500 font-mono">Normalized 0-100</span>
        </div>

        {/* Warmth */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Vocal Warmth / Chest Resonance</span>
            <span className="font-mono text-slate-300">{metrics.warmth}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${metrics.warmth}%` }}
            />
          </div>
        </div>

        {/* Resonance */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Acoustic Projection &amp; Presence</span>
            <span className="font-mono text-slate-300">{metrics.resonance}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${metrics.resonance}%` }}
            />
          </div>
        </div>

        {/* Clarity */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Enunciation Clarity</span>
            <span className="font-mono text-slate-300">{metrics.clarity}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${metrics.clarity}%` }}
            />
          </div>
        </div>

        {/* Breathiness & Raspiness */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Breathiness</span>
              <span className="font-mono text-slate-300">{metrics.breathiness}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${metrics.breathiness}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Raspiness / Fry</span>
              <span className="font-mono text-slate-300">{metrics.raspiness}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-400 rounded-full"
                style={{ width: `${metrics.raspiness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Script Suggestions */}
      {profile.sampleSuggestions && profile.sampleSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested Scripts for this Voice:</span>
          </div>
          <div className="space-y-1.5">
            {profile.sampleSuggestions.map((scriptText, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion && onSelectSuggestion(scriptText)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-start justify-between gap-2 group"
              >
                <span className="line-clamp-2 italic">"{scriptText}"</span>
                <span className="shrink-0 text-[10px] font-medium text-indigo-400 group-hover:underline">
                  Use this →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced EQ & DSP Drawer Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-medium transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide Studio EQ & Tuning' : 'Fine-Tune Studio EQ & Filters'}</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Bass EQ */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bass / Warmth:</span>
                  <span className="font-mono text-cyan-400">{bassGain > 0 ? `+${bassGain}` : bassGain} dB</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.5"
                  value={bassGain}
                  onChange={(e) =>
                    handleDspChange(parseFloat(e.target.value), midGain, trebleGain)
                  }
                  className="w-full"
                />
              </div>

              {/* Mid EQ */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Mid Presence:</span>
                  <span className="font-mono text-indigo-400">{midGain > 0 ? `+${midGain}` : midGain} dB</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.5"
                  value={midGain}
                  onChange={(e) =>
                    handleDspChange(bassGain, parseFloat(e.target.value), trebleGain)
                  }
                  className="w-full"
                />
              </div>

              {/* Treble EQ */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Highs / Air:</span>
                  <span className="font-mono text-violet-400">{trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.5"
                  value={trebleGain}
                  onChange={(e) =>
                    handleDspChange(bassGain, midGain, parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Generated Style Directive Prompt */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Gemini Style Prompt Directive:
              </span>
              <p className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 leading-relaxed select-all">
                {profile.styleDirective}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
