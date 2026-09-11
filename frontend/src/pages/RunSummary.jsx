import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, MapPin, Target, ChevronRight, Crown, Flame, Bot, Activity, HeartPulse, Compass, Swords, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import './RunSummary.css';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../utils/soundEffects';
import ConquestAlert from '../components/ConquestAlert';
import { runsAPI } from '../api';

function RunSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [summaryData, setSummaryData] = useState(() => {
    if (location.state) {
      try {
        sessionStorage.setItem('last_run_summary', JSON.stringify(location.state));
      } catch {}
      return location.state;
    }
    const saved = sessionStorage.getItem('last_run_summary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [conquestAlert, setConquestAlert] = useState({ isOpen: false, type: 'claim', gridId: '', rivalName: '', influence: 100 });
  const [coachDebrief, setCoachDebrief] = useState(summaryData?.coachDebrief || summaryData?.run?.coachDebrief || null);
  const [loadingDebrief, setLoadingDebrief] = useState(!summaryData?.coachDebrief && !summaryData?.run?.coachDebrief && !!summaryData?.run?._id);

  useEffect(() => {
    if (!summaryData) {
      navigate('/dashboard');
      return;
    }
    
    // Play initial spoils fanfare
    soundEffects.playVictoryFanfare();

    // If coach debrief is not yet populated, load it asynchronously
    const runId = summaryData.run?._id;
    if (!coachDebrief && runId) {
      setLoadingDebrief(true);
      runsAPI.generateDebrief(null, runId)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.coachDebrief) {
            setCoachDebrief(data.data.coachDebrief);
          }
        })
        .catch(err => {
          console.warn('[RunSummary] Error fetching coach debrief:', err);
        })
        .finally(() => {
          setLoadingDebrief(false);
        });
    }

    // Trigger territory conquest alert if a territory was newly claimed or usurped
    if (summaryData.grid?.gridId) {
      const { conquestType, isUsurped, rivalName, gridId, influenceAdded } = summaryData.grid;
      const isUsurp = conquestType === 'usurp' || !!isUsurped;

      // Only show conquest banner if territory was claimed or usurped from a rival
      if (conquestType === 'claim' || isUsurp) {
        setTimeout(() => {
          setConquestAlert({
            isOpen: true,
            type: isUsurp ? 'usurp' : 'claim',
            gridId: gridId,
            rivalName: rivalName || 'Rival Ruler',
            influence: influenceAdded || 100
          });
        }, 1000);
      }
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
                <span className="stat-val">{formatDuration(run?.duration)}</span>
                <span className="stat-unit">time</span>
              </div>

              <div className="stat-box">
                <Zap size={20} className="stat-icon" />
                <span className="stat-val">{run?.pace || "0:00"}</span>
                <span className="stat-unit">pace</span>
              </div>
            </div>
          </motion.div>

          {/* Spoils & Level Progression */}
          <motion.div 
            className="summary-card spoils-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3>Kingdom Spoils</h3>
            <div className="spoils-grid">
              <div className="spoil-item">
                <div className="spoil-icon xp-glow">
                  <Zap size={24} />
                </div>
                <div className="spoil-text">
                  <span className="spoil-amount">+{xpEarned || 0}</span>
                  <span className="spoil-label">XP Acquired</span>
                </div>
              </div>

              <div className="spoil-item">
                <div className="spoil-icon streak-glow">
                  <Flame size={24} />
                </div>
                <div className="spoil-text">
                  <span className="spoil-amount">{currentStreak || 1} Days</span>
                  <span className="spoil-label">Current Streak</span>
                </div>
              </div>
            </div>

            <div className="level-progress-section">
              <div className="level-bar-label">
                <span>Domain Mastery</span>
                <span>Level {level || 1}</span>
              </div>
              <div className="level-track">
                <motion.div 
                  className="level-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${((user?.xp || 0) % 500) / 5}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              {isLevelUp && (
                <p className="level-up-notify">👑 Level Up Achieved!</p>
              )}
            </div>
          </motion.div>

          {/* Territory Influence Breakdown */}
          <motion.div 
            className="summary-card grid-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3>Territory Conquest Breakdown</h3>
            {summaryData.grid ? (
              <div className="grid-summary-display">
                <div className="grid-status-badge">
                  {summaryData.grid.isUsurped ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d4d', fontWeight: 700 }}>
                      <Swords size={20} />
                      <span>Rival Sector Usurped!</span>
                    </div>
                  ) : summaryData.grid.claimed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffd700', fontWeight: 700 }}>
                      <Crown size={20} />
                      <span>Sector Claimed!</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00e5ff', fontWeight: 700 }}>
                      <MapPin size={20} />
                      <span>Territory Patrolled</span>
                    </div>
                  )}
                </div>

                <div className="grid-stats-row">
                  <div className="grid-stat">
                    <span className="stat-label">Sector Code</span>
                    <span className="stat-value">{summaryData.grid.gridId}</span>
                  </div>
                  <div className="grid-stat">
                    <span className="stat-label">Dominion Standing</span>
                    <span className="stat-value" style={{ color: '#00e5ff' }}>+{summaryData.grid.influenceAdded} Influence</span>
                  </div>
                  <div className="grid-stat">
                    <span className="stat-label">Sector Status</span>
                    <span className="stat-value">{summaryData.grid.rulerName ? `Ruled by ${summaryData.grid.rulerName}` : 'Unclaimed'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-grid-text">No significant territory traversed during this expedition.</p>
            )}

            {/* Multiple Grids Traversed List */}
            {run?.gridBreakdown && run.gridBreakdown.length > 0 && (
              <div className="grid-breakdown-list" style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#b0a890', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sectors Fortified</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {run.gridBreakdown.map((g) => (
                    <motion.div 
                      key={g.gridId}
                      style={{
                        background: 'rgba(20, 20, 40, 0.6)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
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

          {/* AI Tactical Coach Debrief Card - Live Loader or Full Debrief */}
          {loadingDebrief && (
            <motion.div
              className="summary-card coach-card coach-loading-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="coach-loader-content">
                <div className="coach-radar-anim">
                  <Bot size={28} className="coach-bot-icon" />
                  <div className="radar-pulse-ring" />
                </div>
                <div className="coach-loader-info">
                  <div className="coach-agent-badge">
                    <Bot size={14} />
                    <span>Tactical AI Coach</span>
                  </div>
                  <h4>Synthesizing Run Telemetry...</h4>
                  <p>Evaluating cadence, pacing velocity, and biomechanical strain</p>
                </div>
              </div>
            </motion.div>
          )}

          {coachDebrief && (
            <motion.div
              className="summary-card coach-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
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
