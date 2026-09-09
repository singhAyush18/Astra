import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Swords, Sparkles, Zap, ShieldAlert, X } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import './ConquestAlert.css';

/**
 * High-Impact Conquest & Usurpation Alert Banner
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {'claim'|'usurp'} props.type - 'claim' for neutral sector, 'usurp' for dethroning rival
 * @param {string} props.gridId - e.g. "G-408"
 * @param {string} [props.rivalName] - e.g. "ShadowRunner" (for usurpation)
 * @param {number} [props.influence] - e.g. 100
 * @param {function} props.onClose
 */
export default function ConquestAlert({
  isOpen,
  type = 'claim',
  gridId = 'G-408',
  rivalName = 'Vanguard',
  influence = 100,
  onClose
}) {
  useEffect(() => {
    if (isOpen) {
      if (type === 'usurp') {
        soundEffects.playTerritoryUsurped();
      } else {
        soundEffects.playTerritoryClaimed();
      }

      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 5000); // auto-dismiss after 5s

      return () => clearTimeout(timer);
    }
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const isUsurp = type === 'usurp';

  return (
    <AnimatePresence>
      <div className="conquest-alert-overlay">
        {/* Background Shockwave Ring */}
        <motion.div
          className={`shockwave-ring ${isUsurp ? 'shockwave-crimson' : 'shockwave-gold'}`}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Main Alert Card */}
        <motion.div
          className={`conquest-banner-card ${isUsurp ? 'banner-usurp' : 'banner-claim'}`}
          initial={{ opacity: 0, y: -80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
        >
          {/* Close button */}
          <button className="alert-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>

          {/* Glowing Crest Icon with Animated Halo */}
          <div className="crest-wrapper">
            <motion.div
              className={`crest-halo ${isUsurp ? 'halo-crimson' : 'halo-gold'}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <div className={`crest-icon-box ${isUsurp ? 'icon-crimson' : 'icon-gold'}`}>
              {isUsurp ? (
                <Swords size={32} className="crest-svg" />
              ) : (
                <Crown size={32} className="crest-svg" />
              )}
            </div>
          </div>

          {/* Alert Content */}
          <div className="alert-text-block">
            <div className="alert-badge-row">
              <span className={`event-badge ${isUsurp ? 'badge-usurp' : 'badge-claim'}`}>
                {isUsurp ? <ShieldAlert size={12} /> : <Sparkles size={12} />}
                {isUsurp ? 'USURPATION EVENT' : 'SECTOR CONQUERED'}
              </span>
              <span className="grid-id-pill">{gridId}</span>
            </div>

            <h2 className="alert-title">
              {isUsurp ? (
                <>Ruler Overthrown in <span className="highlight-text">{gridId}</span>!</>
              ) : (
                <>Territory Claimed for the Realm!</>
              )}
            </h2>

            <p className="alert-subtitle">
              {isUsurp ? (
                <>You dethroned <strong>{rivalName}</strong> and seized supreme dominion over this sector.</>
              ) : (
                <>Your stamina has established dominion. Sector influence anchored to your name.</>
              )}
            </p>

            {/* Influence Reward Tag */}
            <div className="reward-tag">
              <Zap size={14} className="zap-icon" />
              <span>+{influence} Influence Claimed</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
