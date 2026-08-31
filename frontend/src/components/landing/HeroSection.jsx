import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sword, Shield, MapPin, Flame, Trophy, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // 3D Tilt Effect on Hero Battle Card
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX(-y * 0.04);
    setRotateY(x * 0.04);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Particle/star & fiery ember animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create dual-type particles: Golden stars + Fiery Embers
    for (let i = 0; i < 140; i++) {
      const isEmber = Math.random() > 0.45;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: isEmber ? Math.random() * 2.5 + 1 : Math.random() * 1.5 + 0.5,
        speedY: isEmber ? Math.random() * 0.8 + 0.3 : Math.random() * 0.2 + 0.05,
        speedX: (Math.random() - 0.5) * (isEmber ? 0.6 : 0.2),
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        isEmber
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

        if (p.isEmber) {
          // Fiery Ember Glow
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
          gradient.addColorStop(0, `rgba(230, 80, 40, ${currentOpacity})`);
          gradient.addColorStop(0.5, `rgba(212, 120, 20, ${currentOpacity * 0.4})`);
          gradient.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 180, 80, ${currentOpacity})`;
          ctx.fill();
        } else {
          // Golden Celestial Stardust
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          gradient.addColorStop(0, `rgba(212, 175, 55, ${currentOpacity})`);
          gradient.addColorStop(0.6, `rgba(212, 175, 55, ${currentOpacity * 0.2})`);
          gradient.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240, 208, 96, ${currentOpacity})`;
          ctx.fill();
        }
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
    <section className="hero-section">
      <canvas ref={canvasRef} className="hero-particles" />
      <div className="hero-glow" />

      <div className="hero-grid-container">
        {/* Left Column: Epic Historical Hook */}
        <div className="hero-content-left">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Sword size={14} className="hero-sword-icon" />
            <span>A New Age of Imperial Warfare</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="title-line">CONQUER THE REALM</span>
            <span className="title-line title-gold gold-text">WITH EVERY STRIDE</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Turn every kilometer of your run into real-world geographic conquest. Join ancient clans, wage weekly territory raids, ascend warlord ranks, and carve your dynasty into history.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Link to="/signup" className="hero-cta-primary gold-shimmer">
              <Sword size={18} />
              <span>Begin Your Conquest</span>
              <ChevronRight size={18} />
            </Link>
            <a href="#territory-conquest" className="hero-cta-secondary">
              <Play size={16} />
              <span>Explore Tactical Map</span>
            </a>
          </motion.div>

          <motion.div
            className="hero-stats-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <div className="hero-stat">
              <span className="hero-stat-value">14,800+</span>
              <span className="hero-stat-label">Active Warlords</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">3.4M</span>
              <span className="hero-stat-label">Km Conquered</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">1,240</span>
              <span className="hero-stat-label">Realms Claimed</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: 3D Interactive Tactical Card */}
        <motion.div
          className="hero-card-right"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={cardRef}
            className="hero-3d-card"
            style={{
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: 'transform 0.15s ease-out'
            }}
          >
            <div className="card-top-glow" />

            <div className="card-inner-header">
              <div className="card-sigil-icon">
                <Shield size={22} />
              </div>
              <div>
                <div className="card-hud-badge">REAL-TIME GPS CAMPAIGN</div>
                <h3 className="card-hud-title">Sector 09: Dawn Fortress</h3>
              </div>
            </div>

            <div className="card-radar-box">
              <div className="radar-sweep" />
              <div className="radar-node node-1" />
              <div className="radar-node node-2" />
              <div className="radar-node node-3" />
              <div className="radar-runner-indicator">
                <span className="pulse-ring" />
                <span className="runner-label">YOU (5.2 km)</span>
              </div>
            </div>

            <div className="card-stats-hud">
              <div className="card-stat-hud-item">
                <span className="stat-hud-label">Dominion</span>
                <span className="stat-hud-val gold-text">88.4%</span>
              </div>
              <div className="card-stat-hud-item">
                <span className="stat-hud-label">Clan Defense</span>
                <span className="stat-hud-val" style={{ color: '#2ecc71' }}>Fortified</span>
              </div>
              <div className="card-stat-hud-item">
                <span className="stat-hud-label">Siege Honor</span>
                <span className="stat-hud-val" style={{ color: '#ff7675' }}>+750 PTS</span>
              </div>
            </div>

            <div className="card-live-log">
              <div className="log-pulse-dot" />
              <span>Solar Paladins breached Western Gate • 4m ago</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <a href="#how-it-works" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--gold-primary)', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>
          <span>SCROLL TO MARCH</span>
          <div className="scroll-line" />
        </a>
      </motion.div>
    </section>
  );
};

export default HeroSection;
