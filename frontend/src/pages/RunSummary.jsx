import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, MapPin, Target, ChevronRight, Crown, Flame, Bot, Activity, HeartPulse, Compass, Swords, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import './RunSummary.css';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../utils/soundEffects';
import ConquestAlert from '../components/ConquestAlert';

function RunSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const summaryData = location.state;
  const [conquestAlert, setConquestAlert] = useState({ isOpen: false, type: 'claim', gridId: '', rivalName: '', influence: 100 });

  useEffect(() => {
    if (!summaryData) {
      navigate('/dashboard');
      return;
    }
    
    // Play initial spoils fanfare
    soundEffects.playVictoryFanfare();

    // Trigger territory conquest alert if a territory was claimed or usurped
    if (summaryData.grid?.claimed && summaryData.grid?.gridId) {
      const isUsurped = summaryData.grid.rulerId && summaryData.grid.rulerId !== user?._id?.toString();
      setTimeout(() => {
        setConquestAlert({
          isOpen: true,
          type: isUsurped ? 'usurp' : 'claim',
          gridId: summaryData.grid.gridId,
          rivalName: summaryData.grid.rulerName || 'Rival Ruler',
          influence: summaryData.grid.influenceAdded || 100
        });
      }, 1000);
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

  const { run, xpEarned, level, currentStreak } = summaryData;
  const coachDebrief = summaryData.coachDebrief || run?.coachDebrief;

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
            
            {xpEarned !== undefined && (
              <div className="reward-item xp-reward">
                <div className="reward-icon gold-glow">
                  <Zap size={24} />
                </div>
                <div className="reward-details">
                  <span className="reward-amount">+{xpEarned.toLocaleString()} XP</span>
                  <span className="reward-label">Experience Earned</span>
                </div>
              </div>
            )}

            {xpEarned === undefined && (
              <div className="reward-item xp-reward" style={{ opacity: 0.6 }}>
                <div className="reward-icon" style={{ boxShadow: 'none' }}>
                  <Zap size={24} color="#666" />
                </div>
                <div className="reward-details">
                  <span className="reward-amount" style={{ color: '#aaa' }}>Run Discarded</span>
                  <span className="reward-label">Distance was too short to earn rewards</span>
                </div>
              </div>
            )}

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

            {run?.gridBreakdown && run.gridBreakdown.length > 0 && (
              <div className="reward-item territory-reward" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <div className="reward-icon purple-glow">
                    <MapPin size={24} />
                  </div>
                  <span className="reward-amount" style={{ fontSize: '1rem' }}>Territories Conquered</span>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {run.gridBreakdown.map((g, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(212, 175, 55, 0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setConquestAlert({
                          isOpen: true,
                          type: 'claim',
                          gridId: g.gridId,
                          influence: g.influenceEarned
                        });
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.15)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={14} color="#ffd700" />
                        <span style={{ color: '#d4af37', fontFamily: 'monospace', fontWeight: 600 }}>{g.gridId}</span>
                      </div>
                      <span style={{ color: '#00e5ff', fontSize: '0.9rem', fontWeight: 600 }}>+{g.influenceEarned} Influence</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* AI Tactical Coach Debrief Card */}
          {coachDebrief && (
            <motion.div
              className="summary-card coach-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="coach-card-header">
                <div className="coach-title-wrap">
                  <div className="coach-agent-badge">
                    <Bot size={18} />
                    <span>Tactical AI Coach</span>
                  </div>
                  <h3 className="coach-headline">{coachDebrief.headline}</h3>
                </div>
                <div className={`rating-rank-badge rank-${(coachDebrief.performanceRating || 'A').toLowerCase()}`}>
                  <span className="rank-text">{coachDebrief.performanceRating || 'A'}</span>
                  <span className="rank-sub">GRADE</span>
                </div>
              </div>

              <div className="coach-intel-list">
                <div className="intel-item">
                  <div className="intel-icon cyan-glow">
                    <Activity size={18} />
                  </div>
                  <div className="intel-content">
                    <span className="intel-label">Pacing & Effort</span>
                    <p className="intel-text">{coachDebrief.pacingAnalysis}</p>
                  </div>
                </div>

                <div className="intel-item">
                  <div className="intel-icon green-glow">
                    <HeartPulse size={18} />
                  </div>
                  <div className="intel-content">
                    <span className="intel-label">Recovery Protocol</span>
                    <p className="intel-text">{coachDebrief.recoveryAdvice}</p>
                  </div>
                </div>

                <div className="intel-item">
                  <div className="intel-icon gold-glow">
                    <Compass size={18} />
                  </div>
                  <div className="intel-content">
                    <span className="intel-label">Next Target</span>
                    <p className="intel-text">{coachDebrief.nextWorkoutTarget}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
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

      {/* Territory Conquest Celebration Alert */}
      <ConquestAlert
        isOpen={conquestAlert.isOpen}
        type={conquestAlert.type}
        gridId={conquestAlert.gridId}
        rivalName={conquestAlert.rivalName}
        influence={conquestAlert.influence}
        onClose={() => setConquestAlert(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default RunSummary;
