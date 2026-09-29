/**
 * Web Audio API and Audio Processing Engine for VoiceClone Studio
 */

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  public audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | HTMLMediaElement | null = null;

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setupDspChain(audioElement: HTMLAudioElement, dspSettings?: {
    eqBassGain?: number;
    eqMidGain?: number;
    eqTrebleGain?: number;
  }): AnalyserNode {
    const ctx = this.getAudioContext();

    // Check if media element already has a source
    let sourceNode: MediaElementAudioSourceNode;
    if ((audioElement as any)._audioSourceNode) {
      sourceNode = (audioElement as any)._audioSourceNode;
    } else {
      sourceNode = ctx.createMediaElementSource(audioElement);
      (audioElement as any)._audioSourceNode = sourceNode;
    }

    // Filters
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 250;
    this.bassFilter.gain.value = dspSettings?.eqBassGain ?? 1.5;

    this.midFilter = ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 2200;
    this.midFilter.Q.value = 1.0;
    this.midFilter.gain.value = dspSettings?.eqMidGain ?? 0;

    this.trebleFilter = ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 6500;
    this.trebleFilter.gain.value = dspSettings?.eqTrebleGain ?? 1.0;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Disconnect old if any
    try {
      sourceNode.disconnect();
    } catch {}

    // Chain: source -> bass -> mid -> treble -> gain -> analyser -> destination
    sourceNode.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    return this.analyser;
  }

  public updateDsp(eqBassGain: number, eqMidGain: number, eqTrebleGain: number) {
    if (this.bassFilter) this.bassFilter.gain.value = eqBassGain;
    if (this.midFilter) this.midFilter.gain.value = eqMidGain;
    if (this.trebleFilter) this.trebleFilter.gain.value = eqTrebleGain;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}

/**
 * Convert base64 data to playable Object URL (WAV)
 */
export function base64ToAudioUrl(base64Data: string, mimeType = 'audio/wav'): string {
  const clean = base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
  const byteCharacters = atob(clean);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Convert Blob or File to Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate synthetic spoken waveform preview for presets
 */
export function generateSyntheticPreviewWav(basePitchHz: number, durationSec: number = 8): string {
  const sampleRate = 24000;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  // data chunk identifier
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate pleasant harmonic voiced vowels with rhythm
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Cadence amplitude envelope mimicking syllables
    const syllableEnv = 0.5 + 0.5 * Math.sin(t * 14) * Math.sin(t * 4);
    // Pause intervals
    const pauseEnv = Math.sin(t * 1.5) > -0.3 ? 1 : 0.05;

    // Pitch contour variation
    const pitch = basePitchHz + 15 * Math.sin(t * 3) + 8 * Math.cos(t * 7);

    // Formants / harmonics
    const h1 = Math.sin(2 * Math.PI * pitch * t);
    const h2 = 0.5 * Math.sin(2 * Math.PI * pitch * 2 * t);
    const h3 = 0.25 * Math.sin(2 * Math.PI * pitch * 3 * t);
    const h4 = 0.12 * Math.sin(2 * Math.PI * pitch * 4 * t);

    const sample = (h1 + h2 + h3 + h4) * 0.3 * syllableEnv * pauseEnv;
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
