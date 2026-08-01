import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Crown, Shield, Flame, MapPin, Zap, Swords
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./Leaderboard.css";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { key: "xp", label: "XP", icon: <Zap size={16} /> },
  { key: "distance", label: "Distance", icon: <MapPin size={16} /> },
  { key: "streak", label: "Streaks", icon: <Flame size={16} /> },
  { key: "runs", label: "Total Runs", icon: <Swords size={16} /> },
];

const getRankTitle = (level) => {
  if (level >= 20) return "Legend";
  if (level >= 10) return "Knight";
  if (level >= 5) return "Warrior";
  return "Novice";
};

const formatDuration = (seconds) => {
  if (!seconds) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("xp");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streak, setStreak] = useState(0);
  const { user: storedUser, handleUnauthorized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`/api/stats/leaderboard/global`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
          setCurrentUser(data.data.currentUser);
        } else {
          setError("Failed to load leaderboard");
        }
      })
      .catch(() => setError("Something went wrong"))
      .finally(() => setLoading(false));

    // Fetch streak for navbar flame
    fetch(`/api/stats/gamification`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.success) setStreak(data.data.currentStreak || 0);
      })
      .catch(() => {});
  }, [navigate]);

  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard];
    switch (activeCategory) {
      case "distance":
        sorted.sort((a, b) => b.totalDistance - a.totalDistance);
        break;
      case "streak":
        sorted.sort((a, b) => b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak);
        break;
      case "runs":
        sorted.sort((a, b) => b.totalRuns - a.totalRuns);
        break;
      default: // xp
        sorted.sort((a, b) => b.xp - a.xp);
    }
    return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  };

  const getCategoryValue = (entry) => {
    switch (activeCategory) {
      case "distance":
        return `${entry.totalDistance.toFixed(1)} km`;
      case "streak":
        return `${entry.longestStreak} days`;
      case "runs":
        return `${entry.totalRuns} runs`;
      default:
        return `${entry.xp.toLocaleString()} XP`;
    }
  };

  const getCategorySublabel = (entry) => {
    switch (activeCategory) {
      case "distance":
        return `${entry.totalRuns} runs`;
      case "streak":
        return `Current: ${entry.currentStreak}d`;
      case "runs":
        return `${entry.totalDistance.toFixed(1)} km`;
      default:
        return `Level ${entry.level}`;
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner" />
        <p>Summoning the champions...</p>
      </div>
    );
  }

  const sorted = getSortedLeaderboard();
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  // storedUser is now directly available from useAuth

  return (
    <div className="leaderboard-container">
      <Navbar streak={streak} />

      <main className="leaderboard-main">
        {/* Header */}
        <motion.header
          className="leaderboard-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-icon">
            <Trophy size={40} />
          </div>
          <h1 className="gold-text">Hall of Champions</h1>
          <p className="subtitle">Only the worthy shall be remembered</p>
        </motion.header>

        {/* Category Tabs */}
        <motion.div
          className="category-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`category-tab ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {error && <p className="leaderboard-error">{error}</p>}

        {sorted.length === 0 && !error && (
          <div className="leaderboard-empty">
            <Shield size={64} className="empty-icon" />
            <h3>No Champions Yet</h3>
            <p>Be the first to claim your glory on the battlefield.</p>
          </div>
        )}

        {/* Podium — Top 3 */}
        {top3.length > 0 && (
          <motion.section
            className="podium-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="podium">
              {/* 2nd Place (left) */}
              {top3[1] && (
                <motion.div
                  className={`podium-card silver ${top3[1].userId === storedUser.id ? "is-you" : ""}`}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="podium-rank-badge silver-badge">2</div>
                  <div className="podium-avatar silver-ring">
                    <span>{top3[1].username.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="podium-name">{top3[1].username}</h3>
                  <span className="podium-title">{getRankTitle(top3[1].level)}</span>
                  <div className="podium-stat">{getCategoryValue(top3[1])}</div>
                  <span className="podium-sublabel">{getCategorySublabel(top3[1])}</span>
                  {top3[1].userId === storedUser.id && <span className="you-badge">YOU</span>}
                </motion.div>
              )}

              {/* 1st Place (center) */}
              {top3[0] && (
                <motion.div
                  className={`podium-card gold ${top3[0].userId === storedUser.id ? "is-you" : ""}`}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="podium-crown">
                    <Crown size={28} />
                  </div>
                  <div className="podium-rank-badge gold-badge">1</div>
                  <div className="podium-avatar gold-ring">
                    <span>{top3[0].username.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="podium-name">{top3[0].username}</h3>
                  <span className="podium-title">{getRankTitle(top3[0].level)}</span>
                  <div className="podium-stat">{getCategoryValue(top3[0])}</div>
                  <span className="podium-sublabel">{getCategorySublabel(top3[0])}</span>
                  {top3[0].userId === storedUser.id && <span className="you-badge">YOU</span>}
                </motion.div>
              )}

              {/* 3rd Place (right) */}
              {top3[2] && (
                <motion.div
                  className={`podium-card bronze ${top3[2].userId === storedUser.id ? "is-you" : ""}`}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="podium-rank-badge bronze-badge">3</div>
                  <div className="podium-avatar bronze-ring">
                    <span>{top3[2].username.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="podium-name">{top3[2].username}</h3>
                  <span className="podium-title">{getRankTitle(top3[2].level)}</span>
                  <div className="podium-stat">{getCategoryValue(top3[2])}</div>
                  <span className="podium-sublabel">{getCategorySublabel(top3[2])}</span>
                  {top3[2].userId === storedUser.id && <span className="you-badge">YOU</span>}
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* Full Rankings Table */}
        {rest.length > 0 && (
          <motion.section
            className="rankings-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="rankings-header-row">
              <span className="rh-rank">Rank</span>
              <span className="rh-warrior">Warrior</span>
              <span className="rh-level">Level</span>
              <span className="rh-value">
                {CATEGORIES.find((c) => c.key === activeCategory)?.label}
              </span>
              <span className="rh-secondary">Details</span>
            </div>

            <AnimatePresence mode="popLayout">
              {rest.map((entry, idx) => (
                <motion.div
                  key={entry.userId}
                  className={`ranking-row ${entry.userId === storedUser.id ? "is-you" : ""}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  layout
                >
                  <span className="row-rank">
                    <span className="rank-number">{entry.rank}</span>
                  </span>
                  <div className="row-warrior">
                    <div className="row-avatar">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="row-info">
                      <span className="row-name">{entry.username}</span>
                      <span className="row-title">{getRankTitle(entry.level)}</span>
                    </div>
                  </div>
                  <span className="row-level">
                    <span className="level-pill">Lvl {entry.level}</span>
                  </span>
                  <span className="row-value">{getCategoryValue(entry)}</span>
                  <span className="row-secondary">
                    {getCategorySublabel(entry)}
                  </span>
                  {entry.userId === storedUser.id && (
                    <span className="you-indicator" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Current User Summary (if not in top visible) */}
        {currentUser && !sorted.find(
          (e) => e.userId === storedUser.id && e.rank <= sorted.length
        ) && (
            <motion.div
              className="your-rank-banner ornate-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Shield size={20} />
              <span>Your Rank: <strong>#{currentUser.rank}</strong></span>
              <span className="separator">•</span>
              <span>{getCategoryValue(currentUser)}</span>
            </motion.div>
          )}
      </main>
    </div>
  );
}

export default Leaderboard;
