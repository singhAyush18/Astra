import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, MapPin, Clock, Gauge, Loader, Pause, Volume2, VolumeX, 
  Gamepad2, Navigation, Compass, FastForward, RotateCcw, Crosshair, AlertTriangle, Eye,
  Crown, Swords
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './ActiveRun.css';
import { useAuth } from '../context/AuthContext';
import { runsAPI, territoryAPI } from '../api';
import { soundEffects } from '../utils/soundEffects';
import { backgroundKeepAlive } from '../utils/backgroundKeepAlive';

// Google Maps style navigation arrow with rotation and pulse beacon
const createGoogleMapsArrowIcon = (heading = 0) => L.divIcon({
  className: 'gmaps-nav-arrow-custom-marker',
  html: `
    <div class="gmaps-nav-arrow-wrapper" style="transform: rotate(${heading}deg);">
      <div class="gmaps-nav-pulse"></div>
      <div class="gmaps-nav-beam"></div>
      <div class="gmaps-nav-arrow">
        <svg viewBox="0 0 36 36" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.5))">
            <!-- Navigation Arrow Body -->
            <path d="M18 4L31 31L18 24.5L5 31L18 4Z" fill="#2563eb" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Left Wing Shading -->
            <path d="M18 6.5L7 29L18 23.5L18 6.5Z" fill="#3b82f6"/>
            <!-- Right Wing Shading -->
            <path d="M18 6.5L18 23.5L29 29L18 6.5Z" fill="#60a5fa"/>
            <!-- Center Ridge Line -->
            <path d="M18 6.5L18 23.5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          </g>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Bearing calculation in degrees between two coordinate pairs
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

const waypointIcon = L.divIcon({
  className: 'waypoint-custom-marker',
  html: `
    <div class="waypoint-pulse-aura"></div>
    <div style="background: #00e5ff; border: 2px solid #fff; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 12px #00e5ff;"></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.lat && coords?.lng) {
      map.panTo([coords.lat, coords.lng], { animate: true });
    }
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onMapClick, isSimActive }) {
  useMapEvents({
    click(e) {
      if (isSimActive && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function ActiveRun() {
  const [status, setStatus] = useState('ready'); // ready | running | paused | ending
  const [runId, setRunId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState('');
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState(null);
  const [heading, setHeading] = useState(0);
  const [path, setPath] = useState([]);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [currentPace, setCurrentPace] = useState('--:--');
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted);
  const [isStarting, setIsStarting] = useState(false);

  const isSimulatedRef = useRef(false);
  const visitedGridsRef = useRef(new Set());
  const distanceRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastMoveTimeRef = useRef(Date.now());
  const lastCoordsRef = useRef(null);
  const navigate = useNavigate();
  const { user, handleUnauthorized } = useAuth();
  const [sectorBanner, setSectorBanner] = useState(null);
  const sectorCacheRef = useRef({});
  const sectorBannerTimerRef = useRef(null);

  const triggerSectorDiscovery = useCallback(async (gridId) => {
    try {
      let gridData = sectorCacheRef.current[gridId];
      if (!gridData) {
        const res = await territoryAPI.getDetails(null, gridId);
        const json = await res.json();
        if (json.success && json.data) {
          gridData = json.data;
          sectorCacheRef.current[gridId] = gridData;
        }
      }

      const currentUsername = user?.username ? user.username.toLowerCase() : '';
      const rulerUsername = gridData?.ruler?.username || '';
      const isOwner = rulerUsername && currentUsername && rulerUsername.toLowerCase() === currentUsername;
      const territoryName = gridData?.name ? gridData.name.trim() : null;
      const sectorLabel = territoryName ? `${territoryName} • ${gridId}` : gridId;

      let banner = null;
      if (isOwner) {
        banner = {
          type: 'own',
          badge: '👑 REALM DOMAIN',
          name: territoryName,
          title: territoryName 
            ? `Patrolling Your Realm: ${territoryName} (${gridId})` 
            : `Patrolling Your Realm: ${gridId}`,
          subtitle: 'Sector fortified under your sovereignty',
          gridId,
          displayTag: sectorLabel,
        };
      } else if (rulerUsername) {
        banner = {
          type: 'rival',
          badge: '⚔️ RIVAL DOMAIN',
          name: territoryName,
          title: territoryName 
            ? `Entering Rival Territory: ${territoryName} (${gridId})` 
            : `Entering Rival Territory: ${gridId}`,
          subtitle: `Ruled by ${rulerUsername}`,
          gridId,
          displayTag: sectorLabel,
        };
      } else {
        banner = {
          type: 'wildland',
          badge: '🌲 UNCLAIMED WILDLAND',
          name: territoryName,
          title: territoryName 
            ? `Scouting Sector: ${territoryName} (${gridId})` 
            : `Scouting Sector: ${gridId}`,
          subtitle: 'Unclaimed wildland available for conquest',
          gridId,
          displayTag: sectorLabel,
        };
      }

      if (sectorBannerTimerRef.current) {
        clearTimeout(sectorBannerTimerRef.current);
      }

      setSectorBanner(banner);

      sectorBannerTimerRef.current = setTimeout(() => {
        setSectorBanner(null);
      }, 5500);
    } catch (err) {
      console.warn('Error discovering sector info:', err);
    }
  }, [user]);

  // Get initial GPS position
  useEffect(() => {
    if (!navigator.geolocation) {
      // Fallback default coordinates (e.g. Central Delhi / Imperial City)
      const fallback = { lat: 28.6139, lng: 77.2090 };
      setCoords(fallback);
      setPath([[fallback.lat, fallback.lng]]);
      setGpsReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const initialCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(initialCoords);
        if (pos.coords.heading !== null && !isNaN(pos.coords.heading) && pos.coords.heading >= 0) {
          setHeading(pos.coords.heading);
        }
        setPath([[initialCoords.lat, initialCoords.lng]]);
        setGpsReady(true);
      },
      (err) => {
        console.warn('Geolocation prompt rejected, defaulting to mock point:', err);
        const fallback = { lat: 28.6139, lng: 77.2090 };
        setCoords(fallback);
        setPath([[fallback.lat, fallback.lng]]);
        setGpsReady(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Timer with Auto-Pause & Background Keep-Alive
  useEffect(() => {
    let interval;
    if (status === 'running') {
      // Start Screen Wake Lock & Background Audio Keep-Alive
      backgroundKeepAlive.start();

      let lastTick = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.round((now - lastTick) / 1000);

        // Auto-pause if no distance update for 5 minutes (300,000 ms)
        if (Date.now() - lastMoveTimeRef.current < 300000) {
          if (deltaSeconds > 0) {
            setElapsed(prev => {
              const next = prev + deltaSeconds;
              elapsedRef.current = next;
              return next;
            });
            lastTick += deltaSeconds * 1000;
          }
          setIsAutoPaused(false);
        } else {
          setIsAutoPaused(true);
          setCurrentPace('--:--');
          lastTick = now;
        }
      }, 1000);
    } else {
      backgroundKeepAlive.stop();
    }

    return () => {
      clearInterval(interval);
      backgroundKeepAlive.stop();
    };
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

  // Move runner to a new coordinate and update telemetry with GPS Jitter & Deadband filtering
  const advanceRunnerLocation = useCallback((newLat, newLng, accuracy = 10, gpsSpeed = null) => {
    // Always update current coords for smooth marker rendering
    setCoords({ lat: newLat, lng: newLng });

    if (!lastCoordsRef.current) {
      lastCoordsRef.current = { lat: newLat, lng: newLng };
      lastMoveTimeRef.current = Date.now();
      setPath([[newLat, newLng]]);
      const initialGrid = `R${Math.floor((newLat * 111320) / 1000)}-C${Math.floor((newLng * (111320 * Math.cos(newLat * Math.PI / 180))) / 1000)}`;
      visitedGridsRef.current.add(initialGrid);
      triggerSectorDiscovery(initialGrid);
      return;
    }

    const distDelta = calculateDistance(
      lastCoordsRef.current.lat,
      lastCoordsRef.current.lng,
      newLat,
      newLng
    );
    const distMeters = distDelta * 1000;
    const timeDelta = (Date.now() - lastMoveTimeRef.current) / 1000;

    // GPS JITTER FILTERS:
    // 1. Deadband threshold: Ignore micro-shifts under 5.5 meters (indoor jitter)
    // 2. Accuracy noise floor: Movement must exceed 35% of GPS accuracy radius
    // 3. Speed gate: Must move at least 0.65 m/s (~2.3 km/h walking pace)
    const instantSpeedMps = timeDelta > 0 ? (distMeters / timeDelta) : 0;
    const isNoise = distMeters < 5.5 || (accuracy && distMeters < accuracy * 0.35);
    const isStationary = (gpsSpeed !== null && gpsSpeed !== undefined && gpsSpeed < 0.5) || instantSpeedMps < 0.65;
    const isTeleportGlitch = instantSpeedMps > 15.0; // > 54 km/h

    if (isNoise || isStationary || isTeleportGlitch) {
      // Runner is stationary or GPS is jittering indoors -> DO NOT accumulate distance or draw spaghetti path
      return;
    }

    // Valid movement confirmed!
    const newBearing = calculateBearing(
      lastCoordsRef.current.lat,
      lastCoordsRef.current.lng,
      newLat,
      newLng
    );
    setHeading(newBearing);

    const newDistance = distanceRef.current + distDelta;
    
    // Pace calculation (min/km)
    if (timeDelta > 0 && distDelta > 0) {
      const paceMin = (timeDelta / 60) / distDelta;
      let mins = Math.floor(paceMin);
      let secs = Math.round((paceMin - mins) * 60);
      if (secs === 60) { mins++; secs = 0; }

      if (mins > 45 || mins < 1) {
        setCurrentPace('--:--');
      } else {
        setCurrentPace(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }

    distanceRef.current = newDistance;
    lastMoveTimeRef.current = Date.now();
    lastCoordsRef.current = { lat: newLat, lng: newLng };
    setDistance(newDistance);
    setPath(prev => [...prev, [newLat, newLng]]);

    // Live sector boundary tracking & discovery
    const currentGrid = `R${Math.floor((newLat * 111320) / 1000)}-C${Math.floor((newLng * (111320 * Math.cos(newLat * Math.PI / 180))) / 1000)}`;
    if (!visitedGridsRef.current.has(currentGrid)) {
      visitedGridsRef.current.add(currentGrid);
      triggerSectorDiscovery(currentGrid);
    }

    if (runId) {
      runsAPI.updateLocation(null, runId, { 
        lat: newLat, 
        lng: newLng, 
        duration: elapsedRef.current,
        timestamp: new Date().toISOString()
      }).catch(() => {});
    }
  }, [runId]);

  // Real GPS tracking while running
  useEffect(() => {
    let watchId;
    if (status === 'running' && runId) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy, heading: gpsHeading, speed: gpsSpeed } = pos.coords;
          // Discard inaccurate GPS readings (> 25m uncertainty)
          if (accuracy > 25) return;
          if (gpsHeading !== null && !isNaN(gpsHeading) && gpsHeading >= 0) {
            setHeading(gpsHeading);
          }
          advanceRunnerLocation(lat, lng, accuracy, gpsSpeed);
        },
        (err) => {
          console.warn('GPS tracking error:', err?.message || err);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [status, runId, advanceRunnerLocation]);

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
    setIsStarting(true);

    try {
      soundEffects?.playTerritoryClaimed?.();
      const res = await runsAPI.start(null, { lat: coords.lat, lng: coords.lng });
      const data = await res.json();

      if (data.success) {
        if (data.data.resumed) {
          const resRun = data.data.run;
          setRunId(resRun._id);
          setElapsed(resRun.duration || 0);
          elapsedRef.current = resRun.duration || 0;
          setDistance(resRun.distance || 0);
          distanceRef.current = resRun.distance || 0;
          
          if (resRun.path && resRun.path.length > 0) {
            const lastPath = resRun.path[resRun.path.length - 1];
            setCoords(lastPath);
            lastCoordsRef.current = lastPath;
            setPath(resRun.path.map(p => [p.lat, p.lng]));
          } else {
            lastCoordsRef.current = coords;
          }
          
          setStatus('running');
          setCurrentPace('--:--');
          lastMoveTimeRef.current = Date.now();
        } else {
          setRunId(data.data.run._id);
          setStatus('running');
          setElapsed(0);
          elapsedRef.current = 0;
          setDistance(0);
          setCurrentPace('--:--');
          distanceRef.current = 0;
          lastMoveTimeRef.current = Date.now();
          lastCoordsRef.current = coords;
        }
      } else {
        setError(data.message || 'Failed to start run');
      }
    } catch {
      setError('Network error. Check your connection.');
    }
  };

  const handlePause = () => {
    setStatus('paused');
    if (runId && coords) {
      runsAPI.updateLocation(null, runId, { lat: coords.lat, lng: coords.lng, duration: elapsedRef.current, timestamp: new Date().toISOString() }).catch(() => {});
    }
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
      const res = await runsAPI.end(null, runId, {
        duration: elapsed,
        isSimulated: isSimulatedRef.current,
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
      {/* Top HUD Bar */}
      <div className="run-top-hud">
        <div className="run-hud-left">
          {status === 'ready' && (
            <button className="run-back-btn" onClick={() => navigate('/dashboard')}>
              ← Kingdom
            </button>
          )}

          <div className="run-gps-status">
            <MapPin size={14} />
            <span>{gpsReady ? 'GPS Active' : 'Acquiring GPS...'}</span>
            <div className={`gps-dot ${gpsReady ? 'active' : ''}`} />
          </div>

          {status === 'running' && (
            <div className="awake-lock-badge" title="Screen Wake Lock & Background Tracking Protected">
              <Eye size={13} />
              <span>Awake Lock</span>
              <span className="awake-dot" />
            </div>
          )}
        </div>

        <div className="run-hud-right">
          {/* SFX Toggle */}
          <button
            type="button"
            className="run-sfx-btn"
            onClick={() => {
              const next = soundEffects.toggleMute();
              setIsMuted(next);
            }}
            aria-label="Toggle SFX"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'SFX OFF' : 'SFX ON'}</span>
          </button>
        </div>
      </div>

      {/* Live Smart Sector Discovery HUD Banner */}
      <AnimatePresence>
        {sectorBanner && (
          <motion.div
            key={sectorBanner.gridId}
            className={`live-sector-toast sector-${sectorBanner.type}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          >
            <div className="live-sector-icon-col">
              {sectorBanner.type === 'own' && <Crown size={22} className="sector-icon gold" />}
              {sectorBanner.type === 'rival' && <Swords size={22} className="sector-icon crimson" />}
              {sectorBanner.type === 'wildland' && <Compass size={22} className="sector-icon emerald" />}
            </div>
            <div className="live-sector-info">
              <div className="live-sector-badge-row">
                <span className="live-sector-badge">{sectorBanner.badge}</span>
                <span className="live-sector-id">{sectorBanner.displayTag || sectorBanner.gridId}</span>
              </div>
              <div className="live-sector-title">{sectorBanner.title}</div>
              <div className="live-sector-sub">{sectorBanner.subtitle}</div>
            </div>
            <button 
              type="button" 
              className="live-sector-close" 
              onClick={() => setSectorBanner(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Map */}
      {coords && (
        <div className="run-mini-map">
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={16}
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            style={{ width: '100%', height: '100%', minHeight: '270px', borderRadius: '16px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.9}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.85}
            />
            <Polyline positions={path} color="#ffd700" weight={5} />
            <Marker position={[coords.lat, coords.lng]} icon={createGoogleMapsArrowIcon(heading)} />
            <MapRecenter coords={coords} />
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
                <Play size={24} fill="currentColor" />
                <span>START</span>
              </>
            ) : (
              <>
                <Loader size={24} className="spin" />
                <span>GPS...</span>
              </>
            )}
          </motion.button>
        )}

        {(status === 'running' || status === 'paused') && (
          <div className="run-actions-row">
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
                <Play size={20} fill="currentColor" />
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
                <Pause size={20} fill="currentColor" />
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
              <Square size={20} fill="currentColor" />
              <span>STOP</span>
            </motion.button>
          </div>
        )}

        {status === 'ending' && (
          <div className="run-ending">
            <Loader size={24} className="spin" />
            <span>Finishing run...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveRun;

