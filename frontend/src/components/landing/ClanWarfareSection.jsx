import { motion } from 'framer-motion';
import { Shield, Flame, Moon, Trees, Users, Award, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingSections.css';

const CLANS_DATA = [
  {
    id: 'solar',
    name: 'Solar Paladins',
    motto: '"Forged in the dawn, unbroken until dusk."',
    icon: Sparkles,
    accent: '#f0d060',
    glow: 'rgba(240, 208, 96, 0.35)',
    bg: 'rgba(240, 208, 96, 0.15)',
    members: '3,420',
    territoryShare: '34%',
    specialty: 'Streak Resilience',
    perk: '+20% Defense Shield on 7-Day Streaks'
  },
  {
    id: 'crimson',
    name: 'Crimson Warlords',
    motto: '"Speed is our blade. Victory is our bloodline."',
    icon: Flame,
    accent: '#ff7675',
    glow: 'rgba(255, 118, 117, 0.35)',
    bg: 'rgba(255, 118, 117, 0.15)',
    members: '4,150',
    territoryShare: '29%',
    specialty: 'High-Pace Blitzkrieg',
    perk: 'Sprints < 4:45/km deal 3x Siege Damage'
  },
  {
    id: 'shadow',
    name: 'Shadow Dynasty',
    motto: '"Silent in the night, sovereign by the morning."',
    icon: Moon,
    accent: '#a29bfe',
    glow: 'rgba(162, 155, 254, 0.35)',
    bg: 'rgba(162, 155, 254, 0.15)',
    members: '2,890',
    territoryShare: '22%',
    specialty: 'Night Conquests',
    perk: '2x Territory Tokens on runs between 20:00 - 05:00'
  },
  {
    id: 'emerald',
    name: 'Emerald Vanguard',
    motto: '"We endure where kingdoms crumble."',
    icon: Trees,
    accent: '#2ecc71',
    glow: 'rgba(46, 204, 113, 0.35)',
    bg: 'rgba(46, 204, 113, 0.15)',
    members: '2,640',
    territoryShare: '15%',
    specialty: 'Ultra Distance',
    perk: '+25% Honor Points on runs exceeding 10 km'
  }
];

const ClanWarfareSection = () => {
  return (
    <section id="clans-section" className="landing-section" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(18, 18, 42, 0.4) 50%, transparent 100%)' }}>
      <div className="section-header-wrap">
        <motion.div
          className="section-subtitle-badge"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Shield size={14} />
          <span>Ancient Dynasties & Alliances</span>
        </motion.div>
        <h2 className="section-main-title gold-text">Choose Your Clan</h2>
        <p className="section-lead-text">
          No emperor rules alone. Pledge your allegiance to an ancient legion. Pool your running mileage with your clan members, dominate the global faction wars, and share imperial bounty.
        </p>
      </div>

      <div className="clans-grid">
        {CLANS_DATA.map((clan, idx) => {
          const Icon = clan.icon;
          return (
            <motion.div
              key={clan.id}
              className="clan-card"
              style={{
                '--clan-accent': clan.accent,
                '--clan-glow': clan.glow,
                '--clan-bg': clan.bg
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
            >
              <div className="clan-sigil-wrap">
                <Icon size={32} />
              </div>

              <h3 className="clan-name">{clan.name}</h3>
              <p className="clan-motto">{clan.motto}</p>

              <div className="clan-stats-row">
                <div className="clan-stat-item">
                  <span className="clan-stat-v">{clan.members}</span>
                  <span className="clan-stat-l">Warriors</span>
                </div>
                <div className="clan-stat-item">
                  <span className="clan-stat-v" style={{ color: clan.accent }}>{clan.territoryShare}</span>
                  <span className="clan-stat-l">Map Control</span>
                </div>
                <div className="clan-stat-item">
                  <span className="clan-stat-v">{clan.specialty.split(' ')[0]}</span>
                  <span className="clan-stat-l">Doctrine</span>
                </div>
              </div>

              <div className="clan-perk-badge">
                <Award size={13} />
                <span>{clan.perk}</span>
              </div>

              <Link to="/signup" className="clan-join-btn">
                Enlist with {clan.name.split(' ')[0]}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ClanWarfareSection;
