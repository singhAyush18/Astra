import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './StatCard.css';

const StatCard = ({ icon, label, value, suffix = '', prefix = '', delta, deltaType = 'positive' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericValue = parseFloat(value);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current * 10) / 10);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, numericValue]);

  const formatValue = (val) => {
    if (Number.isInteger(numericValue)) return Math.floor(val).toLocaleString();
    return val.toFixed(1);
  };

  return (
    <motion.div
      ref={ref}
      className="stat-card ornate-border"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, boxShadow: '0 0 30px rgba(212, 175, 55, 0.15)' }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {prefix}{formatValue(displayValue)}{suffix}
        </span>
        {delta && (
          <span className={`stat-delta ${deltaType}`}>
            {deltaType === 'positive' ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
