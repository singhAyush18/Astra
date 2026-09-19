/**
 * Astra Sound Effects Engine (Procedural Web Audio API)
 * Zero external audio files — instant 0ms latency, high-fidelity sound synthesis.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('astra_sfx_muted') === 'true';
    this.masterVolume = 0.7;
  }

  // Lazy-initialize audio context on first user gesture
  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('astra_sfx_muted', String(this.isMuted));
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('astra_sfx_muted', String(muted));
  }

  // ==========================================
  // 1. TERRITORY CLAIMED (Golden Chime + Sub-Bass)
  // ==========================================
  playTerritoryClaimed() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass resonance impact
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.8);
    subGain.gain.setValueAtTime(0.5 * this.masterVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    // Sparkling Golden Chime Cascade (E Major Pentatonic: E5, G#5, B5, E6, G#6)
    const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
    notes.forEach((freq, idx) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();

      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(freq, now + idx * 0.08);

      chimeGain.gain.setValueAtTime(0.001, now + idx * 0.08);
      chimeGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + idx * 0.08 + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chimeOsc.start(now + idx * 0.08);
      chimeOsc.stop(now + idx * 0.08 + 1.5);
    });
  }

  // ==========================================
  // 2. TERRITORY USURPED (War Horn + Drum Boom + Blade Clash)
  // ==========================================
  playTerritoryUsurped() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A. Heavy Battle Drum Impact
    const drumOsc = ctx.createOscillator();
    const drumGain = ctx.createGain();
    drumOsc.type = 'triangle';
    drumOsc.frequency.setValueAtTime(140, now);
    drumOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

    drumGain.gain.setValueAtTime(0.8 * this.masterVolume, now);
    drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    drumOsc.connect(drumGain);
    drumGain.connect(ctx.destination);
    drumOsc.start(now);
    drumOsc.stop(now + 1.0);

    // B. Metallic Blade Clash (White noise burst filtered)
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // C. Ominous War Horn (Dual detuned sawtooth oscillators)
    const hornFrequencies = [130.81, 196.00]; // C3, G3 Power Fifth
    hornFrequencies.forEach((freq) => {
      const hornOsc = ctx.createOscillator();
      const hornGain = ctx.createGain();
      const hornFilter = ctx.createBiquadFilter();

      hornOsc.type = 'sawtooth';
      hornOsc.frequency.setValueAtTime(freq, now + 0.05);

      hornFilter.type = 'lowpass';
      hornFilter.frequency.setValueAtTime(400, now + 0.05);
      hornFilter.frequency.linearRampToValueAtTime(1200, now + 0.3);
      hornFilter.frequency.exponentialRampToValueAtTime(300, now + 1.8);

      hornGain.gain.setValueAtTime(0.001, now + 0.05);
      hornGain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.25);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      hornOsc.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(ctx.destination);

      hornOsc.start(now + 0.05);
      hornOsc.stop(now + 1.9);
    });
  }

  // ==========================================
  // 3. VICTORY FANFARE / LEVEL UP
  // ==========================================
  playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major Triad + Octave

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.001, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + idx * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 2.0);
    });
  }

  // ==========================================
  // 4. TACTICAL VOICE ANNOUNCER (Web Speech API)
  // ==========================================
  getAvailableVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  }

  getPreferredMaleVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Check user preference from localStorage first
    const savedVoiceURI = localStorage.getItem('astra_voice_name');
    if (savedVoiceURI) {
      const saved = voices.find(v => v.name === savedVoiceURI || v.voiceURI === savedVoiceURI);
      if (saved) return saved;
    }

    // Premier prioritized list of authoritative Male voices
    const malePriorityPatterns = [
      /Google UK English Male/i,
      /Microsoft David/i,
      /Microsoft Mark/i,
      /Microsoft George/i,
      /Daniel/i,
      /Alex/i,
      /Arthur/i,
      /Oliver/i,
      /Guy/i,
      /Tom/i,
      /James/i,
      /Ryan/i,
      /en-US-Standard-B/i,
      /en-US-Standard-D/i,
      /en-GB-Standard-B/i,
      /Male/i
    ];

    for (const pattern of malePriorityPatterns) {
      const match = voices.find(v => v.lang.startsWith('en') && pattern.test(v.name));
      if (match) return match;
    }

    // Fallback: any English voice that does NOT contain "Female" or female names
    const nonFemaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      !/female|zira|samantha|victoria|karen|susan|hazel|linda|eva/i.test(v.name)
    );
    if (nonFemaleVoice) return nonFemaleVoice;

    // Last resort
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }

  speakAnnouncement(text, onEndCallback) {
    if (this.isMuted) {
      if (onEndCallback) setTimeout(onEndCallback, 4500);
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEndCallback) setTimeout(onEndCallback, 4500);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any prior pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; // Crisp, commanding pacing
      utterance.pitch = 0.90; // Deep authoritative commander pitch
      utterance.volume = 1.0;

      const maleVoice = this.getPreferredMaleVoice();
      if (maleVoice) {
        utterance.voice = maleVoice;
      }

      let hasEnded = false;
      const finish = () => {
        if (!hasEnded) {
          hasEnded = true;
          if (onEndCallback) onEndCallback();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      // Fallback timer in case speech engine freezes on mobile OS
      setTimeout(finish, 8500);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Tactical announcer audio synthesis error:', err);
      if (onEndCallback) setTimeout(onEndCallback, 4500);
    }
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export const soundEffects = new SoundEngine();

