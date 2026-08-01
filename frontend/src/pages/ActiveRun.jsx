import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, MapPin, Clock, Gauge, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import './ActiveRun.css';
import { useAuth } from '../context/AuthContext';

function ActiveRun() {
  const [status, setStatus] = useState('ready'); // ready | running | ending
  const [runId, setRunId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState('');
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState(null);
  const [path, setPath] = useState([]);
  const navigate = useNavigate();

  const { token, handleUnauthorized } = useAuth();

  // Get initial GPS position
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const initialCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(initialCoords);
        setPath([[initialCoords.lat, initialCoords.lng]]);
        setGpsReady(true);
      },
      (err) => {
        setError('Location access denied. Please enable GPS to start a run.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (status === 'running') {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // GPS tracking while running
  useEffect(() => {
    let watchId;
    if (status === 'running' && runId) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setCoords({ lat, lng });
          setPath(prev => [...prev, [lat, lng]]);

          // Send location update to backend
          fetch(`/api/runs/${runId}/location`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ lat, lng }),
          })
            .then(res => res.json())
            .then(data => {
              if (data?.success) {
                setDistance(data.data.distance);
              }
            })
            .catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [status, runId]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPace = () => {
    if (distance <= 0 || elapsed <= 0) return '--:--';
    const paceMin = (elapsed / 60) / distance;
    const mins = Math.floor(paceMin);
    let secs = Math.round((paceMin - mins) * 60);
    if (secs === 60) { return `${mins + 1}:00`; }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!coords) {
      setError('Waiting for GPS signal...');
      return;
    }

    setError('');

    try {
      const res = await fetch(`/api/runs/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
      });

      const data = await res.json();

      if (data.success) {
        setRunId(data.data.run._id);
        setStatus('running');
        setElapsed(0);
        setDistance(0);
      } else {
        setError(data.message || 'Failed to start run');
      }
    } catch {
      setError('Network error. Check your connection.');
    }
  };

  const handleStop = async () => {
    if (!runId) return;

    setStatus('ending');

    try {
      const res = await fetch(`/api/runs/${runId}/end`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        navigate('/summary', { state: data.data });
      } else {
        setError(data.message || 'Failed to end run');
        setStatus('running');
      }
    } catch {
      setError('Network error');
      setStatus('running');
    }
  };

  return (
    <div className="active-run-container">
      {/* GPS Status */}
      <div className="run-gps-status">
        <MapPin size={14} />
        <span>{gpsReady ? 'GPS Active' : 'Acquiring GPS...'}</span>
        <div className={`gps-dot ${gpsReady ? 'active' : ''}`} />
      </div>

      {/* Back button (only when not running) */}
      {status === 'ready' && (
        <button className="run-back-btn" onClick={() => navigate('/dashboard')}>
          ← Kingdom
        </button>
      )}

      {/* Mini Map */}
      {coords && (
        <div className="run-mini-map">
          <MapContainer 
            center={[coords.lat, coords.lng]} 
            zoom={16} 
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            style={{ width: '100%', height: '200px', borderRadius: '12px' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="leaflet-tile" />
            <Polyline positions={path} color="#d4af37" weight={4} />
          </MapContainer>
        </div>
      )}

      {/* Main stats */}
      <div className="run-stats-display">
        {/* Distance - hero stat */}
        <motion.div 
          className="run-hero-stat"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="hero-value">{distance.toFixed(2)}</span>
          <span className="hero-unit">km</span>
        </motion.div>

        {/* Secondary stats */}
        <div className="run-secondary-stats">
          <div className="run-stat-item">
            <Clock size={18} className="stat-icon" />
            <div className="stat-data">
              <span className="stat-value">{formatTime(elapsed)}</span>
              <span className="stat-label">Duration</span>
            </div>
          </div>

          <div className="run-stat-divider" />

          <div className="run-stat-item">
            <Gauge size={18} className="stat-icon" />
            <div className="stat-data">
              <span className="stat-value">{getPace()}</span>
              <span className="stat-label">Pace (min/km)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="run-error">{error}</div>}

      {/* Action buttons */}
      <div className="run-actions">
        {status === 'ready' && (
          <motion.button
            className="run-start-btn"
            onClick={handleStart}
            disabled={!gpsReady}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {gpsReady ? (
              <>
                <Play size={28} fill="currentColor" />
                <span>START</span>
              </>
            ) : (
              <>
                <Loader size={28} className="spin" />
                <span>GPS...</span>
              </>
            )}
          </motion.button>
        )}

        {status === 'running' && (
          <motion.button
            className="run-stop-btn"
            onClick={handleStop}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Square size={24} fill="currentColor" />
            <span>STOP</span>
          </motion.button>
        )}

        {status === 'ending' && (
          <div className="run-ending">
            <Loader size={28} className="spin" />
            <span>Finishing run...</span>
          </div>
        )}
      </div>

      {/* Pulsing ring animation when running */}
      {status === 'running' && (
        <div className="run-pulse-rings">
          <div className="pulse-ring ring-1" />
          <div className="pulse-ring ring-2" />
          <div className="pulse-ring ring-3" />
        </div>
      )}
    </div>
  );
}

export default ActiveRun;
