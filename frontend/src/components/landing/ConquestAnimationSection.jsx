import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Moon, Trees, RotateCcw, Flag, Shield, Award, CheckCircle } from 'lucide-react';
import './ConquestAnimation.css';

const CLAN_THEMES = [
  {
    id: 'solar',
    name: 'Solar Paladins',
    runnerName: 'Warlord Aurelius',
    color: '#f0d060',
    glow: 'rgba(240, 208, 96, 0.7)',
    bgGlow: 'rgba(240, 208, 96, 0.25)',
    icon: Sparkles,
    sigilLabel: 'SOLAR SUN',
    motto: 'DOMINION OF THE DAWN'
  },
  {
    id: 'crimson',
    name: 'Crimson Warlords',
    runnerName: 'Centurion Drake',
    color: '#ff7675',
    glow: 'rgba(255, 118, 117, 0.7)',
    bgGlow: 'rgba(255, 118, 117, 0.25)',
    icon: Flame,
    sigilLabel: 'BLOOD DRAGON',
    motto: 'CRIMSON CONQUEST'
  },
  {
    id: 'shadow',
    name: 'Shadow Dynasty',
    runnerName: 'Legatus Vesper',
    color: '#a29bfe',
    glow: 'rgba(162, 155, 254, 0.7)',
    bgGlow: 'rgba(162, 155, 254, 0.25)',
    icon: Moon,
    sigilLabel: 'NIGHT RAVEN',
    motto: 'SHADOW REALM SOVEREIGN'
  },
  {
    id: 'emerald',
    name: 'Emerald Vanguard',
    runnerName: 'Sentinel Sylas',
    color: '#2ecc71',
    glow: 'rgba(46, 204, 113, 0.7)',
    bgGlow: 'rgba(46, 204, 113, 0.25)',
    icon: Trees,
    sigilLabel: 'JADE SERPENT',
    motto: 'ENDURANCE ETERNAL'
  }
];

const ConquestAnimationSection = () => {
  const [selectedClan, setSelectedClan] = useState(CLAN_THEMES[0]);
  const [stage, setStage] = useState('sprinting'); // 'sprinting' | 'planting' | 'shockwave' | 'claimed'
  const [replayKey, setReplayKey] = useState(0);

  // Animation timeline sequence
  useEffect(() => {
    setStage('sprinting');

    const t1 = setTimeout(() => {
      setStage('planting');
    }, 1300);

    const t2 = setTimeout(() => {
      setStage('shockwave');
    }, 1800);

    const t3 = setTimeout(() => {
      setStage('claimed');
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [selectedClan, replayKey]);

  const handleReplay = () => {
    setReplayKey((k) => k + 1);
  };

  const IconComponent = selectedClan.icon;

  return (
    <section className="landing-section" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div className="conquest-anim-wrapper" style={{
        '--theme-color': selectedClan.color,
        '--theme-glow': selectedClan.glow,
        '--sector-bg-glow': selectedClan.bgGlow
      }}>
        {/* Top Control Bar */}
        <div className="anim-top-bar">
          <div className="anim-clan-tabs">
            {CLAN_THEMES.map((c) => {
              const ClanIcon = c.icon;
              const isActive = selectedClan.id === c.id;
              return (
                <button
                  key={c.id}
                  className={`anim-clan-tab ${isActive ? 'active' : ''}`}
                  style={{
                    '--tab-color': c.color,
                    '--tab-glow': c.glow
                  }}
                  onClick={() => setSelectedClan(c)}
                >
                  <ClanIcon size={14} style={{ color: c.color }} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          <button className="anim-replay-btn" onClick={handleReplay}>
            <RotateCcw size={14} />
            <span>Replay Conquest</span>
          </button>
        </div>

        {/* 3D Battle Arena Viewport */}
        <div className="battle-stage-3d">
          {/* Perspective Ground Grid */}
          <div className="isometric-grid-plane">
            {Array.from({ length: 12 }).map((_, idx) => {
              const isTarget = idx === 5; // Center sector
              const isClaimed = isTarget && (stage === 'shockwave' || stage === 'claimed');

              return (
                <div
                  key={idx}
                  className={`grid-tile ${isTarget ? 'conquest-target' : ''} ${isClaimed ? 'claimed' : ''}`}
                >
                  <span className="grid-tile-coord">SEC 0{idx + 1}</span>
                  {isTarget && (
                    <div className={`square-shockwave ${stage === 'shockwave' || stage === 'claimed' ? 'active' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* SPRINTING WARRIOR AVATAR */}
          <AnimatePresence>
            {(stage === 'sprinting' || stage === 'planting') && (
              <motion.div
                key={`runner-${replayKey}`}
                className="runner-warrior-avatar"
                initial={{ left: '-10%', top: '25%', opacity: 0, scale: 0.7 }}
                animate={{
                  left: stage === 'planting' ? '46%' : '44%',
                  top: stage === 'planting' ? '40%' : '38%',
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                transition={{ duration: 1.3, ease: 'easeOut' }}
              >
                <div className="warrior-figure">
                  <div className="warrior-trail" />
                  <div className="speed-lines" />
                  {/* Runner SVG Graphic with Armor & Spear */}
                  <svg viewBox="0 0 100 120" width="70" height="85" style={{ filter: `drop-shadow(0 0 10px ${selectedClan.color})` }}>
                    {/* Head / Helmet */}
                    <circle cx="50" cy="22" r="12" fill={selectedClan.color} />
                    <path d="M42 20 L58 20 L50 8 Z" fill="#fff" />
                    {/* Torso Armor */}
                    <path d="M40 36 L60 36 L56 70 L44 70 Z" fill="#1e1b38" stroke={selectedClan.color} strokeWidth="3" />
                    {/* Running Legs */}
                    <path d="M44 70 L34 95 L22 92" stroke={selectedClan.color} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M56 70 L68 90 L82 105" stroke={selectedClan.color} strokeWidth="4" strokeLinecap="round" fill="none" />
                    {/* Spear / Flag in hand */}
                    <line x1="62" y1="20" x2="62" y2="85" stroke="#f6f2c0" strokeWidth="3" />
                    <polygon points="62,10 58,22 66,22" fill="#fff" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PLANTED WAR BANNER (Appears on plant impact) */}
          <AnimatePresence>
            {(stage === 'shockwave' || stage === 'claimed') && (
              <motion.div
                key={`banner-${replayKey}-${selectedClan.id}`}
                className="planted-war-banner"
                initial={{ y: -100, opacity: 0, scaleY: 0.3 }}
                animate={{ y: 0, opacity: 1, scaleY: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              >
                <div className="flagpole">
                  <div className="spearhead-tip" />

                  {/* Unfurled Cloth Banner */}
                  <motion.div
                    className="imperial-cloth-banner"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 130, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <div className="banner-sigil-emblem">
                      <IconComponent size={32} />
                    </div>
                    <div className="banner-clan-title">{selectedClan.name}</div>
                    <div style={{ fontSize: '0.6rem', color: '#f6f2c0', opacity: 0.8, letterSpacing: '1px' }}>
                      {selectedClan.sigilLabel}
                    </div>
                    <div className="banner-gold-fringe" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PROCLAMATION BADGE */}
          <AnimatePresence>
            {stage === 'claimed' && (
              <motion.div
                className="conquest-proclamation"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="proclamation-pulse" />
                <div>
                  <div className="proclamation-text">
                    SECTOR 05 CLAIMED • 100% DOMINION
                  </div>
                  <div className="proclamation-sub">
                    {selectedClan.runnerName} established stronghold for {selectedClan.name}
                  </div>
                </div>
                <CheckCircle size={20} style={{ color: selectedClan.color, marginLeft: '8px' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ConquestAnimationSection;
