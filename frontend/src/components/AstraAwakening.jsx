import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.jpg';
import heroBg from '../assets/hero_bg.jpg';
import './AstraAwakening.css';

const STATUS_MESSAGES = [
  'AWAKENING THE REALM...',
  'GATHERING STRIDE ENERGY...',
  'MAPPING KINGDOM DOMAINS...',
  'SUMMONING CONQUERORS...',
  'ENTERING THE BATTLEFIELD...',
];

const PILLARS = [
  {
    id: 'run',
    label: 'RUN',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        {/* Runner figure */}
        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
      </svg>
    ),
  },
  {
    id: 'conquer',
    label: 'CONQUER',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Mountain peaks */}
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </svg>
    ),
  },
  {
    id: 'rule',
    label: 'RULE',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        {/* Imperial 5-prong crown */}
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
      </svg>
    ),
  },
];

export default function AstraAwakening({ onComplete, minDuration = 5500 }) {
  const [progress, setProgress] = useState(8);
  const [statusIndex, setStatusIndex] = useState(0);
  const [activePillar, setActivePillar] = useState(0);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioDurationMs, setAudioDurationMs] = useState(minDuration);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  // Smooth Audio Fade-Out Function
  const fadeOutAudio = () => {
    if (audioRef.current) {
      const audio = audioRef.current;
      let step = 0;
      const fadeInterval = setInterval(() => {
        step += 1;
        if (audio && audio.volume > 0.08) {
          audio.volume = Math.max(0, audio.volume - 0.1);
        } else if (audio) {
          audio.volume = 0;
          audio.pause();
          clearInterval(fadeInterval);
        }
        if (step > 15) clearInterval(fadeInterval);
      }, 50);
    }
    if (masterGainRef.current && audioCtxRef.current) {
      try {
        masterGainRef.current.gain.linearRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.8);
      } catch {}
    }
  };

  // Fail-Safe Cinematic Sound Engine (AudioContext Synthesizer + HTML5 Audio)
  useEffect(() => {
    let isDisposed = false;
    let audioCtx = null;
    let masterGain = null;
    let htmlAudio = null;
    let synthNodes = [];

    // Initialize HTML5 Audio
    try {
      htmlAudio = new Audio('/sounds/Astra_loading_sound.aac');
      htmlAudio.setAttribute('playsinline', 'true');
      htmlAudio.setAttribute('webkit-playsinline', 'true');
      htmlAudio.preload = 'auto';
      htmlAudio.volume = isMuted ? 0 : 0.85;
      htmlAudio.addEventListener('loadedmetadata', () => {
        if (htmlAudio.duration && htmlAudio.duration > 1 && !isNaN(htmlAudio.duration)) {
          setAudioDurationMs(Math.max(htmlAudio.duration * 1000, 4800));
        }
      });
      audioRef.current = htmlAudio;
    } catch (e) {
      console.warn('HTML5 Audio init:', e);
    }

    // Function to play cinematic harmonic chord synthesizer
    const startCinematicSynth = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtx) {
          audioCtx = new AudioCtx();
          audioCtxRef.current = audioCtx;
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        masterGain = audioCtx.createGain();
        masterGainRef.current = masterGain;
        masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(isMuted ? 0.001 : 0.45, audioCtx.currentTime + 1.2);
        masterGain.connect(audioCtx.destination);

        // 1. Deep Sub-Bass Kingdom Rumble (55Hz)
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
        subGain.gain.value = 0.5;
        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start();
        synthNodes.push(subOsc);

        // 2. Imperial Brass / War Drone (110Hz & 165Hz)
        const brassOsc = audioCtx.createOscillator();
        const brassGain = audioCtx.createGain();
        brassOsc.type = 'sawtooth';
        brassOsc.frequency.setValueAtTime(110, audioCtx.currentTime);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + 2.5);
        brassGain.gain.value = 0.25;
        brassOsc.connect(filter);
        filter.connect(brassGain);
        brassGain.connect(masterGain);
        brassOsc.start();
        synthNodes.push(brassOsc);

        // 3. Shimmering Celestial Star of Astra (528Hz & 792Hz)
        const starOsc = audioCtx.createOscillator();
        const starGain = audioCtx.createGain();
        starOsc.type = 'triangle';
        starOsc.frequency.setValueAtTime(528, audioCtx.currentTime);
        starGain.gain.value = 0.18;
        starOsc.connect(starGain);
        starGain.connect(masterGain);
        starOsc.start();
        synthNodes.push(starOsc);
      } catch (err) {
        console.warn('Cinematic synth error:', err);
      }
    };

    const activateAllSound = () => {
      if (isDisposed) return;
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      if (htmlAudio) {
        htmlAudio.play().catch(() => {});
      }
      if (synthNodes.length === 0) {
        startCinematicSynth();
      }
    };

    // Attempt instant autoplay
    activateAllSound();

    // Universal unlock for mobile touch & gestures
    const onMobileUnlock = () => {
      activateAllSound();
      ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, onMobileUnlock);
      });
    };

    ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, onMobileUnlock, { passive: true });
    });

    return () => {
      isDisposed = true;
      ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, onMobileUnlock);
      });
      
      if (htmlAudio) {
        htmlAudio.pause();
        htmlAudio.src = '';
      }
      synthNodes.forEach((node) => {
        try { node.stop(); } catch {}
      });
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
    };
  }, []);

  // Update volume when mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.85;
    }
  }, [isMuted]);

  // Floating Golden Embers (Ultra-lightweight Mobile 60fps Loop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animId;
    let particles = [];
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    const particleCount = isMobile ? 22 : 45;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (isMobile ? 1.6 : 2.0) + 0.6,
        speedY: Math.random() * 0.6 + 0.25,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.035 + 0.015,
        isGold: Math.random() > 0.25,
      });
    }

    let lastTime = performance.now();
    const render = (now) => {
      if (now - lastTime < 16) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY;
        p.x += p.speedX;
        p.twinkle += p.twinkleSpeed;

        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const currentAlpha = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold
          ? `rgba(212, 175, 55, ${currentAlpha})`
          : `rgba(255, 235, 170, ${currentAlpha * 0.85})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sound chime synthesizer triggered when progress reaches each pillar
  const playedChimesRef = useRef({ 0: false, 1: false, 2: false });

  const playPillarChime = (pillarIndex) => {
    if (isMuted) return;
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        ctx = new AudioCtx();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // RUN: 440Hz (A4), CONQUER: 554.37Hz (C#5), RULE: 659.25Hz (E5)
      const freqs = [440, 554.37, 659.25];
      const freq = freqs[pillarIndex] || 528;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.32, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(masterGainRef.current || ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  // Synchronize Pillars & Sound Effects directly with Progress Bar loading reach
  useEffect(() => {
    if (progress < 20) {
      setActivePillar(-1);
      setStatusIndex(0); // "AWAKENING THE REALM..."
    } else if (progress >= 20 && progress < 50) {
      if (!playedChimesRef.current[0]) {
        playedChimesRef.current[0] = true;
        playPillarChime(0);
      }
      setActivePillar(0); // Loading reaches RUN
      setStatusIndex(1); // "GATHERING STRIDE ENERGY..."
    } else if (progress >= 50 && progress < 80) {
      if (!playedChimesRef.current[1]) {
        playedChimesRef.current[1] = true;
        playPillarChime(1);
      }
      setActivePillar(1); // Loading reaches CONQUER
      setStatusIndex(2); // "MAPPING KINGDOM DOMAINS..."
    } else {
      if (!playedChimesRef.current[2]) {
        playedChimesRef.current[2] = true;
        playPillarChime(2);
      }
      setActivePillar(2); // Loading reaches RULE
      setStatusIndex(3); // "SUMMONING CONQUERORS..."
    }
  }, [progress, isMuted]);

  // Show Skip button after 3.2s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // Backend Health Ping
  useEffect(() => {
    let isMounted = true;
    let pingTimer;

    const pingBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch('/api/health', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok && isMounted) {
          setIsBackendReady(true);
          return;
        }
      } catch {
        // Cold start retry
      }

      if (isMounted) {
        pingTimer = setTimeout(pingBackend, 1600);
      }
    };

    pingBackend();

    return () => {
      isMounted = false;
      clearTimeout(pingTimer);
    };
  }, []);

  // Progress Bar Simulation synchronized to audio duration & backend
  useEffect(() => {
    const targetDuration = Math.max(minDuration, audioDurationMs);
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const timeProgress = Math.min(100, (elapsed / targetDuration) * 100);

      setProgress((prev) => {
        if (isBackendReady) {
          if (elapsed >= targetDuration) {
            return 100;
          }
          return Math.max(prev, Math.min(99, timeProgress));
        }
        // If backend still waking up, progress smoothly up to 88%
        if (prev < 88) {
          return Math.min(88, Math.max(prev + 0.25, timeProgress * 0.88));
        }
        return prev;
      });
    }, 40);

    return () => clearInterval(progressInterval);
  }, [isBackendReady, minDuration, audioDurationMs]);

  // Transition trigger when 100% complete
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;
      setStatusIndex(STATUS_MESSAGES.length - 1);
      
      // Step 1: Smoothly Fade Out Audio
      fadeOutAudio();

      // Step 2: Unveil Kingdom Dashboard
      setTimeout(() => {
        setIsExiting(true);
      }, 350);

      // Step 3: Complete transition & clean unmount
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 850);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setProgress(100);
    setStatusIndex(STATUS_MESSAGES.length - 1);
    fadeOutAudio();
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  };

  return (
    <div
      className={`astra-awakening-overlay ${isExiting ? 'awakening-fade-out' : ''}`}
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 30%, rgba(6, 6, 8, 0.45) 0%, rgba(6, 6, 8, 0.88) 65%, #060505 100%), url(${heroBg})`,
      }}
    >
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="awakening-canvas" />

      {/* Atmospheric Radial Gradients */}
      <div className="awakening-celestial-glow" />
      <div className="awakening-vignette" />

      <div className="awakening-container">
        {/* 1. TOP HEADER */}
        <motion.div
          className="awakening-top-header"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {/* Mute / Unmute Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted((prev) => !prev);
            }}
            className="awakening-sound-toggle"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <div className="header-text-block">
            <span className="header-line-1">MORE THAN A RUN</span>
            <span className="header-line-2">A LARGER KINGDOM AWAITS</span>
            <span className="header-diamond-star">✦</span>
          </div>
          <div className="header-version">v 1.0</div>
        </motion.div>

        {/* 2. CENTER MEDALLION CREST */}
        <div className="awakening-medallion-area">
          {/* Outer Sunburst & Celestial Ring */}
          <div className="medallion-outer-ring" />
          <div className="medallion-sunburst-glow" />

          {/* Central Logo Crest */}
          <motion.div
            className="medallion-box"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="medallion-inner">
              <img src={logoImg} alt="ASTRA: Stride Wars" className="medallion-img" />
              {/* Bottom-up gold illumination sweep */}
              <div className="medallion-light-sweep" />
              {/* Central star flare */}
              <div className="medallion-star-flare" />
            </div>
          </motion.div>
        </div>

        {/* 3. MIDDLE STATUS & CHEVRON PROGRESS BAR */}
        <div className="awakening-middle-section">
          {/* Status line */}
          <AnimatePresence mode="wait">
            <motion.div
              key={statusIndex}
              className="awakening-status-text"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.35 }}
            >
              {STATUS_MESSAGES[statusIndex]}
            </motion.div>
          </AnimatePresence>

          {/* Pointed Chevron Progress Bar */}
          <div className="chevron-progress-wrapper">
            <div className="chevron-progress-frame">
              <div
                className="chevron-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              >
                <div className="progress-shimmer-beam" />
                <div className="progress-flare-head" />
              </div>
            </div>
          </div>

          {/* 4. THREE PILLARS (RUN • CONQUER • RULE) */}
          <div className="awakening-pillars-block">
            {PILLARS.map((pillar, idx) => {
              const isActive = activePillar === idx;
              return (
                <React.Fragment key={pillar.id}>
                  <div className={`pillar-col ${isActive ? 'pillar-col-active' : ''}`}>
                    <div className="pillar-glyph">{pillar.icon}</div>
                    <span className="pillar-txt">{pillar.label}</span>
                  </div>
                  {idx < PILLARS.length - 1 && <div className="pillar-dash-line" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Skip / Enter Action */}
        {showSkip && !isExiting && (
          <motion.button
            onClick={handleSkip}
            className="awakening-quick-enter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.04 }}
          >
            Enter Realm <span>→</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
