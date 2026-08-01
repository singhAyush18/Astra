import { useState, useEffect } from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LeaderboardWidget.css';
import { statsAPI } from '../api';

function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    
    statsAPI.getGlobalLeaderboard(token)
      .then(res => res.json())
      .then(data => {
        if (data?.success) {
          // Get top 3 for the widget
          setLeaderboard(data.data.leaderboard.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={16} className="rank-icon gold" />;
    if (rank === 2) return <Trophy size={16} className="rank-icon silver" />;
    if (rank === 3) return <Trophy size={16} className="rank-icon bronze" />;
    return <span className="rank-num">{rank}</span>;
  };

  return (
    <div className="leaderboard-widget">
      <div className="leaderboard-header">
        <Trophy size={18} className="leaderboard-icon" />
        <h3>Top Champions</h3>
        <button 
          className="view-all-btn" 
          onClick={() => navigate('/leaderboard')}
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <div className="lb-loading">Loading champions...</div>
        ) : leaderboard.length === 0 ? (
          <div className="lb-empty">No champions yet.</div>
        ) : (
          leaderboard.map((entry, idx) => (
            <div 
              key={entry.userId} 
              className={`leaderboard-row ${entry.userId === user?.id ? 'is-user' : ''}`}
            >
              <div className="lb-rank">
                {getRankIcon(idx + 1)}
              </div>
              <div className="lb-avatar">
                {entry.username.charAt(0).toUpperCase()}
              </div>
              <div className="lb-info">
                <span className="lb-name">{entry.username}</span>
                <span className="lb-kingdom">Level {entry.level}</span>
              </div>
              <div className="lb-stats">
                <span className="lb-territory">{entry.xp.toLocaleString()} XP</span>
                <span className="lb-distance">{(entry.totalDistance || 0).toFixed(1)} km</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LeaderboardWidget;
