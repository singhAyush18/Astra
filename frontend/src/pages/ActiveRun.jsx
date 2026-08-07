import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, MapPin, Clock, Gauge, Loader, Pause } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import './ActiveRun.css';
import { useAuth } from '../context/AuthContext';
import { runsAPI } from '../api';

function ActiveRun() {
  const [status, setStatus] = useState('ready'); // ready | running | ending
  const [runId, setRunId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState('');
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState(null);
  const [path, setPath] = useState([]);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [currentPace, setCurrentPace] = useState('--:--');
  const distanceRef = useRef(0);
  const lastMoveTimeRef = useRef(Date.now());
  const lastCoordsRef = useRef(null);
  const navigate = useNavigate();

  const { handleUnauthorized } = useAuth();

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

  // Timer with Auto-Pause
  useEffect(() => {
    let interval;
    if (status === 'running') {
      interval = setInterval(() => {
        // Auto-pause if no distance update for 5 minutes (300,000 ms)
        if (Date.now() - lastMoveTimeRef.current < 300000) {
          setElapsed(prev => prev + 1);
          setIsAutoPaused(false);
        } else {
          setIsAutoPaused(true);
          setCurrentPace('--:--');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Haversine formula to calculate distance between two lat/lng points in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // GPS tracking while running
  useEffect(() => {
    let watchId;
    if (status === 'running' && runId) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;

          // Filter out wildly inaccurate GPS readings (worse than 40 meters)
          if (accuracy > 40) return;

          setCoords({ lat, lng });
          setPath(prev => [...prev, [lat, lng]]);

          // Optimistic Local Distance Calculation
          if (lastCoordsRef.current) {
            const distDelta = calculateDistance(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lng,
              lat,
              lng
            );

            // 2-meter threshold for local updates (more responsive than backend's 5m)
            if (distDelta > 0.002) {
              const newDistance = distanceRef.current + distDelta;
              
              const timeDelta = (Date.now() - lastMoveTimeRef.current) / 1000;
              if (timeDelta > 0) {
                const paceMin = (timeDelta / 60) / distDelta;
                let mins = Math.floor(paceMin);
                let secs = Math.round((paceMin - mins) * 60);
                if (secs === 60) { mins++; secs = 0; }

                // Cap the pace display if it's absurdly slow (e.g. > 99 min/km)
                if (mins > 99) {
                  setCurrentPace('99+');
                } else {
                  setCurrentPace(`${mins}:${secs.toString().padStart(2, '0')}`);
                }
              }

              distanceRef.current = newDistance;
              lastMoveTimeRef.current = Date.now();
              lastCoordsRef.current = { lat, lng };
              setDistance(newDistance);
            }
          } else {
            // First point of the run
            lastCoordsRef.current = { lat, lng };
          }

          // Send location update to backend in the background (fire and forget)
          runsAPI.updateLocation(null, runId, { lat, lng }).catch(() => {});
        },
        () => { },
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

  const handleStart = async () => {
    if (!coords) {
      setError('Waiting for GPS signal...');
      return;
    }

    setError('');

    try {
      const res = await runsAPI.start(null, { lat: coords.lat, lng: coords.lng });

      const data = await res.json();

      if (data.success) {
        setRunId(data.data.run._id);
        setStatus('running');
        setElapsed(0);
        setDistance(0);
        setCurrentPace('--:--');
        distanceRef.current = 0;
        lastMoveTimeRef.current = Date.now();
        lastCoordsRef.current = coords; // Initialize with current GPS
      } else {
        setError(data.message || 'Failed to start run');
      }
    } catch {
      setError('Network error. Check your connection.');
    }
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleResume = () => {
    setStatus('running');
    setIsAutoPaused(false);
    lastMoveTimeRef.current = Date.now();
  };

  const handleStop = async () => {
    if (!runId) return;

    setStatus('ending');

    try {
      const res = await runsAPI.end(null, runId, elapsed);

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
            <Clock size={18} className={`stat-icon ${isAutoPaused ? 'paused' : ''}`} />
            <div className="stat-data">
              <span className={`stat-value ${isAutoPaused ? 'paused-text' : ''}`}>
                {formatTime(elapsed)}
              </span>
              <span className="stat-label">
                {isAutoPaused ? 'Auto-Paused' : 'Duration'}
              </span>
            </div>
          </div>

          <div className="run-stat-divider" />

          <div className="run-stat-item">
            <Gauge size={18} className="stat-icon" />
            <div className="stat-data">
              <span className="stat-value">{currentPace}</span>
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

        {(status === 'running' || status === 'paused') && (
          <div style={{ display: 'flex', gap: '16px' }}>
            {status === 'paused' || isAutoPaused ? (
              <motion.button
                className="run-pause-btn"
                onClick={handleResume}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Play size={24} fill="currentColor" />
                <span>RESUME</span>
              </motion.button>
            ) : (
              <motion.button
                className="run-pause-btn"
                onClick={handlePause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Pause size={24} fill="currentColor" />
                <span>PAUSE</span>
              </motion.button>
            )}

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
          </div>
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
