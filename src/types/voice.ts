export interface AcousticMetrics {
  f0Hz: number;
  pitchMinHz: number;
  pitchMaxHz: number;
  vocalRegister: 'bass' | 'baritone' | 'tenor' | 'alto' | 'soprano' | string;
  warmth: number; // 0 - 100
  breathiness: number; // 0 - 100
  raspiness: number; // 0 - 100
  resonance: number; // 0 - 100
  clarity: number; // 0 - 100
  wordsPerMinute: number;
  dynamicRange: string;
}

export interface AcousticDsp {
  pitchShiftSemi: number;
  eqBassGain: number; // dB (-12 to +12)
  eqMidGain: number; // dB (-12 to +12)
  eqTrebleGain: number; // dB (-12 to +12)
  reverbAmount: number; // 0 - 1
  tempoRatio: number; // 0.8 - 1.3
}

export interface VoiceProfile {
  id: string;
  name: string;
  createdAt: number;
  sampleAudioBase64?: string;
  sampleAudioMime?: string;
  sampleAudioUrl?: string;
  sampleDuration: number; // seconds (max 30s)
  sampleTranscription?: string;
  gender: 'male' | 'female' | 'neutral';
  ageGroup: string;
  accent: string;
  emotionalTone: string;
  anchorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  styleDirective: string;
  metrics: AcousticMetrics;
  dsp: AcousticDsp;
  sampleSuggestions: string[];
  isPreset?: boolean;
}

export interface GeneratedSpeech {
  id: string;
  voiceId: string;
  voiceName: string;
  script: string;
  emotion: string;
  audioBase64: string;
  mimeType: string;
  audioUrl?: string;
  durationEstimated: number;
  createdAt: number;
  anchorVoice: string;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
  suggestedEmotion: string;
}
