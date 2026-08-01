import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Info, LogOut, ChevronDown } from 'lucide-react';
import './UserMenu.css';

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load user data and listen for profile updates
  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    };
    
    loadUser();
    
    window.addEventListener('profileUpdated', loadUser);
    return () => window.removeEventListener('profileUpdated', loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setOpen(false);
    navigate('/');
  };

  const username = userData?.username || 'User';
  const initial = username.charAt(0).toUpperCase();
  const profilePicture = userData?.profilePicture;

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className={`user-menu-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="User menu"
      >
        <div className="user-avatar">
          {profilePicture ? (
            <img src={profilePicture} alt={username} className="avatar-img" />
          ) : (
            <span className="user-initial">{initial}</span>
          )}
        </div>
        <ChevronDown size={14} className={`user-chevron ${open ? 'rotated' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            className="user-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* User info header */}
            <div 
              className="dropdown-header clickable-header" 
              onClick={() => { setOpen(false); navigate('/settings'); }}
            >
              <div className="dropdown-avatar">
                {profilePicture ? (
                  <img src={profilePicture} alt={username} className="avatar-img" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="dropdown-user-info">
                <span className="dropdown-username">{username}</span>
                <span className="dropdown-role">View Profile</span>
              </div>
            </div>

            <div className="dropdown-divider" />

            {/* Menu items */}
            <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/settings'); }}>
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/about'); }}>
              <Info size={16} />
              <span>About</span>
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
