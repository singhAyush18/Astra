import { motion } from 'framer-motion';
import { Footprints, MapPin, Swords, Crown, Sparkles } from 'lucide-react';
import './LandingSections.css';

const PILLARS_DATA = [
  {
    num: '01',
    icon: Footprints,
    title: 'Lace Up & Mobilize',
    desc: 'Hit start and run. High-precision GPS tracks your cadence, pace, elevation, and routes, converting your physical effort into imperial conquest currency.'
  },
  {
    num: '02',
    icon: MapPin,
    title: 'Claim Hex Sectors',
    desc: 'Every kilometer run claims real-world sectors on the tactical map. Defend your home territory or breach enemy lines to expand your empire border.'
  },
  {
    num: '03',
    icon: Swords,
    title: 'Wage Clan Battles',
    desc: 'Join a legendary Dynasty. Pool your collective mileage with warriors worldwide to siege strongholds and dominate weekly faction wars.'
  },
  {
    num: '04',
    icon: Crown,
    title: 'Ascend to Emperor',
    desc: 'Level up from Recruit to Sovereign Emperor. Unlock historical relics, customized banners, tactical speed buffs, and claim your place in the Hall of Conquerors.'
  }
];

const PillarsOfWarfareSection = () => {
  return (
    <section id="how-it-works" className="landing-section">
      <div className="section-header-wrap">
        <motion.div
          className="section-subtitle-badge"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles size={14} />
          <span>The Path to Sovereignty</span>
        </motion.div>
        <h2 className="section-main-title gold-text">How Conquest Works</h2>
        <p className="section-lead-text">
          Four simple steps turn your daily jog into an epic saga of empire building and tactical conquest.
        </p>
      </div>

      <div className="pillars-grid">
        {PILLARS_DATA.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <motion.div
              key={pillar.num}
              className="pillar-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.6 }}
            >
              <span className="pillar-num">{pillar.num}</span>
              <div className="pillar-icon-box">
                <Icon size={24} />
              </div>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PillarsOfWarfareSection;
