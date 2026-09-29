import { ScriptTemplate } from '../types/voice';

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'keynote',
    title: 'Visionary Tech Keynote',
    category: 'Business & Tech',
    suggestedEmotion: 'Inspiring, confident, visionary keynote speaker',
    content:
      "Every once in a while, a revolutionary technology comes along that changes everything. Today, we're not just showing you another update. We are unlocking a brand new dimension of human voice and AI synthesis.",
  },
  {
    id: 'trailer',
    title: 'Epic Cinematic Movie Trailer',
    category: 'Entertainment',
    suggestedEmotion: 'Dramatic, intense, suspenseful cinema trailer narrator',
    content:
      'In a world where artificial intelligence can recreate any human voice in mere seconds... <breath> one secret was hidden deep beneath the encrypted servers. This summer, prepare to hear the truth.',
  },
  {
    id: 'podcast-intro',
    title: 'Podcast Episode Intro',
    category: 'Podcasting',
    suggestedEmotion: 'Enthusiastic, welcoming podcast host with banter',
    content:
      'Welcome back to the studio, everybody! |yeah| It is so great to have you with us today. <breath> Grab your favorite drink, because today we are diving deep into the science of vocal acoustic cloning. <laugh>',
  },
  {
    id: 'audiobook-fantasy',
    title: 'Fantasy Audiobook Chapter',
    category: 'Storytelling',
    suggestedEmotion: 'Gentle, mystical, immersive narrative storyteller',
    content:
      'The ancient gate creaked open as moonlight spilled across the cobblestones. The wind carried a faint whisper from the mountaintop, reminding them that some legends never truly sleep.',
  },
  {
    id: 'voicemail',
    title: 'Casual Voicemail Greeting',
    category: 'Personal',
    suggestedEmotion: 'Friendly, warm, casual everyday conversational tone',
    content:
      "Hey! You've reached my voicemail. |mhm| I'm probably away from my desk or recording in the studio right now. Leave your name, number, and why you're calling, and I'll get back to you as soon as I can. Have an awesome day!",
  },
  {
    id: 'news-anchor',
    title: 'Breaking News Broadcast',
    category: 'Journalism',
    suggestedEmotion: 'Crisp, professional, authoritative prime-time news anchor',
    content:
      'Good evening. Our top story tonight: researchers have achieved a breakthrough in instant vocal biometrics, allowing any individual to replicate their natural voice from a brief audio recording.',
  },
  {
    id: 'asmr-meditation',
    title: 'Calming Mindful Meditation',
    category: 'Wellness',
    suggestedEmotion: 'Soft, whispery, deeply calming, slow soothing meditation guide',
    content:
      'Take a deep breath in through your nose... <breath> and gently let it go. Feel all tension dissolving from your shoulders. In this moment, there is nowhere else you need to be.',
  },
];
