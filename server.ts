import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini Client on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: Date.now(),
  });
});

// Clone voice route: Analyzes up to 30s audio sample
app.post('/api/voice/clone', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', voiceName, duration = 10 } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio sample data is required for voice cloning.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing on the server. Please check Settings > Secrets.',
      });
    }

    // Clean base64 string
    const cleanBase64 = audioBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    // Standardize mime type for Gemini
    let validMime = mimeType;
    if (mimeType.includes('webm')) validMime = 'audio/webm';
    else if (mimeType.includes('wav')) validMime = 'audio/wav';
    else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) validMime = 'audio/mp3';
    else if (mimeType.includes('ogg')) validMime = 'audio/ogg';
    else if (mimeType.includes('m4a') || mimeType.includes('mp4')) validMime = 'audio/mp4';

    const systemInstruction = `You are a world-class acoustic scientist, phonetician, and voice biometric engineer.
Your task is to analyze an audio sample (up to 30 seconds) of a human voice, extract its detailed Acoustic DNA, and construct an exact voice cloning profile.

Available prebuilt anchor voices for speech synthesis:
- "Puck": youthful, dynamic, playful, higher-pitch male / expressive neutral.
- "Charon": calm, mature, deep, measured, reassuring baritone/bass male.
- "Kore": warm, resonant, natural, clear, balanced female / feminine register.
- "Fenrir": deep, authoritative, gravelly, powerful low-register baritone/bass male.
- "Zephyr": crisp, articulate, modern, bright neutral / alto female.

Select the SINGLE closest anchor voice that best matches the speaker's vocal tract length, pitch baseline, and resonant frequencies.
Then craft a detailed 'styleDirective' prompt that describes their exact vocal delivery, accent, pitch inflection, vocal fry, raspiness, breathiness, and emotional undertone so that Gemini TTS can replicate this person's voice faithfully.
Also transcribe verbatim what the speaker said in this sample.`;

    const promptText = `Analyze this audio sample of a speaker (approximately ${Math.round(duration)} seconds).
Speaker label or suggested name: "${voiceName || 'Custom Speaker'}".
Extract the voice's complete acoustic profile and speech characteristics.`;

    const audioPart = {
      inlineData: {
        data: cleanBase64,
        mimeType: validMime,
      },
    };

    const textPart = { text: promptText };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Display name for this cloned voice' },
            gender: {
              type: Type.STRING,
              description: 'male, female, or neutral',
            },
            ageGroup: {
              type: Type.STRING,
              description: 'e.g., young adult, middle-aged, mature, youth',
            },
            vocalRegister: {
              type: Type.STRING,
              description: 'e.g., bass, baritone, tenor, alto, soprano',
            },
            accent: {
              type: Type.STRING,
              description: 'e.g., General American, British RP, Australian, Southern US, Indian English, etc.',
            },
            emotionalTone: {
              type: Type.STRING,
              description: 'Dominant emotional baseline, e.g. Warm and authoritative, casual and lively, etc.',
            },
            anchorVoice: {
              type: Type.STRING,
              description: 'Must be one of: Puck, Charon, Kore, Fenrir, Zephyr',
            },
            styleDirective: {
              type: Type.STRING,
              description: 'Comprehensive acoustic direction prompt for TTS synthesis replicating this exact speaker tone, cadence, timbre, and accent.',
            },
            sampleTranscription: {
              type: Type.STRING,
              description: 'Verbatim transcription of the spoken words in the audio sample.',
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                f0Hz: { type: Type.NUMBER, description: 'Estimated fundamental pitch frequency in Hz (80-350)' },
                pitchMinHz: { type: Type.NUMBER, description: 'Lowest pitch frequency in Hz' },
                pitchMaxHz: { type: Type.NUMBER, description: 'Highest pitch frequency in Hz' },
                vocalRegister: { type: Type.STRING, description: 'Register name' },
                warmth: { type: Type.NUMBER, description: 'Vocal warmth score 0 to 100' },
                breathiness: { type: Type.NUMBER, description: 'Airflow breathiness score 0 to 100' },
                raspiness: { type: Type.NUMBER, description: 'Vocal fry or gravel score 0 to 100' },
                resonance: { type: Type.NUMBER, description: 'Chest vs head resonance 0 to 100' },
                clarity: { type: Type.NUMBER, description: 'Enunciation clarity score 0 to 100' },
                wordsPerMinute: { type: Type.NUMBER, description: 'Estimated speaking tempo WPM' },
                dynamicRange: { type: Type.STRING, description: 'Dynamic volume variability description' },
              },
              required: ['f0Hz', 'vocalRegister', 'warmth', 'breathiness', 'raspiness', 'resonance', 'clarity', 'wordsPerMinute'],
            },
            dsp: {
              type: Type.OBJECT,
              properties: {
                pitchShiftSemi: { type: Type.NUMBER, description: 'Pitch adjustment in semitones (-6 to +6)' },
                eqBassGain: { type: Type.NUMBER, description: 'Low shelf EQ boost/cut in dB (-10 to +10)' },
                eqMidGain: { type: Type.NUMBER, description: 'Mid presence EQ boost/cut in dB (-10 to +10)' },
                eqTrebleGain: { type: Type.NUMBER, description: 'High air EQ boost/cut in dB (-10 to +10)' },
                reverbAmount: { type: Type.NUMBER, description: 'Room ambience 0.0 to 0.4' },
                tempoRatio: { type: Type.NUMBER, description: 'Playback speed ratio 0.85 to 1.25' },
              },
              required: ['pitchShiftSemi', 'eqBassGain', 'eqMidGain', 'eqTrebleGain', 'reverbAmount', 'tempoRatio'],
            },
            sampleSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 sample script ideas tailored for this cloned persona to speak',
            },
          },
          required: [
            'name',
            'gender',
            'ageGroup',
            'vocalRegister',
            'accent',
            'emotionalTone',
            'anchorVoice',
            'styleDirective',
            'sampleTranscription',
            'metrics',
            'dsp',
            'sampleSuggestions',
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');

    // Valid anchor voice safeguard
    const allowedAnchors = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    let safeAnchor = parsedData.anchorVoice;
    if (!allowedAnchors.includes(safeAnchor)) {
      safeAnchor = parsedData.gender === 'female' ? 'Kore' : 'Charon';
    }

    const voiceProfile = {
      id: 'voice_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: voiceName || parsedData.name || 'Cloned Voice',
      createdAt: Date.now(),
      sampleAudioBase64: cleanBase64,
      sampleAudioMime: validMime,
      sampleDuration: duration,
      sampleTranscription: parsedData.sampleTranscription || '',
      gender: parsedData.gender || 'neutral',
      ageGroup: parsedData.ageGroup || 'adult',
      accent: parsedData.accent || 'Natural',
      emotionalTone: parsedData.emotionalTone || 'Conversational',
      anchorVoice: safeAnchor,
      styleDirective: parsedData.styleDirective || 'Clear, natural speaking voice matching the reference acoustic profile',
      metrics: {
        f0Hz: parsedData.metrics?.f0Hz || 150,
        pitchMinHz: parsedData.metrics?.pitchMinHz || 100,
        pitchMaxHz: parsedData.metrics?.pitchMaxHz || 220,
        vocalRegister: parsedData.metrics?.vocalRegister || parsedData.vocalRegister || 'Baritone',
        warmth: parsedData.metrics?.warmth ?? 70,
        breathiness: parsedData.metrics?.breathiness ?? 25,
        raspiness: parsedData.metrics?.raspiness ?? 15,
        resonance: parsedData.metrics?.resonance ?? 75,
        clarity: parsedData.metrics?.clarity ?? 85,
        wordsPerMinute: parsedData.metrics?.wordsPerMinute || 140,
        dynamicRange: parsedData.metrics?.dynamicRange || 'Balanced conversational range',
      },
      dsp: {
        pitchShiftSemi: parsedData.dsp?.pitchShiftSemi ?? 0,
        eqBassGain: parsedData.dsp?.eqBassGain ?? 1.5,
        eqMidGain: parsedData.dsp?.eqMidGain ?? 0,
        eqTrebleGain: parsedData.dsp?.eqTrebleGain ?? 1.0,
        reverbAmount: parsedData.dsp?.reverbAmount ?? 0.08,
        tempoRatio: parsedData.dsp?.tempoRatio ?? 1.0,
      },
      sampleSuggestions: parsedData.sampleSuggestions || [
        "Welcome to the team! I'm thrilled to have you here and can't wait to see what we build together.",
        "Breaking news: today's breakthrough demonstrates how AI voice synthesis can sound completely human.",
        "Hey everyone! Thanks for tuning in to today's episode. Before we dive into the topic, make sure to like and subscribe.",
      ],
    };

    res.json({ success: true, profile: voiceProfile });
  } catch (err: any) {
    console.error('Error in /api/voice/clone:', err);
    res.status(500).json({
      error: err.message || 'Failed to clone voice from sample. Please try again with clear speech.',
    });
  }
});

// Generate speech using cloned voice profile and script
app.post('/api/voice/generate', async (req, res) => {
  try {
    const { voiceProfile, script, emotion, speed = 1.0, pitchModifier = 0 } = req.body;

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'A script is required to generate speech.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing on the server. Please check Settings > Secrets.',
      });
    }

    const anchorVoice = voiceProfile?.anchorVoice || 'Kore';
    const baseStyle = voiceProfile?.styleDirective || 'Natural, warm, expressive human speaker';

    // Construct enriched style directive with emotion and acoustic guidance
    let fullStyleDirective = `${baseStyle}.`;
    if (emotion && emotion !== 'natural') {
      fullStyleDirective += ` Delivery emotion & tone: ${emotion}.`;
    }
    if (speed && speed !== 1.0) {
      fullStyleDirective += speed > 1.0 ? ' Speak with an energetic, brisk tempo.' : ' Speak with a measured, deliberate, steady tempo.';
    }
    fullStyleDirective += ' Sound completely authentic, human, and match the specified timbre and prosody.';

    // Call Gemini 3.8 Flash TTS
    let ttsResponse;
    try {
      ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: script.trim(),
                speechMetadata: {
                  style: fullStyleDirective,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: anchorVoice },
            },
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary TTS model attempt failed, falling back to gemini-3.8-flash-lite-tts:', primaryErr.message);
      // Fallback to flash-lite-tts
      ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: script.trim(),
                speechMetadata: {
                  style: fullStyleDirective,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: anchorVoice },
            },
          },
        },
      });
    }

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio content returned by the speech synthesis engine.');
    }

    // Rough estimate of duration: ~150 words per minute
    const wordCount = script.trim().split(/\s+/).length;
    const durationEstimated = Math.max(1, Math.round((wordCount / 150) * 60));

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      durationEstimated,
      anchorVoice,
      voiceName: voiceProfile?.name || 'Cloned Voice',
      createdAt: Date.now(),
    });
  } catch (err: any) {
    console.error('Error in /api/voice/generate:', err);
    res.status(500).json({
      error: err.message || 'Speech generation failed. Please check your script and try again.',
    });
  }
});

// Setup Vite dev server or production static files
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoiceClone Studio running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
