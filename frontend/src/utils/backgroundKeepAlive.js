// Utility for Screen Wake Lock API and Background Audio Keep-Alive
// Keeps GPS and timers running continuously even if phone dims or screen is turned off

// 1-second silent WAV base64 string
const SILENT_WAV_BASE64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class BackgroundKeepAliveManager {
  constructor() {
    this.wakeLock = null;
    this.audioElement = null;
    this.isActive = false;
    this.onVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  async start() {
    if (this.isActive) return;
    this.isActive = true;

    // 1. Request Screen Wake Lock
    await this.requestWakeLock();

    // 2. Start Silent Background Audio Loop (keeps OS tab thread alive in background)
    this.startSilentAudio();

    // 3. Set Media Session metadata for lock screen & background resilience
    this.setupMediaSession();

    // 4. Listen for visibility changes to re-acquire wake lock if user turns screen back on
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stop() {
    this.isActive = false;
    this.releaseWakeLock();
    this.stopSilentAudio();
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

  startSilentAudio() {
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio(SILENT_WAV_BASE64);
        this.audioElement.loop = true;
        this.audioElement.volume = 0.01;
      }
      this.audioElement.play().catch(() => {
        // Autoplay policy fallback: user interaction required
      });
    } catch (err) {
      console.warn('Silent audio keep-alive warning:', err);
    }
  }

  stopSilentAudio() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (err) {
        console.warn('Silent audio stop warning:', err);
      }
    }
  }

  setupMediaSession() {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Astra Stride Wars — Active Battle Run',
          artist: 'Live GPS Tracking Active',
          album: 'Hall of Champions',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (err) {
        console.warn('MediaSession metadata warning:', err);
      }
    }
  }
}

export const backgroundKeepAlive = new BackgroundKeepAliveManager();
