import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, MapPin, Zap, Swords } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import XPBar from "../components/XPBar";
import StatCard from "../components/StatCard";
import WeeklyChart from "../components/WeeklyChart";
import ActiveConquestsWidget from "../components/ActiveConquestsWidget";
import "./Dashboard.css";
import { useAuth } from "../context/AuthContext";
import { statsAPI, runsAPI } from "../api";

import { getRankByLevel } from "../utils/rankUtils";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [runs, setRuns] = useState([]);
  const { user, handleUnauthorized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    statsAPI.getRunStats(token)
      .then(res => {
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.success) setStats(data.data);
      })
      .catch(console.error);

    // Fetch All Runs for charts
    runsAPI.getAll(token)
      .then(res => res.json())
      .then(data => {
        if (data?.success) setRuns(data.data.runs);
      })
      .catch(console.error);

    // Fetch Gamification Stats
    statsAPI.getGamification(token)
      .then(res => {
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.success) setGameStats(data.data);
      })
      .catch(console.error);
  }, [navigate]);

  if (!user) return <div className="loading">Loading...</div>;

  const calculateMaxXP = (level) => {
    return level * 1000;
  };

  const userLevel = gameStats?.level || user.level || 1;
  const currentRank = getRankByLevel(userLevel);

  return (
    <div className="dashboard-container">
      <Navbar streak={gameStats?.currentStreak || 0} />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="gold-text">Welcome, {user.username}</h1>
          <p className="subtitle">The realm awaits your next conquest.</p>
        </header>

        <section className="start-run-section">
          <motion.button
            className="start-run-btn"
            onClick={() => navigate('/run')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="start-run-glow" />
            <div className="start-run-content">
              <div className="start-run-icon">
                <Swords size={28} />
              </div>
              <div className="start-run-text">
                <span className="start-run-title">Begin Conquest</span>
                <span className="start-run-sub">Start a new run</span>
              </div>
            </div>
            <div className="start-run-shimmer" />
          </motion.button>
        </section>

        <section className="dashboard-xp-section">
          <XPBar 
            level={userLevel} 
            currentXP={gameStats?.xp || user.xp || 0} 
            maxXP={calculateMaxXP(userLevel)} 
          />
        </section>

        <section className="dashboard-stats-grid">
          <StatCard 
            icon={<MapPin size={24} color="#d4af37" />} 
            label="Total Distance" 
            value={stats?.totalDistance || 0} 
            suffix=" km" 
          />
          <StatCard 
            icon={<Activity size={24} color="#d4af37" />} 
            label="Total Runs" 
            value={stats?.totalRuns || 0} 
          />
          <StatCard 
            icon={<Zap size={24} color="#d4af37" />} 
            label="Longest Run" 
            value={stats?.longestRun || 0} 
            suffix=" km" 
          />
        </section>

        <section className="dashboard-widgets-grid">
          <div className="widget-col">
            <WeeklyChart runs={runs} />
          </div>
          <div className="widget-col">
            <ActiveConquestsWidget />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
