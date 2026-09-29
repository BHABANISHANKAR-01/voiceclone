import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceSampler } from './components/VoiceSampler';
import { AcousticProfileCard } from './components/AcousticProfileCard';
import { ScriptStudio } from './components/ScriptStudio';
import { AudioOutputPlayer } from './components/AudioOutputPlayer';
import { ABComparisonView } from './components/ABComparisonView';
import { VoiceLibrary } from './components/VoiceLibrary';
import { HelpModal } from './components/HelpModal';
import { VoiceProfile, GeneratedSpeech } from './types/voice';
import { PRESET_VOICES } from './constants/presets';
import { Mic2, AudioLines, ArrowRight, Sparkles, Layers, History, Volume2 } from 'lucide-react';

const STORAGE_KEY_VOICES = 'voiceclone_voices_v1';
const STORAGE_KEY_HISTORY = 'voiceclone_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'clone' | 'script' | 'compare' | 'library'>('clone');
  const [activeVoice, setActiveVoice] = useState<VoiceProfile | null>(null);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [latestSpeech, setLatestSpeech] = useState<GeneratedSpeech | null>(null);
  const [speechHistory, setSpeechHistory] = useState<GeneratedSpeech[]>([]);
  const [activeScript, setActiveScript] = useState<string>('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Initialize from LocalStorage or load default preset
  useEffect(() => {
    try {
      const savedVoices = localStorage.getItem(STORAGE_KEY_VOICES);
      if (savedVoices) {
        const parsed = JSON.parse(savedVoices);
        setVoices(parsed);
        if (parsed.length > 0) {
          setActiveVoice(parsed[0]);
        }
      }
      if (!savedVoices || JSON.parse(savedVoices).length === 0) {
        // Start with Sir David preset for instant out-of-the-box delight
        setActiveVoice(PRESET_VOICES[0]);
      }

      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        setSpeechHistory(parsedHist);
        if (parsedHist.length > 0) {
          setLatestSpeech(parsedHist[0]);
        }
      }
    } catch (e) {
      console.error('Error loading stored voices:', e);
      setActiveVoice(PRESET_VOICES[0]);
    }
  }, []);

  // Save custom voices to localStorage
  const saveVoices = (updatedVoices: VoiceProfile[]) => {
    setVoices(updatedVoices);
    try {
      localStorage.setItem(STORAGE_KEY_VOICES, JSON.stringify(updatedVoices));
    } catch (e) {
      console.warn('LocalStorage full, skipped caching voice sample audio');
    }
  };

  // Save history
  const saveHistory = (updatedHistory: GeneratedSpeech[]) => {
    setSpeechHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory.slice(0, 10)));
    } catch (e) {
      console.warn('LocalStorage full, skipped history');
    }
  };

  // Voice Cloned Callback
  const handleVoiceCloned = (profile: VoiceProfile) => {
    setActiveVoice(profile);
    if (!profile.isPreset) {
      const exists = voices.some((v) => v.id === profile.id);
      const nextList = exists
        ? voices.map((v) => (v.id === profile.id ? profile : v))
        : [profile, ...voices];
      saveVoices(nextList);
    }
  };

  // Speech Generated Callback
  const handleSpeechGenerated = (speech: GeneratedSpeech) => {
    setLatestSpeech(speech);
    const updated = [speech, ...speechHistory.filter((s) => s.id !== speech.id)].slice(0, 15);
    saveHistory(updated);
  };

  // Delete Voice
  const handleDeleteVoice = (id: string) => {
    const updated = voices.filter((v) => v.id !== id);
    saveVoices(updated);
    if (activeVoice?.id === id) {
      setActiveVoice(updated[0] || PRESET_VOICES[0]);
    }
  };

  // Use suggestion script
  const handleSelectSuggestion = (scriptText: string) => {
    setActiveScript(scriptText);
    setActiveTab('script');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeVoice={activeVoice}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        {/* Banner Quick Walkthrough */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/40 to-slate-900 border border-indigo-500/20 p-5 md:p-6 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Instant Voice Cloning
                </span>
                <span className="text-xs text-slate-400">
                  Powered by Gemini 3.8 Multimodal Audio &amp; TTS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Clone Any Human Voice in ≤ 30 Seconds
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Record or upload up to 30s of speech. Our AI analyzes pitch (F0), timbre, cadence, and
                accent to create a personalized acoustic clone ready to speak any script.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {activeTab === 'clone' && activeVoice && (
                <button
                  onClick={() => setActiveTab('script')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Ready to Speak Script</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {activeTab === 'script' && (
                <button
                  onClick={() => setActiveTab('clone')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                >
                  <Mic2 className="w-3.5 h-3.5" />
                  <span>Sample Another Voice</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TAB 1: CLONE VOICE STUDIO */}
        {activeTab === 'clone' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <VoiceSampler
                onVoiceCloned={handleVoiceCloned}
                activeVoice={activeVoice}
              />
            </div>

            <div className="lg:col-span-5">
              {activeVoice ? (
                <div className="space-y-4">
                  <AcousticProfileCard
                    profile={activeVoice}
                    onSelectSuggestion={handleSelectSuggestion}
                    onUpdateDsp={(newDsp) => {
                      if (activeVoice) {
                        const updated = { ...activeVoice, dsp: newDsp };
                        setActiveVoice(updated);
                        if (!updated.isPreset) {
                          saveVoices(voices.map((v) => (v.id === updated.id ? updated : v)));
                        }
                      }
                    }}
                  />

                  {/* Quick Action to proceed to Script Studio */}
                  <button
                    onClick={() => setActiveTab('script')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                  >
                    <span>Proceed to Step 2: Speak Script in {activeVoice.name} →</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                  <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                  <h4 className="text-sm font-semibold text-slate-400">
                    Acoustic DNA Waiting for Voice Sample
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Record your mic or select a famous voice to view its deep vocal resonance metrics.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SCRIPT STUDIO */}
        {activeTab === 'script' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <ScriptStudio
                activeVoice={activeVoice}
                onSpeechGenerated={handleSpeechGenerated}
                externalScript={activeScript}
              />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <AudioOutputPlayer
                speech={latestSpeech}
                activeVoice={activeVoice}
                onOpenCompareTab={() => setActiveTab('compare')}
              />

              {/* Recent Generation History */}
              {speechHistory.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Recent Generations ({speechHistory.length})</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {speechHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setLatestSpeech(item)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          latestSpeech?.id === item.id
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{item.voiceName}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            "{item.script}"
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400 shrink-0">
                          {item.durationEstimated}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: A/B COMPARISON VIEW */}
        {activeTab === 'compare' && (
          <ABComparisonView
            activeVoice={activeVoice}
            latestSpeech={latestSpeech}
          />
        )}

        {/* TAB 4: VOICE LIBRARY */}
        {activeTab === 'library' && (
          <VoiceLibrary
            voices={voices}
            activeVoice={activeVoice}
            onSelectVoice={(v) => {
              setActiveVoice(v);
              setActiveTab('script');
            }}
            onDeleteVoice={handleDeleteVoice}
            onNewCloneClick={() => setActiveTab('clone')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VoiceClone Studio</span>
            <span>•</span>
            <span>30-Second Acoustic DNA Voice Synthesis</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              How it works
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">Gemini 3.8 Flash Audio</span>
          </div>
        </div>
      </footer>

      {/* Educational Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
