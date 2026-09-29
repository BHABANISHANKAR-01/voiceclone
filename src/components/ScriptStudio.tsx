import React, { useState, useRef } from 'react';
import {
  AudioLines,
  Sparkles,
  Play,
  Volume2,
  FileText,
  Smile,
  Zap,
  Clock,
  ChevronDown,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { VoiceProfile, GeneratedSpeech } from '../types/voice';
import { SCRIPT_TEMPLATES } from '../constants/scriptTemplates';

interface ScriptStudioProps {
  activeVoice: VoiceProfile | null;
  onSpeechGenerated: (speech: GeneratedSpeech) => void;
  externalScript?: string;
}

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  activeVoice,
  onSpeechGenerated,
  externalScript,
}) => {
  const [script, setScript] = useState(
    externalScript ||
      "Welcome to VoiceClone Studio! With up to 30 seconds of speech, I can now speak any script you give me in their natural cadence, timbre, and accent. <breath> What should I say next? <laugh>"
  );
  const [emotion, setEmotion] = useState('natural');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Update script if external script prop changes
  React.useEffect(() => {
    if (externalScript) {
      setScript(externalScript);
    }
  }, [externalScript]);

  // Insert tag at cursor
  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setScript((prev) => prev + ' ' + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const updated = text.substring(0, start) + ' ' + tag + ' ' + text.substring(end);
    setScript(updated);

    // Reset cursor after tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 10);
  };

  // Word count & duration estimate
  const words = script.trim() ? script.trim().split(/\s+/).length : 0;
  const chars = script.length;
  // ~140 words per minute average speaking rate
  const estimatedSeconds = Math.max(1, Math.round((words / (140 * speed)) * 60));

  const handleGenerate = async () => {
    if (!activeVoice) {
      setErrorMessage('Please clone or select a voice first before generating speech.');
      return;
    }

    if (!script.trim()) {
      setErrorMessage('Please write or select a script for the cloned voice to speak.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceProfile: activeVoice,
          script: script.trim(),
          emotion: emotion === 'natural' ? undefined : emotion,
          speed,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Speech generation failed.');
      }

      const generated: GeneratedSpeech = {
        id: 'gen_' + Date.now(),
        voiceId: activeVoice.id,
        voiceName: activeVoice.name,
        script: script.trim(),
        emotion,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        durationEstimated: data.durationEstimated || estimatedSeconds,
        createdAt: Date.now(),
        anchorVoice: activeVoice.anchorVoice,
      };

      onSpeechGenerated(generated);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(
        err.message || 'Speech generation failed. Please try a different script or retry.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 font-bold text-xs border border-violet-500/30">
              2
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Script-to-Speech Studio
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Write any custom script and hear it spoken in{' '}
            <span className="text-white font-semibold">
              {activeVoice ? activeVoice.name : 'your cloned voice'}
            </span>
            .
          </p>
        </div>

        {/* Templates Selector */}
        <div className="relative self-start sm:self-auto">
          <select
            onChange={(e) => {
              const selected = SCRIPT_TEMPLATES.find((t) => t.id === e.target.value);
              if (selected) {
                setScript(selected.content);
                setEmotion(selected.suggestedEmotion);
              }
            }}
            defaultValue=""
            className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled>
              📋 Choose Script Template...
            </option>
            {SCRIPT_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.title} ({tmpl.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warning if no active voice */}
      {!activeVoice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong>No voice cloned yet!</strong> You can still type your script, but make sure to
            record a sample or choose a famous voice in Step 1 to synthesize in their voice.
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Script Textarea & Expressive Tag Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Script Content:</span>
          </label>

          {/* Expressive Tags Insertion Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 hidden md:inline">Insert Nuance:</span>
            <button
              type="button"
              onClick={() => insertTag('<breath>')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-400 text-[11px] border border-slate-700/60 transition-colors"
              title="Insert a natural breathing pause"
            >
              &lt;breath&gt;
            </button>
            <button
              type="button"
              onClick={() => insertTag('<laugh>')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-400 text-[11px] border border-slate-700/60 transition-colors"
              title="Insert light chuckle or laughter"
            >
              &lt;laugh&gt;
            </button>
            <button
              type="button"
              onClick={() => insertTag('<gasp>')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-400 text-[11px] border border-slate-700/60 transition-colors"
              title="Insert dramatic gasp"
            >
              &lt;gasp&gt;
            </button>
            <button
              type="button"
              onClick={() => insertTag('|yeah|')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-400 text-[11px] border border-slate-700/60 transition-colors"
              title="Conversational backchannel 'yeah'"
            >
              |yeah|
            </button>
            <button
              type="button"
              onClick={() => insertTag('|mhm|')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-400 text-[11px] border border-slate-700/60 transition-colors"
              title="Agreement backchannel 'mhm'"
            >
              |mhm|
            </button>
            <button
              type="button"
              onClick={() => insertTag('...')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-400 text-[11px] border border-slate-700/60 transition-colors"
              title="Dramatic pause"
            >
              ...
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={5}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Type or paste the words you want the cloned voice to speak..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
          />

          {/* Word / Char Counters */}
          <div className="absolute bottom-2.5 right-3 flex items-center gap-3 text-[11px] text-slate-500 font-mono pointer-events-none">
            <span>{chars} chars</span>
            <span>{words} words</span>
            <span className="flex items-center gap-1 text-slate-400 font-sans">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>~{estimatedSeconds}s audio</span>
            </span>
          </div>
        </div>
      </div>

      {/* Voice Delivery Controls: Emotion & Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Delivery Tone */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Delivery Emotion &amp; Tone:
          </label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="natural">Natural (Match reference voice perfectly)</option>
            <option value="Inspiring, energetic, confident visionary speaker">
              Inspiring &amp; Visionary
            </option>
            <option value="Dramatic, intense, suspenseful cinema trailer narrator">
              Dramatic &amp; Cinematic
            </option>
            <option value="Warm, captivating, gentle bedtime storyteller">
              Warm &amp; Storytelling
            </option>
            <option value="Enthusiastic, cheerful, fast-talking podcast host">
              Cheerful &amp; High-Energy
            </option>
            <option value="Calm, whispery, mindful, soothing meditation guide">
              Calm &amp; Whispery / ASMR
            </option>
            <option value="Crisp, authoritative, professional prime-time news anchor">
              Authoritative &amp; Serious
            </option>
          </select>
        </div>

        {/* Speed Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>Speaking Speed:</span>
            <span className="font-mono text-indigo-400">{speed}x</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-slate-400">0.8x</span>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-[11px] text-slate-400">1.3x</span>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !activeVoice}
        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          isGenerating
            ? 'bg-violet-950/80 text-violet-300 cursor-not-allowed border border-violet-800/50'
            : !activeVoice
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 active:scale-[0.99]'
        }`}
      >
        {isGenerating ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
            <span>Synthesizing Voice with Gemini 3.8 Audio...</span>
          </>
        ) : (
          <>
            <AudioLines className="w-4 h-4" />
            <span>
              Speak Script in {activeVoice ? activeVoice.name : 'Cloned Voice'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
