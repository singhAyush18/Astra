import { ShieldAlert, Flame } from 'lucide-react';
import './LandingSections.css';

const MOCK_CONQUEST_EVENTS = [
  { clan: '[SOLAR PALADINS]', runner: 'Warlord Aurelius', action: 'fortified', location: 'Citadel of Dawn', dist: '12.4 km', time: '1m ago' },
  { clan: '[CRIMSON WARLORDS]', runner: 'Centurion Drake', action: 'captured sector', location: 'Iron Foothills', dist: '8.2 km', time: '3m ago' },
  { clan: '[SHADOW DYNASTY]', runner: 'Legatus Vesper', action: 'breached defenses at', location: 'Obsidian Pass', dist: '15.0 km', time: '5m ago' },
  { clan: '[EMERALD VANGUARD]', runner: 'Sentinel Sylas', action: 'reclaimed stronghold', location: 'Whispering Vale', dist: '6.7 km', time: '8m ago' },
  { clan: '[SOLAR PALADINS]', runner: 'Praetor Kira', action: 'established siege line at', location: 'Golden Spire', dist: '10.5 km', time: '12m ago' },
  { clan: '[CRIMSON WARLORDS]', runner: 'Gladiator Rex', action: 'captured territory', location: 'Bloodfire Gorge', dist: '14.1 km', time: '15m ago' },
];

const WarTicker = () => {
  return (
    <div className="war-ticker-container">
      <div className="war-ticker-badge">
        <span className="war-ticker-pulse" />
        <Flame size={13} />
        <span>Live War Feed</span>
      </div>

      <div className="war-ticker-track">
        {/* Render twice for seamless infinite loop */}
        {[...MOCK_CONQUEST_EVENTS, ...MOCK_CONQUEST_EVENTS].map((ev, idx) => (
          <div key={idx} className="war-ticker-item">
            <span className="ticker-clan-tag">{ev.clan}</span>
            <span className="ticker-runner">{ev.runner}</span>
            <span className="ticker-action">{ev.action}</span>
            <span className="ticker-location">{ev.location}</span>
            <span className="ticker-dist">{ev.dist}</span>
            <span className="ticker-time">({ev.time})</span>
            <span style={{ color: 'rgba(212, 175, 55, 0.4)', margin: '0 8px' }}>⚔</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarTicker;
