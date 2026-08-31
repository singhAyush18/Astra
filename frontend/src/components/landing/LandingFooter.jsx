import { Link } from 'react-router-dom';
import { Sword, Compass, Shield, Trophy } from 'lucide-react';
import './LandingSections.css';

const LandingFooter = () => {
  return (
    <footer className="imperial-footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <div className="footer-brand-title gold-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sword size={22} />
            <span>ASTRA: STRIDE WARS</span>
          </div>
          <p className="footer-brand-desc">
            The premier historical conquest running experience. Transforming physical movement into territorial warfare, clan glory, and imperial dominion.
          </p>
        </div>

        <div>
          <h4 className="footer-col-title">Warfare</h4>
          <ul className="footer-links-list">
            <li><a href="#territory-conquest">Territory Map</a></li>
            <li><a href="#clans-section">Ancient Clans</a></li>
            <li><a href="#conquest-calculator">War Simulator</a></li>
            <li><a href="#rank-progression">Warlord Hierarchy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">The Realm</h4>
          <ul className="footer-links-list">
            <li><a href="#hall-of-conquerors">Hall of Conquerors</a></li>
            <li><Link to="/about">Imperial Codex (About)</Link></li>
            <li><Link to="/signup">Enlist Warriors</Link></li>
            <li><Link to="/login">Warlord Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Honor & Code</h4>
          <ul className="footer-links-list">
            <li><a href="#privacy">Code of Honor</a></li>
            <li><a href="#terms">Terms of Conquest</a></li>
            <li><a href="#support">Signal Courier (Support)</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <span>© {new Date().getFullYear()} Astra Stride Wars. All Realm Rights Reserved.</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27ae60', display: 'inline-block' }} />
          <span>Realm Servers Operational (GPS Live)</span>
        </span>
      </div>
    </footer>
  );
};

export default LandingFooter;
