import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { getRankByLevel } from '../utils/rankUtils';
import './XPBar.css';

const XPBar = ({ level = 1, currentXP = 0, maxXP = 1000 }) => {
  const percentage = Math.min(100, Math.max(0, (currentXP / maxXP) * 100));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [width, setWidth] = useState(0);

  const rankData = getRankByLevel(level);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setWidth(percentage), 300);
      return () => clearTimeout(timer);
    }
  }, [isInView, percentage]);

  return (
    <div ref={ref} className="xp-bar-container ornate-border">
      <div className="xp-header">
        <div className="xp-level">
          <span className="level-badge">LVL</span>
          <span className="level-number">{level}</span>
        </div>
        <div className="xp-info">
          <span className="xp-rank" style={{ color: rankData.color, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>{rankData.icon}</span>
            <span style={{ fontWeight: 700 }}>{rankData.name}</span>
          </span>
          <span className="xp-numbers">{currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP</span>
        </div>
        <div className="xp-next-level">
          <span className="next-label">Next Level</span>
          <span className="next-number">{level + 1}</span>
        </div>
      </div>
      <div className="xp-track">
        <motion.div
          className="xp-fill"
          style={{ background: `linear-gradient(90deg, #b8860b, ${rankData.color}, #ffffff)` }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        >
          <div className="xp-fill-shimmer" />
        </motion.div>
        <div className="xp-markers">
          {[25, 50, 75].map(mark => (
            <div key={mark} className="xp-marker" style={{ left: `${mark}%` }} />
          ))}
        </div>
      </div>
      <div className="xp-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span>{(Math.max(0, maxXP - currentXP)).toLocaleString()} XP to next level</span>
        <span style={{ color: rankData.color, fontSize: '0.75rem', fontWeight: 600 }}>Relic: {rankData.relic}</span>
      </div>
    </div>
  );
};

export default XPBar;
