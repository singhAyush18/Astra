// Utility for Screen Wake Lock API and Background Audio Keep-Alive
// Keeps GPS and timers running continuously even if phone dims or screen is turned off

class BackgroundKeepAliveManager {
  constructor() {
    this.wakeLock = null;
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.audioElement = null;
    this.isActive = false;
    this.onVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  async start() {
    if (this.isActive) return;
    this.isActive = true;

    // 1. Request Screen Wake Lock
    await this.requestWakeLock();

    // 2. Start Web Audio + Silent Audio Loop (keeps OS tab thread alive in background on iOS & Android)
    this.startAudioKeepAlive();

    // 3. Set Media Session metadata for lock screen & background resilience
    this.setupMediaSession();

    // 4. Listen for visibility changes to re-acquire wake lock when screen turns back on
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stop() {
    this.isActive = false;
    this.releaseWakeLock();
    this.stopAudioKeepAlive();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // ignore
      }
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err) {
        console.warn('Wake Lock request warning:', err?.message || err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (err) {
        console.warn('Wake Lock release warning:', err?.message || err);
      }
      this.wakeLock = null;
    }
  }

  async handleVisibilityChange() {
    if (this.isActive && document.visibilityState === 'visible') {
      // Re-request wake lock when user wakes up screen or returns to browser tab
      await this.requestWakeLock();
    }
  }

  startAudioKeepAlive() {
    try {
      // Strategy A: Web Audio API Oscillator at inaudible sub-bass frequency (keeps audio thread priority)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }

        // Silent oscillator node
        if (!this.oscillator) {
          this.oscillator = this.audioContext.createOscillator();
          this.gainNode = this.audioContext.createGain();
          
          // Set inaudible gain
          this.gainNode.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
          this.oscillator.frequency.setValueAtTime(20, this.audioContext.currentTime); // 20Hz sub-audible
          this.oscillator.connect(this.gainNode);
          this.gainNode.connect(this.audioContext.destination);
          this.oscillator.start();
        }
      }

      // Strategy B: 1-second silent audio element loop fallback
      if (!this.audioElement) {
        const SILENT_WAV_BASE64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.audioElement = new Audio(SILENT_WAV_BASE64);
        this.audioElement.loop = true;
        this.audioElement.volume = 0.01;
      }
      this.audioElement.play().catch(() => {});
    } catch (err) {
      console.warn('Audio keep-alive warning:', err);
    }
  }

  stopAudioKeepAlive() {
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
        this.audioContext = null;
      }
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      }
    } catch (err) {
      console.warn('Audio keep-alive stop warning:', err);
    }
  }

  setupMediaSession() {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Astra Stride Wars — Active Battle Run',
          artist: 'Live GPS Tracking Active',
          album: 'Realm Conquest',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (err) {
        console.warn('MediaSession metadata warning:', err);
      }
    }
  }
}

export const backgroundKeepAlive = new BackgroundKeepAliveManager();
