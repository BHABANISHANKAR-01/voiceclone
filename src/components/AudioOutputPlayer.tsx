import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sliders,
  ArrowLeftRight,
  Share2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { GeneratedSpeech, VoiceProfile } from '../types/voice';
import { base64ToAudioUrl, AudioEngine } from '../utils/audioProcessor';

interface AudioOutputPlayerProps {
  speech: GeneratedSpeech | null;
  activeVoice: VoiceProfile | null;
  onOpenCompareTab?: () => void;
}

export const AudioOutputPlayer: React.FC<AudioOutputPlayerProps> = ({
  speech,
  activeVoice,
  onOpenCompareTab,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  // A/B Comparison within player
  const [abMode, setAbMode] = useState<'clone' | 'reference'>('clone');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio URLs
  const cloneAudioUrl = speech ? base64ToAudioUrl(speech.audioBase64, speech.mimeType) : null;
  const referenceAudioUrl = activeVoice?.sampleAudioUrl || null;

  // Active audio URL based on A/B mode
  const currentAudioUrl = abMode === 'clone' ? cloneAudioUrl : referenceAudioUrl || cloneAudioUrl;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update audio source when speech or A/B changes
  useEffect(() => {
    if (audioRef.current && currentAudioUrl) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.src = currentAudioUrl;
      audioRef.current.playbackRate = playbackRate;
      setCurrentTime(0);
    }
  }, [speech?.id, abMode, currentAudioUrl]);

  // Canvas visualizer loop
  const startVisualizer = () => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const engine = AudioEngine.getInstance();
    const analyser = engine.setupDspChain(audio, {
      eqBassGain: activeVoice?.dsp?.eqBassGain,
      eqMidGain: activeVoice?.dsp?.eqMidGain,
      eqTrebleGain: activeVoice?.dsp?.eqTrebleGain,
    });

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stylized studio spectrum
      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255;
        const barHeight = value * (canvas.height - 4);

        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
        if (abMode === 'clone') {
          gradient.addColorStop(0, '#6366f1'); // Indigo
          gradient.addColorStop(0.5, '#a855f7'); // Purple
          gradient.addColorStop(1, '#06b6d4'); // Cyan
        } else {
          gradient.addColorStop(0, '#10b981'); // Emerald for reference
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#3b82f6');
        }

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    render();
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          startVisualizer();
        })
        .catch((err) => console.error('Playback error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = parseFloat(e.target.value);
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const handleDownload = () => {
    if (!currentAudioUrl) return;
    const link = document.createElement('a');
    link.href = currentAudioUrl;
    link.download = `${(speech?.voiceName || 'voice').replace(/\s+/g, '_')}_${abMode}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyScript = () => {
    if (!speech?.script) return;
    navigator.clipboard.writeText(speech.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!speech) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">
          Generated Speech Player
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Write a script above and click "Speak Script" to synthesize audio in your cloned voice.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => {
          setIsPlaying(false);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        }}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {abMode === 'clone' ? `Synthesized: ${speech.voiceName}` : `Original Sample: ${activeVoice?.name || speech.voiceName}`}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              WAV 24kHz
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice Anchor: <strong className="text-slate-200">{speech.anchorVoice}</strong> • Mode:{' '}
            <span className="text-cyan-300 capitalize">{abMode === 'clone' ? speech.emotion : 'Reference Audio'}</span>
          </p>
        </div>

        {/* Instant A/B Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setAbMode('clone')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              abMode === 'clone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Cloned Speech</span>
          </button>

          <button
            onClick={() => setAbMode('reference')}
            disabled={!referenceAudioUrl}
            title={!referenceAudioUrl ? 'No original voice sample found' : 'Listen to original 30s sample'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              !referenceAudioUrl
                ? 'opacity-40 cursor-not-allowed text-slate-600'
                : abMode === 'reference'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Original 30s Sample</span>
          </button>
        </div>
      </div>

      {/* Real-time Spectrum Waveform Canvas */}
      <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800/90 h-24 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-full object-cover"
        />

        {/* Watermark in canvas */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px] pointer-events-none text-xs text-slate-400 gap-1.5">
            <Play className="w-3.5 h-3.5 text-indigo-400" />
            <span>Press play to start acoustic visualization</span>
          </div>
        )}
      </div>

      {/* Scrub bar & Time */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full cursor-pointer"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Playback Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play / Pause / Replay */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono text-slate-400">
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setPlaybackRate(rate);
                  if (audioRef.current) audioRef.current.playbackRate = rate;
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  playbackRate === rate ? 'bg-indigo-600 text-white font-semibold' : 'hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Download & Copy Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyScript}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .WAV</span>
          </button>
        </div>
      </div>

      {/* Spoken Script Snippet Box */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
          Spoken Script:
        </span>
        "{speech.script}"
      </div>
    </div>
  );
};
