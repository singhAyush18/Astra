import { motion } from 'framer-motion';
import { History, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RecentRuns.css';

function RecentRuns({ runs }) {
  const navigate = useNavigate();
  
  // Get last 3 completed runs
  const recentRuns = runs
    ?.filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 3) || [];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const m = Math.floor(seconds / 60);
    return `${m}m`;
  };

  return (
    <div className="recent-runs-card">
      <div className="recent-header">
        <div className="recent-title">
          <History size={18} className="recent-icon" />
          <h3>Recent Chronicles</h3>
        </div>
        <button className="view-all-btn" onClick={() => navigate('/history')}>
          View All
        </button>
      </div>

      <div className="recent-list">
        {recentRuns.length === 0 ? (
          <div className="recent-empty">No chronicles recorded yet.</div>
        ) : (
          recentRuns.map((run, idx) => (
            <motion.div 
              key={run._id} 
              className="recent-run-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <div className="recent-run-date">
                <span className="rr-day">{formatDate(run.startTime)}</span>
              </div>
              <div className="recent-run-info">
                <div className="rr-stat">
                  <MapPin size={14} />
                  <span>{run.distance.toFixed(1)} km</span>
                </div>
                <div className="rr-stat">
                  <Clock size={14} />
                  <span>{formatDuration(run.duration)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentRuns;
