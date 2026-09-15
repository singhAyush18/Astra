import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Zap, MapPin, Target, ChevronRight, Crown, Flame, 
  Bot, Activity, HeartPulse, Compass, Swords, Sparkles, 
  FlameKindling, Shield, Share2, Check, AlertTriangle
} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  
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
    if (!seconds && seconds !== 0) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}m ${s}s`;
  };

  const isLevelUp = user && level && level > (user.level || 1);
  const currentXp = user?.xp || 0;
  const xpInCurrentLevel = currentXp % 500;
  const xpProgressPercent = Math.min(100, Math.max(5, (xpInCurrentLevel / 500) * 100));

  const handleShare = () => {
    const text = `⚔️ Just completed a ${(run?.distance || 0).toFixed(2)} km conquest run on ASTRA: Stride Wars! Gained +${xpEarned || 0} XP!`;
    if (navigator.share) {
      navigator.share({
        title: 'ASTRA Run Conquered',
        text: text,
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const calories = run?.calories || Math.round((run?.distance || 0) * 65);

  return (
    <div className="run-summary-container">
      <Navbar streak={currentStreak} />
      
      <main className="summary-main">
        {/* Hero Header */}
        <motion.div 
          className="summary-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="victory-icon-wrap">
            <div className="victory-icon">
              <Trophy size={42} />
            </div>
            <div className="victory-halo" />
          </div>

          <div className="header-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>EXPEDITION CONQUERED</span>
          </div>

          <h1 className="gold-text">Run Conquered</h1>
          <p className="subtitle">The realm registers your stride and yields its spoils, Vanguard.</p>
        </motion.div>

        {/* Anti-Cheat Alert Banner if Flagged */}
        {(summaryData?.antiCheat?.isFlagged || run?.antiCheat?.isFlagged) && (
          <motion.div
            className="summary-card anti-cheat-card"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="anti-cheat-header">
              <div className="anti-cheat-icon-wrap">
                <AlertTriangle size={24} />
              </div>
              <div className="anti-cheat-text-col">
                <h3 className="anti-cheat-title">Anti-Cheat Alert: Unrealistic Telemetry Detected</h3>
                <p className="anti-cheat-desc">
                  {(summaryData?.antiCheat?.reasons || run?.antiCheat?.reasons || []).join(' ') || 'Impossible movement velocity or teleportation detected.'}
                </p>
              </div>
            </div>
            <div className="anti-cheat-badge-row">
              <span className="anti-cheat-pill red-pill">Territory Conquests Withheld</span>
              <span className="anti-cheat-pill orange-pill">Leaderboard Protection Active</span>
              {(summaryData?.antiCheat?.isUserBanned || (summaryData?.antiCheat?.userViolations && summaryData?.antiCheat?.userViolations >= 2)) ? (
                <span className="anti-cheat-pill ban-pill">
                  ⛔ Strike 2/2: Permanent Realm Ban
                </span>
              ) : (
                <span className="anti-cheat-pill warning-pill">
                  ⚠️ Strike 1/2: Final Warning
                </span>
              )}
              {(summaryData?.antiCheat?.maxCalculatedSpeedKmh || run?.antiCheat?.maxCalculatedSpeedKmh) && (
                <span className="anti-cheat-pill cyan-pill">
                  Peak Velocity: {(summaryData?.antiCheat?.maxCalculatedSpeedKmh || run?.antiCheat?.maxCalculatedSpeedKmh).toFixed(1)} km/h
                </span>
              )}
            </div>
          </motion.div>
        )}

        <div className="summary-grid">
          {/* Main Telemetry Card */}
          <motion.div 
            className="summary-card stats-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="card-header-bar">
              <div className="card-header-left">
                <Activity size={18} className="card-title-icon" />
                <h3>Run Telemetry</h3>
              </div>
              <span className="card-tag">Verified</span>
            </div>

            <div className="stats-grid">
              <div className="stat-box distance-box">
                <div className="stat-box-header">
                  <div className="stat-icon-wrapper distance-glow">
                    <MapPin size={18} />
                  </div>
                  <span className="stat-label">Distance</span>
                </div>
                <div className="stat-box-value-row">
                  <span className="stat-val">{(run?.distance || 0).toFixed(2)}</span>
                  <span className="stat-unit">km</span>
                </div>
              </div>

              <div className="stat-box duration-box">
                <div className="stat-box-header">
                  <div className="stat-icon-wrapper duration-glow">
                    <Target size={18} />
                  </div>
                  <span className="stat-label">Duration</span>
                </div>
                <div className="stat-box-value-row">
                  <span className="stat-val stat-val-nowrap">{formatDuration(run?.duration)}</span>
                </div>
              </div>

              <div className="stat-box pace-box">
                <div className="stat-box-header">
                  <div className="stat-icon-wrapper pace-glow">
                    <Zap size={18} />
                  </div>
                  <span className="stat-label">Avg Pace</span>
                </div>
                <div className="stat-box-value-row">
                  <span className="stat-val">{run?.pace || "0:00"}</span>
                  <span className="stat-unit">/km</span>
                </div>
              </div>

              <div className="stat-box calories-box">
                <div className="stat-box-header">
                  <div className="stat-icon-wrapper calories-glow">
                    <FlameKindling size={18} />
                  </div>
                  <span className="stat-label">Energy</span>
                </div>
                <div className="stat-box-value-row">
                  <span className="stat-val">{calories}</span>
                  <span className="stat-unit">kcal</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Kingdom Spoils & Level Progression */}
          <motion.div 
            className="summary-card spoils-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="card-header-bar">
              <div className="card-header-left">
                <Trophy size={18} className="card-title-icon" />
                <h3>Kingdom Spoils</h3>
              </div>
              <span className="card-tag gold-tag">Rewarded</span>
            </div>

            <div className="spoils-grid">
              <div className="spoil-item xp-item">
                <div className="spoil-icon xp-glow">
                  <Zap size={24} />
                </div>
                <div className="spoil-text">
                  <span className="spoil-amount">+{xpEarned || 0}</span>
                  <span className="spoil-label">XP Acquired</span>
                </div>
              </div>

              <div className="spoil-item streak-item">
                <div className="spoil-icon streak-glow">
                  <Flame size={24} />
                </div>
                <div className="spoil-text">
                  <span className="spoil-amount">{currentStreak || 1} Days</span>
                  <span className="spoil-label">Active Streak</span>
                </div>
              </div>
            </div>

            <div className="level-progress-section">
              <div className="level-bar-label">
                <div className="level-name">
                  <Shield size={16} className="level-icon" />
                  <span>Domain Mastery</span>
                </div>
                <span className="level-rank">Level {level || 1}</span>
              </div>
              
              <div className="level-track">
                <motion.div 
                  className="level-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgressPercent}%` }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
              </div>

              <div className="level-meta">
                <span>{xpInCurrentLevel} / 500 XP</span>
                <span>{500 - xpInCurrentLevel} XP to Level {(level || 1) + 1}</span>
              </div>

              {isLevelUp && (
                <motion.div 
                  className="level-up-notify"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
                >
                  <Crown size={16} />
                  <span>Level Up Achieved! New Realm Privileges Unlocked</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Territory Conquest Breakdown */}
          <motion.div 
            className="summary-card grid-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="card-header-bar">
              <div className="card-header-left">
                <Swords size={18} className="card-title-icon" />
                <h3>Territory Conquest Breakdown</h3>
              </div>
              <span className="card-tag cyan-tag">Realm HUD</span>
            </div>

            {summaryData.grid ? (() => {
              const gridInfo = summaryData.grid;
              const isUserRuler = Boolean(
                gridInfo.isRuler || 
                (user && gridInfo.rulerName && user.username && gridInfo.rulerName.toLowerCase() === user.username.toLowerCase())
              );
              const isUnclaimed = !gridInfo.rulerName || gridInfo.rulerName === 'Unclaimed Wildland' || gridInfo.rulerName === 'Unclaimed';
              const hasClaimedNow = Boolean(gridInfo.claimed && isUserRuler);
              const hasUsurpedNow = Boolean(gridInfo.isUsurped && isUserRuler);

              let bannerClass = 'status-patrol';
              let bannerIcon = <Compass size={22} className="banner-icon" />;
              let bannerTitle = 'Territory Scouted';
              let bannerSub = `Added +${gridInfo.influenceAdded || 0} Influence across sector boundaries`;

              if (hasUsurpedNow) {
                bannerClass = 'status-usurp';
                bannerIcon = <Swords size={22} className="banner-icon" />;
                bannerTitle = 'Rival Overthrown & Usurped!';
                bannerSub = gridInfo.rivalName 
                  ? `You dethroned ${gridInfo.rivalName} and seized the throne!` 
                  : 'You defeated the occupying ruler and seized the throne!';
              } else if (hasClaimedNow) {
                bannerClass = 'status-claim';
                bannerIcon = <Crown size={22} className="banner-icon" />;
                bannerTitle = 'Sector Claimed!';
                bannerSub = 'You conquered the wildland and established realm dominion!';
              } else if (isUserRuler) {
                bannerClass = 'status-fortify';
                bannerIcon = <Shield size={22} className="banner-icon" />;
                bannerTitle = 'Domain Fortified';
                bannerSub = `Added +${gridInfo.influenceAdded || 0} defense influence to protect your throne`;
              } else if (isUnclaimed) {
                bannerClass = 'status-wildland';
                bannerIcon = <Flame size={22} className="banner-icon" />;
                bannerTitle = 'Wildland Scouted';
                bannerSub = `Added +${gridInfo.influenceAdded || 0} Influence toward claiming this territory (${gridInfo.totalInfluence || gridInfo.influenceAdded || 0}/500 to Claim)`;
              } else {
                bannerClass = 'status-contest';
                bannerIcon = <Zap size={22} className="banner-icon" />;
                bannerTitle = 'Territory Contested';
                bannerSub = `Generated +${gridInfo.influenceAdded || 0} Influence contesting ${gridInfo.rulerName}'s rule`;
              }

              return (
                <div className="grid-summary-display">
                  <div className={`grid-status-banner ${bannerClass}`}>
                    {bannerIcon}
                    <div className="banner-text">
                      <span className="banner-title">{bannerTitle}</span>
                      <span className="banner-sub">{bannerSub}</span>
                    </div>
                  </div>

                  <div className="grid-stats-row">
                    <div className="grid-stat-card">
                      <span className="grid-stat-label">Sector Code</span>
                      <span className="grid-stat-code">{gridInfo.gridId}</span>
                    </div>
                    <div className="grid-stat-card">
                      <span className="grid-stat-label">Your Standing</span>
                      <span className="grid-stat-influence">+{gridInfo.influenceAdded || 0} Influence</span>
                    </div>
                    <div className="grid-stat-card">
                      <span className="grid-stat-label">Sector Ruler</span>
                      <span className={`grid-stat-ruler ${isUserRuler ? 'ruler-you' : ''}`}>
                        {isUserRuler ? '👑 You (Sovereign)' : isUnclaimed ? '🌲 Unclaimed' : `⚔️ Ruled by ${gridInfo.rulerName}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="no-grid-box">
                <MapPin size={24} className="no-grid-icon" />
                <p className="no-grid-text">No major sector boundary traversed during this expedition.</p>
              </div>
            )}

            {/* Multiple Grids Traversed Breakdown List */}
            {run?.gridBreakdown && run.gridBreakdown.length > 0 && (
              <div className="grid-breakdown-wrapper">
                <h4 className="breakdown-title">
                  <Sparkles size={14} />
                  <span>Sectors Fortified ({run.gridBreakdown.length})</span>
                </h4>
                <div className="breakdown-cards-grid">
                  {run.gridBreakdown.map((g) => (
                    <div key={g.gridId} className="breakdown-mini-card">
                      <div className="breakdown-id">
                        <Sparkles size={14} className="mini-sparkle" />
                        <span>{g.gridId}</span>
                      </div>
                      <span className="breakdown-gain">+{g.influenceEarned} Influence</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* AI Tactical Coach Debrief Card */}
          {loadingDebrief && (
            <motion.div
              className="summary-card coach-card coach-loading-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
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
                  <p>Evaluating cadence velocity, pacing stability, and biomechanical recovery</p>
                </div>
              </div>
            </motion.div>
          )}

          {coachDebrief && (
            <motion.div
              className="summary-card coach-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="coach-card-header">
                <div className="coach-title-wrap">
                  <div className="coach-agent-badge">
                    <Bot size={15} />
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
                    <span className="intel-label">Pacing & Effort Analysis</span>
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
                    <span className="intel-label">Next Tactical Target</span>
                    <p className="intel-text">{coachDebrief.nextWorkoutTarget}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions Bar */}
        <motion.div 
          className="summary-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button 
            className="secondary-btn"
            onClick={handleShare}
          >
            {copied ? <Check size={18} color="#00e676" /> : <Share2 size={18} />}
            <span>{copied ? 'Copied Spoils!' : 'Share Victory'}</span>
          </button>

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
