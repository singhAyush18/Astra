import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, MapPin, Flame, Trophy, Zap, Shield, 
  Crown, Scroll, Target, Footprints, Heart
} from 'lucide-react';
import Navbar from '../components/Navbar';
import heroBg from '../assets/hero_bg.jpg';
import './About.css';

import { RANKS_CONFIG } from '../utils/rankUtils';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
};

const features = [
  {
    icon: <Footprints size={28} />,
    title: 'Track Your Runs',
    desc: 'Log every run with distance, duration, and pace. Your journey is recorded in the scrolls of history.'
  },
  {
    icon: <Zap size={28} />,
    title: 'Earn XP & Level Up',
    desc: 'Every kilometer earns you experience points. Rise through the ranks from Padatik to Maharaj.'
  },
  {
    icon: <Flame size={28} />,
    title: 'Maintain Your Streak',
    desc: 'Run daily to keep your flame alive. Break the streak, and the fire fades — just like in battle.'
  },
  {
    icon: <Trophy size={28} />,
    title: 'Global Leaderboard',
    desc: 'Compete with runners worldwide. Climb the ranks by XP, distance, streaks, or total runs.'
  },
  {
    icon: <Target size={28} />,
    title: 'Conquer Territories',
    desc: 'Claim real-world territories by running through them. Defend your kingdom from rivals.'
  },
  {
    icon: <Shield size={28} />,
    title: 'Warrior Rank System',
    desc: 'Progress through 5 kingdom tiers: Padatik → Senapati → Vayu → Agni → Maharaj with unlocked relics.'
  }
];

function About() {
  const canvasRef = useRef(null);

  // Floating Golden Embers & Sparks Animation
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

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.0 + 0.8,
        speedY: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.7 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.025 + 0.01,
        isGolden: Math.random() > 0.3,
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

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        if (p.isGolden) {
          gradient.addColorStop(0, `rgba(255, 215, 120, ${currentOpacity})`);
          gradient.addColorStop(0.5, `rgba(212, 175, 55, ${currentOpacity * 0.45})`);
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, `rgba(255, 110, 50, ${currentOpacity})`);
          gradient.addColorStop(0.6, `rgba(180, 40, 20, ${currentOpacity * 0.25})`);
          gradient.addColorStop(1, 'transparent');
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
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
    <div className="about-container" style={{ backgroundImage: `url(${heroBg})` }}>
      {/* Floating Ember Canvas */}
      <canvas ref={canvasRef} className="about-ember-canvas" />

      {/* Atmospheric Vignette & Tactical Watermark */}
      <div className="about-backdrop-overlay" />
      <div className="about-torch-sunburst" />
      <div className="about-tactical-grid-overlay" />

      <Navbar />

      <main className="about-main">
        {/* Hero */}
        <motion.section 
          className="about-hero"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="about-hero-icon">
            <Sword size={40} />
          </div>
          <h1 className="about-title">
            <span className="gold-text">ASTRA</span>
            <span className="about-subtitle-text">STRIDE WARS</span>
          </h1>
          <p className="about-tagline">
            Where every stride is a battle. Every run, a conquest.
          </p>
          <div className="about-version">v1.0</div>
        </motion.section>

        {/* What is it */}
        <motion.section 
          className="about-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="section-header">
            <Crown size={20} className="section-icon" />
            <h2>The Realm</h2>
          </div>
          <p className="about-text">
            Astra Stride Wars transforms your daily runs into an epic RPG adventure. 
            Lace up your shoes, step outside, and enter a world where kilometers become 
            experience points, streaks forge your warrior spirit, and real-world territories 
            await your conquest. This isn't just a fitness tracker — it's your battlefield.
          </p>
        </motion.section>

        {/* Features grid */}
        <section className="about-section">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Scroll size={20} className="section-icon" />
            <h2>Arsenal of Features</h2>
          </motion.div>
          <div className="about-features-grid">
            {features.map((feature, i) => (
              <motion.div 
                key={feature.title}
                className="about-feature-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rank system */}
        <section className="about-section">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Shield size={20} className="section-icon" />
            <h2>The Rank Hierarchy</h2>
          </motion.div>
          <div className="about-ranks">
            {RANKS_CONFIG.map((rank, i) => (
              <motion.div 
                key={rank.name}
                className="rank-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <div className="rank-badge" style={{ 
                  borderColor: rank.color,
                  boxShadow: `0 0 20px ${rank.color}33`,
                  fontSize: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span>{rank.icon}</span>
                </div>
                <div className="rank-info">
                  <span className="rank-name" style={{ color: rank.color, fontWeight: 700 }}>{rank.name}</span>
                  <span className="rank-range">{rank.rangeLabel}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{rank.relic}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How XP works */}
        <motion.section 
          className="about-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="section-header">
            <Zap size={20} className="section-icon" />
            <h2>How XP Works</h2>
          </div>
          <div className="about-xp-info">
            <div className="xp-rule">
              <MapPin size={18} className="xp-rule-icon" />
              <span>Every <strong>kilometer</strong> you run earns XP</span>
            </div>
            <div className="xp-rule">
              <Flame size={18} className="xp-rule-icon" />
              <span>Streak bonuses <strong>multiply</strong> your gains</span>
            </div>
            <div className="xp-rule">
              <Target size={18} className="xp-rule-icon" />
              <span>Level thresholds: <strong>Level × 1000 XP</strong></span>
            </div>
            <div className="xp-rule">
              <Trophy size={18} className="xp-rule-icon" />
              <span>Compete on leaderboards to prove your <strong>dominance</strong></span>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.section 
          className="about-footer"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Heart size={18} className="footer-heart" />
          <p>Built with passion for runners who crave more than just numbers.</p>
          <p className="footer-credit">Crafted by a fellow warrior of the road.</p>
        </motion.section>
      </main>
    </div>
  );
}

export default About;
