import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Shield, Crown, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { territoryAPI } from '../api';
import './ActiveConquestsWidget.css';

function ActiveConquestsWidget() {
  const [conquests, setConquests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    territoryAPI.getMyProgress(token)
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.data?.conquests) {
          setConquests(data.data.conquests.slice(0, 5));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="active-conquests-widget">
      <div className="ac-header">
        <div className="ac-header-left">
          <Flame size={20} className="ac-header-icon" style={{ color: '#ff7675' }} />
          <h3>Active Siege Targets</h3>
        </div>
        <button 
          className="ac-view-all-btn"
          onClick={() => navigate('/territories')}
        >
          Realm Map <ChevronRight size={14} />
        </button>
      </div>

      <div className="ac-list">
        {loading ? (
          <div className="ac-empty">Scanning unclaimed sectors...</div>
        ) : conquests.length === 0 ? (
          <div className="ac-empty">
            <Shield size={36} className="ac-empty-icon" />
            <span>No active sieges on unclaimed grids.</span>
            <span 
              className="ac-start-run-link"
              onClick={() => navigate('/run')}
            >
              Start a run to breach new sectors
            </span>
          </div>
        ) : (
          conquests.map((sector) => {
            const progress = sector.progressPercentage;

            return (
              <div key={sector.gridCode} className="ac-item-card">
                <div className="ac-item-top">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="ac-grid-code">{sector.gridCode}</span>
                    {sector.name && <span className="ac-grid-name">({sector.name})</span>}
                  </div>
                  <span className="ac-status-badge in-progress">
                    {sector.pointsNeeded} PTS TO CLAIM
                  </span>
                </div>

                <div className="ac-progress-bar-wrap">
                  <div 
                    className="ac-progress-fill"
                    style={{ 
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #e67e22, #f0d060)'
                    }} 
                  />
                </div>

                <div className="ac-item-bottom">
                  <span className="ac-pts-text">
                    <strong>{sector.influence}</strong> / {sector.targetPoints} PTS ({progress}%)
                  </span>
                  <span>
                    {sector.totalDistance} km • {sector.currentRuler}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ActiveConquestsWidget;
