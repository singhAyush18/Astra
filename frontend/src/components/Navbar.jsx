import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sword, Map, Trophy, Scroll, Menu, X, Shield, 
  Settings, Info, LogOut, ChevronRight, User, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StreakFlame from './StreakFlame';
import UserMenu from './UserMenu';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ streak }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const effectiveStreak = streak !== undefined ? streak : (user?.currentStreak || 0);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is active
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const toggleMobileMenu = () => {
    if (!mobileOpen) {
      setUserMenuOpen(false); // Close profile if opening explore menu
    }
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuToggle = (nextState) => {
    if (nextState) {
      setMobileOpen(false); // Close mobile drawer if opening profile menu
    }
    setUserMenuOpen(nextState);
  };

  const handleMobileLogout = () => {
    closeMobile();
    logout();
    navigate('/');
  };

  const username = user?.username || 'Vanguard';
  const initial = username.charAt(0).toUpperCase();
  const profilePicture = user?.profilePicture;
  const userLevel = user?.level || 1;

  return (
    <>
      <motion.nav 
        className="navbar"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="navbar-inner">
          <Link to="/dashboard" className="navbar-logo" onClick={closeMobile}>
            <div className="logo-icon">
              <Sword size={22} />
            </div>
            <div className="logo-text">
              <span className="logo-astra">ASTRA</span>
              <span className="logo-subtitle">STRIDE WARS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="navbar-links desktop-links">
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <Map size={16} /> Kingdom
            </Link>
            <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
              <Scroll size={16} /> History
            </Link>
            <Link to="/territories" className={`nav-link ${location.pathname === '/territories' ? 'active' : ''}`}>
              <Map size={16} /> Territories
            </Link>
            <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>
              <Trophy size={16} /> Leaderboard
            </Link>
            <Link to="/clans" className={`nav-link ${location.pathname === '/clans' ? 'active' : ''}`}>
              <Shield size={16} /> Clans
            </Link>
          </div>

          {/* Right Section */}
          <div className="navbar-right">
            {isAuthenticated && <StreakFlame streak={effectiveStreak} />}
            
            {isAuthenticated && (
              <UserMenu 
                isOpen={userMenuOpen}
                onToggle={handleUserMenuToggle}
                onClose={() => setUserMenuOpen(false)}
              />
            )}
            
            <button 
              className={`mobile-toggle ${mobileOpen ? 'is-active' : ''}`} 
              onClick={toggleMobileMenu}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      <div style={{ height: 'var(--navbar-height, 72px)' }} className="navbar-spacer"></div>

      {/* Full-Screen Mobile Drawer (Rendered outside transform container) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="mobile-drawer-portal">
            {/* Backdrop */}
            <motion.div 
              className="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMobile}
            />

            {/* Slide-out Menu Panel */}
            <motion.div 
              className="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
              <div className="mobile-drawer-header">
                <div className="drawer-title-wrap">
                  <span className="drawer-brand">ASTRA</span>
                  <span className="drawer-tag">Realm Navigation</span>
                </div>
                <button className="drawer-close-btn" onClick={closeMobile} aria-label="Close menu">
                  <X size={22} />
                </button>
              </div>

              {/* User Profile Card inside Drawer if Logged In */}
              {isAuthenticated && (
                <div className="mobile-profile-card" onClick={() => { closeMobile(); navigate('/settings'); }}>
                  <div className="mobile-profile-avatar">
                    {profilePicture ? (
                      <img src={profilePicture} alt={username} />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div className="mobile-profile-info">
                    <span className="mobile-username">{username}</span>
                    <div className="mobile-rank-badge">
                      <Sparkles size={12} color="#ffd700" />
                      <span>Level {userLevel} Vanguard</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="profile-arrow" />
                </div>
              )}

              {/* Navigation Options List */}
              <div className="mobile-nav-list">
                <span className="drawer-section-title">Explore Kingdom</span>
                
                <Link 
                  to="/dashboard" 
                  className={`mobile-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <div className="mobile-nav-icon gold-icon">
                    <Map size={18} />
                  </div>
                  <div className="mobile-nav-content">
                    <span className="mobile-nav-label">Kingdom</span>
                    <span className="mobile-nav-desc">Main domain & live conquest</span>
                  </div>
                  <ChevronRight size={16} className="nav-item-chevron" />
                </Link>

                <Link 
                  to="/history" 
                  className={`mobile-nav-item ${location.pathname === '/history' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <div className="mobile-nav-icon purple-icon">
                    <Scroll size={18} />
                  </div>
                  <div className="mobile-nav-content">
                    <span className="mobile-nav-label">Run History</span>
                    <span className="mobile-nav-desc">Past expeditions & logs</span>
                  </div>
                  <ChevronRight size={16} className="nav-item-chevron" />
                </Link>

                <Link 
                  to="/territories" 
                  className={`mobile-nav-item ${location.pathname === '/territories' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <div className="mobile-nav-icon cyan-icon">
                    <Map size={18} />
                  </div>
                  <div className="mobile-nav-content">
                    <span className="mobile-nav-label">Territories</span>
                    <span className="mobile-nav-desc">Sector dominion & grid map</span>
                  </div>
                  <ChevronRight size={16} className="nav-item-chevron" />
                </Link>

                <Link 
                  to="/leaderboard" 
                  className={`mobile-nav-item ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <div className="mobile-nav-icon yellow-icon">
                    <Trophy size={18} />
                  </div>
                  <div className="mobile-nav-content">
                    <span className="mobile-nav-label">Leaderboard</span>
                    <span className="mobile-nav-desc">Top warriors of the realm</span>
                  </div>
                  <ChevronRight size={16} className="nav-item-chevron" />
                </Link>

                <Link 
                  to="/clans" 
                  className={`mobile-nav-item ${location.pathname === '/clans' ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <div className="mobile-nav-icon emerald-icon">
                    <Shield size={18} />
                  </div>
                  <div className="mobile-nav-content">
                    <span className="mobile-nav-label">Clans</span>
                    <span className="mobile-nav-desc">Guild wars & alliances</span>
                  </div>
                  <ChevronRight size={16} className="nav-item-chevron" />
                </Link>
              </div>

              {/* Utility / Footer options */}
              <div className="mobile-drawer-footer">
                <Link 
                  to="/settings" 
                  className="mobile-footer-btn"
                  onClick={closeMobile}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>

                <Link 
                  to="/about" 
                  className="mobile-footer-btn"
                  onClick={closeMobile}
                >
                  <Info size={18} />
                  <span>About</span>
                </Link>

                {isAuthenticated && (
                  <button 
                    className="mobile-footer-btn logout-btn"
                    onClick={handleMobileLogout}
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
