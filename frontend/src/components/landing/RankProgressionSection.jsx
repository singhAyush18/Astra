import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Award, Zap, Check, ChevronRight } from 'lucide-react';
import './LandingSections.css';

const RANKS_DATA = [
  {
    id: 'recruit',
    title: 'Recruit Legionnaire',
    level: 'Rank I',
    req: '0 – 50 Total KM',
    icon: '🛡️',
    color: '#a09880',
    relic: 'Bronze Gladius & Scout Boots',
    perks: [
      { title: 'GPS Conquest Access', desc: 'Claim hex sectors during any outdoor GPS run.' },
      { title: 'Standard Clan Enlistment', desc: 'Join one of the 4 ancient dynasties and contribute to clan pool.' },
      { title: 'Basic Pace Metrics', desc: 'Live pace, elevation and calorie tracking.' }
    ]
  },
  {
    id: 'centurion',
    title: 'Bronze Centurion',
    level: 'Rank II',
    req: '50 – 150 Total KM',
    icon: '⚔️',
    color: '#cd7f32',
    relic: 'Centurion Crested Galea Helmet',
    perks: [
      { title: '+10% Territory Defense', desc: 'Your held sectors resist decay 10% longer.' },
      { title: 'Siege Banner Unlock', desc: 'Deploy a personal crest on any claimed sector.' },
      { title: 'Raid Participation', desc: 'Access weekly clan siege battles.' }
    ]
  },
  {
    id: 'legatus',
    title: 'Silver Legatus',
    level: 'Rank III',
    req: '150 – 350 Total KM',
    icon: '🦅',
    color: '#bdc3c7',
    relic: 'Silver Aquila Standard & Cuirass',
    perks: [
      { title: 'Territory Perimeter Aura', desc: 'Expanding radius captures 2 adjacent border nodes automatically.' },
      { title: '+20% Honor Yield', desc: 'Bonus war points awarded on every 5k+ run.' },
      { title: 'Clan Officer Privileges', desc: 'Direct clan battle attack commands on enemy strongholds.' }
    ]
  },
  {
    id: 'warlord',
    title: 'Gold Warlord',
    level: 'Rank IV',
    req: '350 – 750 Total KM',
    icon: '🦁',
    color: '#f0d060',
    relic: 'Gilded Sun Armor & Flame Spear',
    perks: [
      { title: 'Berserker Pace Multiplier', desc: 'Speed runs below 4:45/km deal 2.5x stronghold siege damage.' },
      { title: 'Imperial Relic Vault', desc: 'Equip rare ancient artifacts for custom stat buffs.' },
      { title: 'Citadel Defense Commander', desc: 'Set defensive barricades on major city checkpoints.' }
    ]
  },
  {
    id: 'emperor',
    title: 'Sovereign Emperor',
    level: 'Rank V (Mythic)',
    req: '750+ Total KM',
    icon: '👑',
    color: '#f1c40f',
    relic: 'Imperial Laurel of the Gods & Solar Cape',
    perks: [
      { title: 'Sovereign Domain Buff', desc: 'Entire clan receives +15% territory shield when you are running.' },
      { title: 'Immortal Hall of Fame', desc: 'Permanent gold inscription in the global Hall of Conquerors.' },
      { title: 'Realm Overlord Title', desc: 'Unique animated neon gold avatar frame and royal leaderboard badge.' }
    ]
  }
];

const RankProgressionSection = () => {
  const [selectedRank, setSelectedRank] = useState(RANKS_DATA[3]);

  return (
    <section id="rank-progression" className="landing-section">
      <div className="section-header-wrap">
        <motion.div
          className="section-subtitle-badge"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Award size={14} />
          <span>Warlord Hierarchy</span>
        </motion.div>
        <h2 className="section-main-title gold-text">Ascend the Imperial Ranks</h2>
        <p className="section-lead-text">
          Progress from a novice scout to a Mythic Sovereign. Each rank unlocks battle relics, visual insignia, and devastating territory conquest multipliers.
        </p>
      </div>

      {/* Interactive Step Nodes */}
      <div className="ranks-track">
        {RANKS_DATA.map((rank) => {
          const isActive = selectedRank.id === rank.id;
          return (
            <div
              key={rank.id}
              className={`rank-step-node ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedRank(rank)}
            >
              <div className="rank-node-icon">
                <span style={{ fontSize: '1.8rem' }}>{rank.icon}</span>
              </div>
              <span className="rank-node-name">{rank.title.split(' ')[0]} {rank.title.split(' ')[1]}</span>
            </div>
          );
        })}
      </div>

      {/* Rank Detail Card */}
      <motion.div
        key={selectedRank.id}
        className="rank-detail-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="rank-badge-preview">
          <div className="rank-insignia-giant">
            <span style={{ fontSize: '3rem' }}>{selectedRank.icon}</span>
          </div>
          <h3 className="rank-badge-title">{selectedRank.title}</h3>
          <span style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-stats)', fontSize: '0.9rem', marginBottom: '4px' }}>
            {selectedRank.level}
          </span>
          <span className="rank-req">{selectedRank.req}</span>
          <div style={{ marginTop: '16px', padding: '8px 12px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.2)', fontSize: '0.8rem', color: 'var(--gold-light)' }}>
            <strong>Relic:</strong> {selectedRank.relic}
          </div>
        </div>

        <div className="rank-perks-list">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Rank Mastery Privileges:
          </h4>
          {selectedRank.perks.map((perk, i) => (
            <div key={i} className="rank-perk-row">
              <Check size={20} className="rank-perk-check" />
              <div className="rank-perk-text">
                <h4>{perk.title}</h4>
                <p>{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default RankProgressionSection;
