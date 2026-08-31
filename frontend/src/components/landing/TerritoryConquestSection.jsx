import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Swords, Compass, Zap, CheckCircle2, Crosshair, Play, RefreshCw } from 'lucide-react';
import './LandingSections.css';

const SECTORS_DATA = [
  {
    id: 'SEC-01',
    name: 'Iron Citadel',
    code: 'SECTOR ALPHA-1',
    status: 'contested',
    statusLabel: 'Under Siege',
    controllingClan: 'Solar Paladins',
    clanColor: '#f0d060',
    defenseRating: '88% Fortified',
    controlPercent: 68,
    areaKm2: '4.8 km²',
    activeRunners: 142,
    buff: '+15% Honor Multiplier on Morning Strides (06:00 - 09:00)',
    description: 'A fortified stronghold towering over the northern boundary. Heavy elevation gains give defending runners strategic high-ground stamina bonuses.',
    recentSiege: 'Crimson Warlords attacked 12m ago with 34.2 collective km.'
  },
  {
    id: 'SEC-02',
    name: 'Shadow Reach',
    code: 'SECTOR BETA-4',
    status: 'claimed',
    statusLabel: 'Held by Dynasty',
    controllingClan: 'Shadow Dynasty',
    clanColor: '#a29bfe',
    defenseRating: '95% Fortified',
    controlPercent: 92,
    areaKm2: '7.2 km²',
    activeRunners: 98,
    buff: 'Shadow Cloak: Night runs earn 2x Territory Tokens after 20:00',
    description: 'Veiled in urban dusk, this sprawling flat sector is the primary trade route connecting the eastern provinces. Controlled by stealth marathoners.',
    recentSiege: 'Vanguard scouts breached the perimeter 1h ago.'
  },
  {
    id: 'SEC-03',
    name: 'Crimson Foothills',
    code: 'SECTOR GAMMA-9',
    status: 'contested',
    statusLabel: 'Bloodfire Battle',
    controllingClan: 'Crimson Warlords',
    clanColor: '#ff7675',
    defenseRating: '54% Fortified',
    controlPercent: 54,
    areaKm2: '5.6 km²',
    activeRunners: 215,
    buff: 'Beserker Surge: Sprints under 4:30/km deal triple siege damage',
    description: 'A grueling hilly territory known as the Crucible of Warlords. Every meter conquered requires immense cardiovascular resolve.',
    recentSiege: 'Massive clan clash underway: 4 clans contesting control.'
  },
  {
    id: 'SEC-04',
    name: 'Solar Sanctum',
    code: 'SECTOR DELTA-2',
    status: 'fortified',
    statusLabel: 'Impervious Gate',
    controllingClan: 'Solar Paladins',
    clanColor: '#f0d060',
    defenseRating: '98% Fortified',
    controlPercent: 98,
    areaKm2: '6.1 km²',
    activeRunners: 84,
    buff: 'Radiant Shield: 50% slower territory decay during inactive days',
    description: 'The ancient spiritual heart of the realm. Fortified by thousands of unbroken daily running streaks.',
    recentSiege: 'All defense towers at maximum resonance.'
  },
  {
    id: 'SEC-05',
    name: 'Emerald Glade',
    code: 'SECTOR EPSILON-7',
    status: 'claimed',
    statusLabel: 'Vanguard Bastion',
    controllingClan: 'Emerald Vanguard',
    clanColor: '#2ecc71',
    defenseRating: '82% Fortified',
    controlPercent: 82,
    areaKm2: '9.4 km²',
    activeRunners: 120,
    buff: 'Trail Endurance: +20% Calorie Burn Siege efficiency on trail runs',
    description: 'Dense natural trails and parklands defended by endurance specialists who excel in ultra-distance conquests.',
    recentSiege: 'Defended successfully against Solar Paladins raid.'
  },
  {
    id: 'SEC-06',
    name: 'The Obsidian Spire',
    code: 'SECTOR ZETA-X',
    status: 'contested',
    statusLabel: 'Open Conflict',
    controllingClan: 'Neutral / Contested',
    clanColor: '#d4af37',
    defenseRating: '40% Fortified',
    controlPercent: 40,
    areaKm2: '11.0 km²',
    activeRunners: 340,
    buff: 'Imperial Crown: Holding the Spire grants sovereign realm dominion',
    description: 'The central epicenter of Astra Stride Wars. Clans fight daily in weekly siege events to plant their war banner at the summit.',
    recentSiege: 'War declaration active: Next clan clash ends in 18 hours.'
  },
];

const TerritoryConquestSection = () => {
  const [selectedSector, setSelectedSector] = useState(SECTORS_DATA[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(15);
  const [simMessage, setSimMessage] = useState('Ready to engage');

  const handleSimulateRun = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimMessage('Mobilizing stride GPS...');
    setSimProgress(20);

    setTimeout(() => {
      setSimProgress(55);
      setSimMessage('Breaching sector perimeter (2.5 km completed)...');
    }, 900);

    setTimeout(() => {
      setSimProgress(100);
      setSimMessage('Territory Captured! +500 War Honor Earned!');
      setSelectedSector(prev => ({
        ...prev,
        controlPercent: Math.min(100, prev.controlPercent + 12),
        activeRunners: prev.activeRunners + 1
      }));
    }, 2000);

    setTimeout(() => {
      setIsSimulating(false);
      setSimProgress(15);
    }, 4500);
  };

  return (
    <section id="territory-conquest" className="landing-section">
      <div className="section-header-wrap">
        <motion.div
          className="section-subtitle-badge"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Crosshair size={14} />
          <span>Real-World GPS Warfare</span>
        </motion.div>
        <h2 className="section-main-title gold-text">Territory Conquest Map</h2>
        <p className="section-lead-text">
          Your neighborhood is the battlefield. Every kilometer run claims real geographic hex sectors for you and your Clan. Fortify your perimeter, breach enemy zones, and claim sovereign dominion.
        </p>
      </div>

      <div className="territory-showcase-grid">
        {/* Tactical Map Viewport */}
        <motion.div
          className="tactical-map-viewport"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="map-hud-header">
            <div className="hud-title-block">
              <span className="hud-radar-dot" />
              <span className="hud-title">Tactical Realm Radar</span>
            </div>
            <span className="hud-coords">GPS 40.7128° N, 74.0060° W</span>
          </div>

          {/* Hex Grid Selection */}
          <div className="tactical-hex-grid">
            {SECTORS_DATA.map((sector) => {
              const isSelected = selectedSector.id === sector.id;
              return (
                <div
                  key={sector.id}
                  className={`hex-sector-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSector(sector)}
                >
                  <div className="sector-card-top">
                    <span className="sector-code">{sector.id}</span>
                    <span className={`sector-status-pill status-${sector.status}`}>
                      {sector.statusLabel}
                    </span>
                  </div>
                  <div className="sector-name">{sector.name}</div>
                  <div className="sector-holder">
                    <Shield size={12} style={{ color: sector.clanColor }} />
                    <span>{sector.controllingClan}</span>
                  </div>
                  <div className="sector-control-bar">
                    <div
                      className="sector-control-fill"
                      style={{
                        width: `${sector.controlPercent}%`,
                        background: sector.clanColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Stride Simulation Panel */}
          <div className="map-simulation-panel">
            <div className="sim-header">
              <span className="sim-title">Interactive Stride Simulator</span>
              <button
                className="sim-trigger-btn"
                onClick={handleSimulateRun}
                disabled={isSimulating}
              >
                {isSimulating ? <RefreshCw size={12} className="spin-icon" /> : <Play size={12} />}
                <span>{isSimulating ? 'Simulating Run...' : 'Simulate 5km Conquest'}</span>
              </button>
            </div>

            <div className="sim-route-track">
              <div
                className="sim-runner-dot"
                style={{ left: `${simProgress}%` }}
              />
              <div className="sim-route-info">
                <span>START: Sector Border</span>
                <span style={{ color: isSimulating ? '#f0d060' : 'var(--text-secondary)' }}>
                  {simMessage}
                </span>
                <span>TARGET: {selectedSector.name}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Territory Detail Inspector */}
        <motion.div
          className="territory-inspector-panel"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inspector-sector-badge">
            <Compass size={14} />
            <span>{selectedSector.code}</span>
          </div>

          <h3 className="inspector-title gold-text">{selectedSector.name}</h3>
          <p className="inspector-desc">{selectedSector.description}</p>

          <div className="inspector-stats-grid">
            <div className="inspector-stat-box">
              <div className="stat-box-label">Controlling Dynasty</div>
              <div className="stat-box-val gold">{selectedSector.controllingClan}</div>
            </div>

            <div className="inspector-stat-box">
              <div className="stat-box-label">Defense Strength</div>
              <div className="stat-box-val emerald">{selectedSector.controlPercent}%</div>
            </div>

            <div className="inspector-stat-box">
              <div className="stat-box-label">Conquest Area</div>
              <div className="stat-box-val">{selectedSector.areaKm2}</div>
            </div>

            <div className="inspector-stat-box">
              <div className="stat-box-label">Active Legionnaires</div>
              <div className="stat-box-val crimson">{selectedSector.activeRunners} Rulers</div>
            </div>
          </div>

          <div className="inspector-buff-card">
            <div className="buff-header">
              <Zap size={15} />
              <span>Territory Control Buff</span>
            </div>
            <p className="buff-text">{selectedSector.buff}</p>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>Chronicle: </span>
            {selectedSector.recentSiege}
          </div>

          <a href="/signup" className="conquer участвовать conquer-cta-btn gold-shimmer">
            <Swords size={18} />
            <span>Claim This Sector</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default TerritoryConquestSection;
