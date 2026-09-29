import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Timer,
  Zap,
} from 'lucide-react';
import { VoiceProfile } from '../types/voice';
import { PRESET_VOICES } from '../constants/presets';
import { blobToBase64, generateSyntheticPreviewWav } from '../utils/audioProcessor';
import confetti from 'canvas-confetti';

interface VoiceSamplerProps {
  onVoiceCloned: (profile: VoiceProfile) => void;
  activeVoice: VoiceProfile | null;
}

export const VoiceSampler: React.FC<VoiceSamplerProps> = ({
  onVoiceCloned,
  activeVoice,
}) => {
  const [sourceMode, setSourceMode] = useState<'record' | 'upload' | 'presets'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceName, setVoiceName] = useState('');
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const [sampleBase64, setSampleBase64] = useState<string | null>(null);
  const [sampleMime, setSampleMime] = useState<string>('audio/webm');
  const [sampleDuration, setSampleDuration] = useState<number>(0);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStep, setCloneStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio playback for preview
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Preset audio previews
  const [previewingPresetId, setPreviewingPresetId] = useState<string | null>(null);
  const presetAudioMapRef = useRef<Record<string, HTMLAudioElement>>({});

  // Clean up
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update canvas during recording
  const startCanvasVisualizer = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient color for audio wave
        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#06b6d4');

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    draw();
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setSampleAudioUrl(url);
        setSampleMime(mimeType);

        const base64 = await blobToBase64(audioBlob);
        setSampleBase64(base64);

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);

      startCanvasVisualizer(stream);

      // Start 30-second cap timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 29) {
            // Cap at 30 seconds!
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage(
        'Could not access microphone. Please grant browser permissions or use file upload.'
      );
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Read duration and audio data
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);

    audio.onloadedmetadata = async () => {
      const dur = audio.duration;
      setSampleDuration(Math.min(30, dur));

      if (dur > 30) {
        setErrorMessage(
          `Audio sample is ${Math.round(dur)}s long. For voice cloning, the first 30 seconds will be used for optimal accuracy.`
        );
      }

      setSampleAudioUrl(url);
      setSampleMime(file.type || 'audio/mp3');
      const base64 = await blobToBase64(file);
      setSampleBase64(base64);

      if (!voiceName) {
        // Strip extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setVoiceName(cleanName);
      }
    };

    audio.onerror = () => {
      setErrorMessage('Could not decode audio file. Please upload WAV, MP3, M4A, or WEBM.');
    };
  };

  // Toggle sample playback
  const togglePlaySample = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Reset sample
  const handleResetSample = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setSampleAudioUrl(null);
    setSampleBase64(null);
    setRecordSeconds(0);
    setIsPlayingPreview(false);
    setErrorMessage(null);
  };

  // Clone Voice Request
  const handleCloneVoice = async () => {
    if (!sampleBase64) {
      setErrorMessage('Please record or upload a voice sample (up to 30s) first.');
      return;
    }

    try {
      setIsCloning(true);
      setErrorMessage(null);
      setCloneStep('Uploading voice sample & extracting acoustic signals...');

      const stepTimeout1 = setTimeout(() => {
        setCloneStep('Analyzing vocal tract length, pitch contour (F0), and timbre...');
      }, 1500);

      const stepTimeout2 = setTimeout(() => {
        setCloneStep('Matching anchor phonetic voice & generating biometric DNA...');
      }, 3500);

      const res = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: sampleBase64,
          mimeType: sampleMime,
          voiceName: voiceName.trim() || 'My Cloned Voice',
          duration: sampleDuration || recordSeconds || 15,
        }),
      });

      clearTimeout(stepTimeout1);
      clearTimeout(stepTimeout2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to clone voice.');
      }

      // Preserve sample audio url in profile for instant playback
      const finalProfile: VoiceProfile = {
        ...data.profile,
        sampleAudioUrl: sampleAudioUrl || undefined,
      };

      // Trigger celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      onVoiceCloned(finalProfile);
    } catch (err: any) {
      console.error('Clone error:', err);
      setErrorMessage(err.message || 'Failed to clone voice. Please try speaking clearly.');
    } finally {
      setIsCloning(false);
      setCloneStep('');
    }
  };

  // Preset voice selection
  const handleSelectPreset = (preset: VoiceProfile) => {
    // Generate synthetic audio for preset if needed
    if (!preset.sampleAudioUrl) {
      const syntheticUrl = generateSyntheticPreviewWav(preset.metrics.f0Hz, 8);
      preset.sampleAudioUrl = syntheticUrl;
    }
    onVoiceCloned(preset);
  };

  // Preset preview toggle
  const togglePresetPreview = (preset: VoiceProfile) => {
    let audio = presetAudioMapRef.current[preset.id];
    if (!audio) {
      const url = preset.sampleAudioUrl || generateSyntheticPreviewWav(preset.metrics.f0Hz, 8);
      audio = new Audio(url);
      presetAudioMapRef.current[preset.id] = audio;
      audio.onended = () => setPreviewingPresetId(null);
    }

    if (previewingPresetId === preset.id) {
      audio.pause();
      setPreviewingPresetId(null);
    } else {
      // Pause others
      Object.values(presetAudioMapRef.current).forEach((a) => a.pause());
      audio.currentTime = 0;
      audio.play();
      setPreviewingPresetId(preset.id);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
              1
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Voice Sampling &amp; Cloning
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provide up to <span className="text-indigo-400 font-semibold">30 seconds</span> of speech.
            Our acoustic AI extracts the speaker's vocal resonance, cadence, and timbre.
          </p>
        </div>

        {/* Input Method Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSourceMode('record')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sourceMode === 'record'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Mic</span>
          </button>

          <button
            onClick={() => setSourceMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sourceMode === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => setSourceMode('presets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sourceMode === 'presets'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Famous Voices</span>
          </button>
        </div>
      </div>

      {/* Mode Content */}
      <div className="mt-5">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* 1. MIC RECORDING MODE */}
        {sourceMode === 'record' && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col items-center justify-center min-h-[220px]">
              {/* Background 30s Visual Indicator */}
              <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>30s Voice Window</span>
                </span>
                <span className="font-mono text-slate-300 font-semibold">
                  {recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}s / 30s
                </span>
              </div>

              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${(recordSeconds / 30) * 100}%` }}
                />
              </div>

              {/* Waveform Canvas */}
              <canvas
                ref={canvasRef}
                width={360}
                height={60}
                className={`w-full max-w-sm h-14 mb-3 transition-opacity ${
                  isRecording ? 'opacity-100' : 'opacity-20'
                }`}
              />

              {/* Action Buttons */}
              {!isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={startRecording}
                    className="relative group p-4 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Mic className="w-7 h-7" />
                    <span className="absolute -inset-1 rounded-full bg-rose-500/20 animate-ping -z-10 group-hover:block" />
                  </button>
                  <p className="text-xs text-slate-400 mt-1">
                    Click to start recording your voice sample
                  </p>
                  <p className="text-[11px] text-slate-400">
                    💡 Tip: Speak continuously for 10–25 seconds for the best clone quality
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 text-white font-semibold text-sm shadow-lg shadow-rose-600/40 hover:bg-rose-500 transition-all animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording ({recordSeconds}s)</span>
                  </button>
                  <p className="text-xs text-indigo-300">
                    Capturing acoustic harmonics and phonemes...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. FILE UPLOAD MODE */}
        {sourceMode === 'upload' && (
          <div className="space-y-4">
            <label className="relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-950/80 cursor-pointer transition-all group">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center mb-3 transition-colors">
                <FileAudio className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                Choose an audio sample file
              </span>
              <span className="text-xs text-slate-400 mt-1">
                WAV, MP3, M4A, OGG, or WEBM (up to 30s)
              </span>
              <span className="text-[11px] text-indigo-400/80 mt-2 bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-800/40">
                Max 30s analyzed automatically
              </span>
            </label>
          </div>
        )}

        {/* 3. FAMOUS PRESETS MODE */}
        {sourceMode === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Don't have a mic or file handy? Test instant voice cloning with these pre-calibrated voice profiles:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESET_VOICES.map((preset) => {
                const isSelected = activeVoice?.id === preset.id;
                const isPlaying = previewingPresetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {preset.name}
                        </h4>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {preset.anchorVoice}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300 mt-1">{preset.accent}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 italic">
                        "{preset.sampleTranscription}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => togglePresetPreview(preset)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3 text-amber-400" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-emerald-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSelectPreset(preset)}
                        className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Clone Voice'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REVIEW & CLONE SECTION FOR RECORDED OR UPLOADED AUDIO */}
        {sampleAudioUrl && sourceMode !== 'presets' && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Voice Sample Ready
                </span>
                <span className="text-xs text-slate-400">
                  (~{sampleDuration ? Math.round(sampleDuration) : recordSeconds}s)
                </span>
              </div>

              <button
                onClick={handleResetSample}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Re-record</span>
              </button>
            </div>

            {/* Hidden HTML audio element for sample playback */}
            <audio
              ref={previewAudioRef}
              src={sampleAudioUrl}
              onEnded={() => setIsPlayingPreview(false)}
            />

            {/* Play sample bar */}
            <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <button
                onClick={togglePlaySample}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-colors"
              >
                {isPlayingPreview ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <div className="text-xs font-medium text-slate-200">
                  {isPlayingPreview ? 'Playing voice sample...' : 'Review recorded audio sample'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Listen to verify clarity and background noise
                </div>
              </div>
            </div>

            {/* Voice Name Input */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Voice Label / Person Name:
              </label>
              <input
                type="text"
                placeholder="e.g. My Voice, Elon, Morgan, Sarah..."
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Clone Button */}
            <button
              onClick={handleCloneVoice}
              disabled={isCloning}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isCloning
                  ? 'bg-indigo-900/60 text-indigo-300 cursor-not-allowed border border-indigo-700/50'
                  : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:scale-[0.99]'
              }`}
            >
              {isCloning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>{cloneStep || 'Cloning Voice...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Clone This Voice with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
