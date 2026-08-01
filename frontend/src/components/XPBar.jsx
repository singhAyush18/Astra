import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './XPBar.css';

const XPBar = ({ level, currentXP, maxXP, rank }) => {
  const percentage = (currentXP / maxXP) * 100;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [width, setWidth] = useState(0);

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
          <span className="xp-rank">{rank}</span>
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
      <div className="xp-footer">
        <span>{(maxXP - currentXP).toLocaleString()} XP to next level</span>
      </div>
    </div>
  );
};

export default XPBar;
