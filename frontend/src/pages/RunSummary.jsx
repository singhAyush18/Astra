import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, MapPin, Target, ChevronRight, Crown, Flame } from 'lucide-react';
import Navbar from '../components/Navbar';
import './RunSummary.css';
import { useAuth } from '../context/AuthContext';

function RunSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const summaryData = location.state;

  useEffect(() => {
    if (!summaryData) {
      navigate('/dashboard');
      return;
    }
    
    // Optimistically update user context with new level/xp if available
    if (user && (summaryData.xpEarned || summaryData.level)) {
      updateUser({
        ...user,
        xp: (user.xp || 0) + (summaryData.xpEarned || 0),
        level: summaryData.level || user.level,
        currentStreak: summaryData.currentStreak || user.currentStreak
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!summaryData) return null;

  const { run, xpEarned, level, currentStreak, grid } = summaryData;

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const isLevelUp = user && level > user.level;

  return (
    <div className="run-summary-container">
      <Navbar streak={currentStreak} />
      
      <main className="summary-main">
        <motion.div 
          className="summary-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="victory-icon">
            <Trophy size={48} />
          </div>
          <h1 className="gold-text">Run Conquered</h1>
          <p className="subtitle">The realm acknowledges your effort.</p>
        </motion.div>

        <div className="summary-grid">
          {/* Main Stats Card */}
          <motion.div 
            className="summary-card stats-card"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3>Run Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <MapPin size={20} className="stat-icon" />
                <span className="stat-val">{(run?.distance || 0).toFixed(2)}</span>
                <span className="stat-unit">km</span>
              </div>
              <div className="stat-box">
                <Target size={20} className="stat-icon" />
                <span className="stat-val">{run?.pace || '--:--'}</span>
                <span className="stat-unit">min/km</span>
              </div>
              <div className="stat-box">
                <Flame size={20} className="stat-icon" />
                <span className="stat-val">{formatDuration(run?.duration)}</span>
                <span className="stat-unit">Time</span>
              </div>
            </div>
          </motion.div>

          {/* Rewards Card */}
          <motion.div 
            className="summary-card rewards-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3>Spoils of War</h3>
            
            <div className="reward-item xp-reward">
              <div className="reward-icon gold-glow">
                <Zap size={24} />
              </div>
              <div className="reward-details">
                <span className="reward-amount">+{xpEarned?.toLocaleString()} XP</span>
                <span className="reward-label">Experience Earned</span>
              </div>
            </div>

            {isLevelUp && (
              <motion.div 
                className="reward-item level-reward"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <div className="reward-icon blue-glow">
                  <Crown size={24} />
                </div>
                <div className="reward-details">
                  <span className="reward-amount">Level {level} Reached!</span>
                  <span className="reward-label">You have grown stronger</span>
                </div>
              </motion.div>
            )}

            {grid && (
              <div className="reward-item territory-reward">
                <div className="reward-icon purple-glow">
                  <MapPin size={24} />
                </div>
                <div className="reward-details">
                  <span className="reward-amount">Grid {grid.gridId}</span>
                  <span className="reward-label">+{grid.influenceAdded} Influence added</span>
                  {grid.rulerName && (
                    <span className="grid-ruler">Current Ruler: {grid.rulerName}</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div 
          className="summary-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <button 
            className="return-btn gold-shimmer"
            onClick={() => navigate('/dashboard')}
          >
            <span>Return to Kingdom</span>
            <ChevronRight size={18} />
          </button>
        </motion.div>
      </main>
    </div>
  );
}

export default RunSummary;
