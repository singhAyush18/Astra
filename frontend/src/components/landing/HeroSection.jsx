import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sword } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const canvasRef = useRef(null);

  // Particle/star field animation
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

    // Create particles
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 0.3 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.twinklePhase += p.twinkleSpeed;
        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinklePhase));

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        // Golden particle glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(212, 175, 55, ${currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(212, 175, 55, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 208, 96, ${currentOpacity})`;
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
    <section className="hero-section">
      <canvas ref={canvasRef} className="hero-particles" />

      {/* Radial glow behind content */}
      <div className="hero-glow" />

      <div className="hero-content">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Sword size={14} />
          <span>A New Age of Running Begins</span>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <span className="title-line">CONQUER YOUR</span>
          <span className="title-line title-gold gold-text">KINGDOM</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Every stride earns territory. Every mile builds your empire.
          <br />
          Run to conquer — rule with every step.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Link to="/signup" className="hero-cta-primary gold-shimmer">
            <span>Begin Your Reign</span>
            <ChevronRight size={18} />
          </Link>
          <a href="#how-it-works" className="hero-cta-secondary">
            Learn More
          </a>
        </motion.div>

        <motion.div
          className="hero-stats-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="hero-stat">
            <span className="hero-stat-value">12,450+</span>
            <span className="hero-stat-label">Active Rulers</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">2.1M</span>
            <span className="hero-stat-label">Km Conquered</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">847</span>
            <span className="hero-stat-label">Kingdoms Built</span>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <div className="scroll-line" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
