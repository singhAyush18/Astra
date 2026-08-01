import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sword, Map, Trophy, Scroll, Menu, X, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import StreakFlame from './StreakFlame';
import UserMenu from './UserMenu';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ streak = 0 }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-logo">
          <div className="logo-icon">
            <Sword size={24} />
          </div>
          <div className="logo-text">
            <span className="logo-astra">ASTRA</span>
            <span className="logo-subtitle">STRIDE WARS</span>
          </div>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={closeMobile}>
            <Map size={16} /> Kingdom
          </Link>
          <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`} onClick={closeMobile}>
            <Scroll size={16} /> History
          </Link>
          <Link to="/territories" className={`nav-link ${location.pathname === '/territories' ? 'active' : ''}`} onClick={closeMobile}>
            <Map size={16} /> Territories
          </Link>
          <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`} onClick={closeMobile}>
            <Trophy size={16} /> Leaderboard
          </Link>
          <Link to="/clans" className={`nav-link ${location.pathname === '/clans' ? 'active' : ''}`} onClick={closeMobile}>
            <Shield size={16} /> Clans
          </Link>
          {!['/dashboard', '/leaderboard', '/history', '/territories', '/clans'].includes(location.pathname) && (
            <Link to="/dashboard" className="nav-cta" onClick={closeMobile}>
              Enter the Realm
            </Link>
          )}
        </div>

        <div className="navbar-right">
          {isAuthenticated && <StreakFlame streak={streak} />}
          {isAuthenticated && <UserMenu />}
          
          <button 
            className="mobile-toggle" 
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
