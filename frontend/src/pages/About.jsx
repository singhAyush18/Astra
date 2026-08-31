import { motion } from 'framer-motion';
import { 
  Sword, MapPin, Flame, Trophy, Zap, Shield, 
  Crown, Scroll, Target, Footprints, Heart
} from 'lucide-react';
import Navbar from '../components/Navbar';
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
    desc: 'Every kilometer earns you experience points. Rise through the ranks from Recruit to Sovereign Emperor.'
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
    title: 'Warlord Rank System',
    desc: 'Progress through 5 imperial tiers: Recruit → Centurion → Legatus → Warlord → Sovereign Emperor with unlocked relics.'
  }
];

function About() {
  return (
    <div className="about-container">
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
          <div className="about-version">v1.0 — Forged in Code & Sweat</div>
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
