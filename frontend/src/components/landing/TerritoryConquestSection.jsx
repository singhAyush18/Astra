import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Crown, Navigation, Flame, User, Footprints, Trophy, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mapBg from '../../assets/map_bg.jpg';
import './TerritoryConquestSection.css';

const FACTION_ZONES = [
  { id: 'frost', name: 'Northern Frostholds', sigil: '🦁', color: '#3498db', top: '24%', left: '38%', territories: 18 },
  { id: 'iron', name: 'Iron Ascendancy', sigil: '⚔️', color: '#e74c3c', top: '34%', left: '68%', territories: 24 },
  { id: 'sylvani', name: 'Sylvani Covenant', sigil: '🦌', color: '#2ecc71', top: '65%', left: '32%', territories: 15 },
  { id: 'solar', name: 'Solar Dominion', sigil: '👑', color: '#f1c40f', top: '70%', left: '62%', territories: 29 }
];

const TerritoryConquestSection = () => {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState(FACTION_ZONES[3]);

  return (
    <section className="battlefield-section-realm" id="territory-conquest">
      {/* Right Vertical Editorial Text */}
      <div className="battlefield-editorial-right">
        <span className="battlefield-vertical-text">
          REAL RUNS. REAL TERRITORIES. A STRONGER YOU.
        </span>
      </div>

      <div className="battlefield-content-wrap">
        {/* Left Column: Heading & Call to Action */}
        <motion.div
          className="battlefield-info-col"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="battlefield-main-title">
            A REAL WORLD<br />BATTLEFIELD
          </h2>
          <p className="battlefield-lead-desc">
            Every run shapes the map. Claim grids, conquer rivals, and build your kingdom on real locations.
          </p>

          <button
            className="btn-crimson-battle"
            onClick={() => navigate('/territory-map')}
            style={{ marginTop: '28px' }}
          >
            <span>EXPLORE THE MAP</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>
        </motion.div>

        {/* Right Column: Fantasy Map & 3D Companion Smartphone Mockup */}
        <motion.div
          className="battlefield-showcase-col"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Tactical Map Display */}
          <div className="tactical-map-board" style={{ backgroundImage: `url(${mapBg})` }}>
            <div className="map-grid-overlay" />

            {/* Interactive Faction Pins */}
            {FACTION_ZONES.map((zone) => (
              <div
                key={zone.id}
                className={`faction-map-pin ${activeZone.id === zone.id ? 'active' : ''}`}
                style={{ top: zone.top, left: zone.left, '--pin-color': zone.color }}
                onClick={() => setActiveZone(zone)}
              >
                <div className="pin-crest-badge">
                  <span>{zone.sigil}</span>
                </div>
                <div className="pin-pulse" />
              </div>
            ))}

            {/* Floating Mobile Companion App Mockup */}
            <div className="phone-device-mockup">
              <div className="phone-outer-shell">
                <div className="phone-notch">
                  <div className="phone-speaker" />
                  <div className="phone-camera" />
                </div>

                <div className="phone-screen-content">
                  {/* Phone App Top Bar */}
                  <div className="phone-top-bar">
                    <span className="phone-hamburger">≡</span>
                    <span className="phone-app-title">ASTRA</span>
                    <span className="phone-scan-icon">⛶</span>
                  </div>

                  {/* Phone Map Visual */}
                  <div className="phone-mini-map">
                    <div className="phone-gps-trail">
                      <div className="phone-runner-dot">
                        <Crown size={12} className="runner-crown-glyph" />
                      </div>
                    </div>
                  </div>

                  {/* Phone Floating Live Telemetry HUD */}
                  <div className="phone-hud-card">
                    <div className="phone-distance-row">
                      <span className="phone-dist-val">5.24 km</span>
                      <span className="phone-xp-pill">+120 XP</span>
                    </div>
                    <div className="phone-pace-row">
                      <span>19:50</span>
                      <span>·</span>
                      <span>3:47 /km</span>
                    </div>
                  </div>

                  {/* Phone Kingdom Status Drawer */}
                  <div className="phone-kingdom-drawer">
                    <div className="phone-drawer-left">
                      <Shield size={14} className="drawer-shield-icon" />
                      <div>
                        <div className="phone-drawer-title">Your Kingdom</div>
                        <div className="phone-drawer-sub">4 Territories</div>
                      </div>
                    </div>
                    <span className="phone-drawer-arrow">›</span>
                  </div>

                  {/* Phone Bottom Nav */}
                  <div className="phone-bottom-nav">
                    <div className="phone-nav-tab active">
                      <Footprints size={14} />
                      <span>Run</span>
                    </div>
                    <div className="phone-nav-tab">
                      <Swords size={14} />
                      <span>Kingdom</span>
                    </div>
                    <div className="phone-nav-tab">
                      <Trophy size={14} />
                      <span>Leaderboard</span>
                    </div>
                    <div className="phone-nav-tab">
                      <User size={14} />
                      <span>Profile</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TerritoryConquestSection;
