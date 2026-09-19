import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, MapPin, Zap, Swords, Flame } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import XPBar from "../components/XPBar";
import StatCard from "../components/StatCard";
import WeeklyChart from "../components/WeeklyChart";
import ActiveConquestsWidget from "../components/ActiveConquestsWidget";
import heroBg from "../assets/hero_bg.jpg";
import "./Dashboard.css";
import { useAuth } from "../context/AuthContext";
import { statsAPI, runsAPI } from "../api";
import { getRankByLevel } from "../utils/rankUtils";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [runs, setRuns] = useState([]);
  const { user, updateUser, handleUnauthorized } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Floating Golden Embers & Sparks Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 65; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.0 + 0.8,
        speedY: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.7 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.025 + 0.01,
        isGolden: Math.random() > 0.3,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.twinklePhase += p.twinkleSpeed;
        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinklePhase));

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        if (p.isGolden) {
          gradient.addColorStop(0, `rgba(255, 215, 120, ${currentOpacity})`);
          gradient.addColorStop(0.5, `rgba(212, 175, 55, ${currentOpacity * 0.45})`);
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, `rgba(255, 110, 50, ${currentOpacity})`);
          gradient.addColorStop(0.6, `rgba(180, 40, 20, ${currentOpacity * 0.25})`);
          gradient.addColorStop(1, 'transparent');
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

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
        if (data?.success && data.data) {
          setGameStats(data.data);
          // Sync fresh server streak & stats with AuthContext
          if (user) {
            const hasChanged = 
              user.currentStreak !== data.data.currentStreak ||
              user.longestStreak !== data.data.longestStreak ||
              user.xp !== data.data.xp ||
              user.level !== data.data.level;

            if (hasChanged) {
              updateUser({
                ...user,
                currentStreak: data.data.currentStreak,
                longestStreak: data.data.longestStreak,
                xp: data.data.xp,
                level: data.data.level,
              });
            }
          }
        }
      })
      .catch(console.error);
  }, [navigate]);

  if (!user) return <div className="loading">Loading...</div>;

  const calculateMaxXP = (level) => {
    return level * 1000;
  };

  const userLevel = gameStats?.level || user.level || 1;
  const currentRank = getRankByLevel(userLevel);
  const currentStreakVal = gameStats?.currentStreak !== undefined ? gameStats.currentStreak : (user.currentStreak || 0);
  const longestStreakVal = gameStats?.longestStreak !== undefined ? gameStats.longestStreak : (user.longestStreak || 0);

  return (
    <div className="dashboard-container" style={{ backgroundImage: `url(${heroBg})` }}>
      {/* Floating Ember Canvas */}
      <canvas ref={canvasRef} className="dashboard-ember-canvas" />

      {/* Atmospheric Vignette & Tactical Watermark */}
      <div className="dashboard-backdrop-overlay" />
      <div className="dashboard-torch-sunburst" />
      <div className="dashboard-tactical-grid-overlay" />

      <Navbar streak={currentStreakVal} />
      
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
            currentXP={gameStats?.xp !== undefined ? gameStats.xp : (user.xp || 0)} 
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
          <StatCard 
            icon={<Flame size={24} color="#ff9800" />} 
            label="Longest Daily Streak" 
            value={longestStreakVal} 
            suffix=" Days" 
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
