import { motion } from 'framer-motion';
import { Footprints, Crown, MapPin, Swords, Maximize2 } from 'lucide-react';
import './PillarsOfWarfareSection.css';

const PILLARS_STEPS = [
  {
    id: 'run',
    icon: Footprints,
    title: 'RUN',
    desc: 'Track your runs and make progress.'
  },
  {
    id: 'earn-xp',
    icon: Crown,
    title: 'EARN XP',
    desc: 'Level up with every run.'
  },
  {
    id: 'claim',
    icon: MapPin,
    title: 'CLAIM',
    desc: 'Turn real places into your territory.'
  },
  {
    id: 'defend',
    icon: Swords,
    title: 'DEFEND',
    desc: 'Hold your land and fight for it.'
  },
  {
    id: 'expand',
    icon: Maximize2,
    title: 'EXPAND',
    desc: 'Grow your kingdom across the world.'
  }
];

const PillarsOfWarfareSection = () => {
  return (
    <section className="parchment-banner-container" id="how-it-works">
      <div className="parchment-scroll-wrapper">
        <div className="parchment-torn-edge top" />
        
        <div className="parchment-ribbon-content">
          <div className="parchment-pillars-grid">
            {PILLARS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  className="parchment-pillar-item"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <div className="parchment-icon-wrap">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <h4 className="parchment-pillar-title">{step.title}</h4>
                  <p className="parchment-pillar-desc">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="parchment-vertical-divider" />

          <div className="parchment-side-motto">
            <span>SAME ROADS.</span>
            <span>A BIGGER STORY.</span>
            <div className="parchment-motto-line" />
          </div>
        </div>

        <div className="parchment-torn-edge bottom" />
      </div>
    </section>
  );
};

export default PillarsOfWarfareSection;
