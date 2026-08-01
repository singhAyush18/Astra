import { useState } from 'react';
import { motion } from 'framer-motion';
import './StreakFlame.css';

const StreakFlame = ({ streak = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const isActive = streak > 0;

  return (
    <div 
      className={`streak-flame-wrapper ${isActive ? 'active' : 'inactive'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div 
        className="streak-flame-icon"
        animate={isActive ? {
          scale: [1, 1.15, 1],
          filter: [
            'drop-shadow(0 0 6px rgba(212, 175, 55, 0.6))',
            'drop-shadow(0 0 14px rgba(212, 175, 55, 0.9))',
            'drop-shadow(0 0 6px rgba(212, 175, 55, 0.6))'
          ]
        } : {}}
        transition={isActive ? {
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut'
        } : {}}
      >
        {/* Custom SVG flame for richer look than Lucide */}
        <svg 
          viewBox="0 0 24 24" 
          width="26" 
          height="26" 
          fill="none"
          className="flame-svg"
        >
          <path
            d="M12 2C12 2 5 9 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9 12 2 12 2Z"
            className="flame-outer"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 21C13.66 21 15 19.66 15 18C15 15.5 12 12 12 12C12 12 9 15.5 9 18C9 19.66 10.34 21 12 21Z"
            className="flame-inner"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </motion.div>

      {/* Streak count badge */}
      <span className={`streak-count ${isActive ? 'active' : ''}`}>
        {streak}
      </span>

      {/* Tooltip on hover */}
      {hovered && (
        <motion.div 
          className="streak-tooltip"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isActive 
            ? `🔥 ${streak} day streak! Keep it up!` 
            : 'No active streak. Run today!'
          }
        </motion.div>
      )}

      {/* Ambient glow ring behind the flame when active */}
      {isActive && <div className="streak-glow-ring" />}
    </div>
  );
};

export default StreakFlame;
