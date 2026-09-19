import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Swords, Flame, Crown, Check, Sparkles } from 'lucide-react';
import { RANKS_CONFIG } from '../../utils/rankUtils';
import ranksBg from '../../assets/ranks_bg.jpg';
import './RankProgressionSection.css';

const RankProgressionSection = () => {
  const [activeRank, setActiveRank] = useState(RANKS_CONFIG[0]);
  const [hoveredRank, setHoveredRank] = useState(null);

  const displayRank = hoveredRank || activeRank;

  return (
    <section className="ranks-section-realm" id="rank-progression" style={{ backgroundImage: `url(${ranksBg})` }}>
      <div className="ranks-dark-vignette" />

      {/* Right Editorial Quote */}
      <div className="ranks-editorial-right">
        <span className="ranks-vertical-quote">
          DISCIPLINE CREATES FREEDOM.
        </span>
      </div>

      <div className="ranks-inner-wrap">
        {/* Header Block */}
        <motion.div
          className="ranks-header-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="ranks-main-title">RISE THROUGH THE RANKS</h2>
          <p className="ranks-lead-desc">
            From runner to ruler. Earn XP, climb levels, and leave your mark.
          </p>
        </motion.div>

        {/* Connected Horizontal Heraldic Sigil Track */}
        <div className="ranks-sigil-track">
          <div className="ranks-connecting-line" />

          {RANKS_CONFIG.map((rank, idx) => {
            const isSelected = activeRank.id === rank.id;
            const isHovered = hoveredRank?.id === rank.id;

            return (
              <div
                key={rank.id}
                className={`sigil-node-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => setActiveRank(rank)}
                onMouseEnter={() => setHoveredRank(rank)}
                onMouseLeave={() => setHoveredRank(null)}
              >
                {/* Circular Heraldic Badge */}
                <div
                  className="sigil-badge-circle"
                  style={{
                    '--sigil-color': rank.color,
                    '--sigil-glow': rank.glow
                  }}
                >
                  <span className="sigil-emoji">{rank.icon}</span>
                  <div className="sigil-ring-bevel" />
                </div>

                {/* Rank Name & XP Subtitle */}
                <div className="sigil-text-group">
                  <h4 className="sigil-rank-name">{rank.name}</h4>
                  <span className="sigil-xp-range">{rank.xpRange}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Rank Relic & Privilege Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayRank.id}
            className="rank-perk-detail-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            style={{ '--rank-theme-color': displayRank.color }}
          >
            <div className="perk-card-header">
              <div className="perk-header-left">
                <span className="perk-card-icon">{displayRank.icon}</span>
                <div>
                  <h3 className="perk-card-title">{displayRank.name} — {displayRank.title}</h3>
                  <span className="perk-card-level">{displayRank.rangeLabel} ({displayRank.xpRange})</span>
                </div>
              </div>

              <div className="perk-relic-badge">
                <Sparkles size={14} style={{ color: displayRank.color }} />
                <span><strong>Relic:</strong> {displayRank.relic}</span>
              </div>
            </div>

            <p className="perk-card-desc">{displayRank.description}</p>

            <div className="perk-list-grid">
              {displayRank.perks.map((perk, i) => (
                <div key={i} className="perk-list-item">
                  <div className="perk-check-bullet" style={{ background: displayRank.color }}>
                    <Check size={12} strokeWidth={3} color="#0d0c0b" />
                  </div>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default RankProgressionSection;
