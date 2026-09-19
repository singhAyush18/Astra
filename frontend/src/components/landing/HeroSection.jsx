import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, X, Crown, Shield, Flame, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../../assets/hero_bg.jpg';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // Floating Golden Embers and Sparks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.7 + 0.25,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.75 + 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        isGolden: Math.random() > 0.35,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.twinklePhase += p.twinkleSpeed;
        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinklePhase));

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
        if (p.isGolden) {
          gradient.addColorStop(0, `rgba(255, 215, 120, ${currentOpacity})`);
          gradient.addColorStop(0.5, `rgba(212, 175, 55, ${currentOpacity * 0.5})`);
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, `rgba(255, 120, 60, ${currentOpacity})`);
          gradient.addColorStop(0.6, `rgba(180, 40, 20, ${currentOpacity * 0.3})`);
          gradient.addColorStop(1, 'transparent');
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="astra-hero-realm" style={{ backgroundImage: `url(${heroBg})` }}>
      <canvas ref={canvasRef} className="hero-ember-canvas" />
      <div className="hero-dark-overlay" />
      <div className="hero-golden-fog" />

      {/* Left Vertical Editorial Note */}
      <div className="editorial-side-left">
        <div className="editorial-ornament" />
        <span className="editorial-vertical-text">MORE THAN A RUN</span>
        <div className="editorial-ornament" />
      </div>

      {/* Right Vertical Editorial Note */}
      <div className="editorial-side-right">
        <span className="editorial-quote-card">
          RUNNERS<br />BUILD<br />STRONGER<br />KINGDOMS
        </span>
      </div>

      {/* Central Epic Stage */}
      <div className="astra-hero-stage">
        <motion.div
          className="hero-crown-emblem"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Crown className="crown-icon-gold" size={42} />
        </motion.div>

        <motion.h1
          className="hero-main-title"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          ASTRA
        </motion.h1>

        <motion.div
          className="hero-subline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          <div className="hero-ornate-line left" />
          <span className="hero-stride-text">STRIDE · WARS</span>
          <div className="hero-ornate-line right" />
        </motion.div>

        <motion.div
          className="hero-tagline-motto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          RUN <span>·</span> CONQUER <span>·</span> RULE
        </motion.div>

        <motion.p
          className="hero-lead-description"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          Turn your runs into territories.<br />
          A bigger, stronger you awaits.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div
          className="hero-cta-cluster"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          <button
            className="btn-crimson-battle"
            onClick={() => navigate('/signup')}
          >
            <span>ENTER THE BATTLEFIELD</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>

          <button
            className="btn-trailer-ghost"
            onClick={() => setShowTrailer(true)}
          >
            <div className="play-icon-circle">
              <Play size={13} fill="currentColor" />
            </div>
            <span>Watch Trailer</span>
          </button>
        </motion.div>

        {/* Bottom Quote Badge */}
        <motion.div
          className="hero-bottom-quote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          "DISCIPLINE TODAY, EMPIRES TOMORROW."
        </motion.div>
      </div>

      {/* Trailer Video Modal */}
      <AnimatePresence>
        {showTrailer && (
          <motion.div
            className="trailer-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTrailer(false)}
          >
            <motion.div
              className="trailer-modal-window"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="trailer-header">
                <div className="trailer-title">
                  <Crown size={16} className="text-gold" />
                  <span>ASTRA: STRIDE WARS — REALM REVEAL</span>
                </div>
                <button
                  className="trailer-close-btn"
                  onClick={() => setShowTrailer(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="trailer-video-container">
                <div className="trailer-mock-playback">
                  <Crown size={64} className="trailer-watermark" />
                  <h3>THE KINGDOM CALLS FOR RUNNERS</h3>
                  <p>Every step claims land. Every sprint defends the realm.</p>
                  <div className="trailer-stats-ticker">
                    <span>🗺️ GPS Hex Conquest</span>
                    <span>⚔️ Clan Battles</span>
                    <span>👑 Maharaj Ranks</span>
                  </div>
                  <button
                    className="btn-crimson-battle"
                    style={{ marginTop: '24px' }}
                    onClick={() => {
                      setShowTrailer(false);
                      navigate('/signup');
                    }}
                  >
                    <span>JOIN THE EXPEDITION</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HeroSection;
