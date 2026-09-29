import React from 'react';
import { X, Mic2, Sparkles, Layers, Sliders, CheckCircle2, Shield } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">How Voice Cloning Works</h3>
            <p className="text-xs text-slate-400">
              The science of 30-second acoustic DNA extraction &amp; speech synthesis
            </p>
          </div>
        </div>

        {/* 4 Pipeline Steps */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">30-Second Voice Sampling</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Record directly from your microphone or upload any audio file (WAV, MP3, M4A).
                Our system caps the input at 30 seconds, which is the mathematically optimal duration
                to capture phonetic variety without unnecessary processing latency.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Acoustic DNA Profiling</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Gemini 3.8 Flash listens to the audio to extract fundamental pitch (F0 in Hz),
                speaking pace (WPM), formant resonances (warmth vs. brightness), breathiness, vocal
                fry, and accent markers. It matches the closest acoustic anchor model (Puck, Charon,
                Kore, Fenrir, Zephyr).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Script-to-Speech Synthesis</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Give the cloned persona any script! Gemini 3.8 Flash Audio generates broadcast-quality
                24kHz audio mimicking their intonation, pacing, and accent. You can also insert expressive
                nuances like <code className="text-indigo-300 font-mono">&lt;breath&gt;</code>,{' '}
                <code className="text-indigo-300 font-mono">&lt;laugh&gt;</code>, or{' '}
                <code className="text-indigo-300 font-mono">|yeah|</code>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">A/B Verification &amp; Studio EQ</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Toggle side-by-side between the original sample and the cloned generation to inspect
                similarity. Fine-tune parametric EQ (Bass, Mid, Treble) and download studio-ready WAV
                files with a single click.
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tips Box */}
        <div className="mt-6 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Pro Tips for Best Voice Quality</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>Speak naturally as if talking to a friend; avoid monotone reading.</li>
            <li>A 10–25 second recording gives the highest acoustic fidelity.</li>
            <li>Record in a quiet room with minimal background reverberation.</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
        >
          Got it, Let's Clone Voices
        </button>
      </div>
    </div>
  );
};
