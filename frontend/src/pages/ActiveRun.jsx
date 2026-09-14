import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, MapPin, Clock, Gauge, Loader, Pause, Volume2, VolumeX, 
  Gamepad2, Navigation, Compass, FastForward, RotateCcw, Crosshair, AlertTriangle
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './ActiveRun.css';
import { useAuth } from '../context/AuthContext';
import { runsAPI } from '../api';
import { soundEffects } from '../utils/soundEffects';
import ConquestAlert from '../components/ConquestAlert';

const warriorRunnerIcon = L.divIcon({
  className: 'warrior-runner-custom-marker',
  html: `
    <div class="warrior-pulse-aura"></div>
    <div class="warrior-marker-badge">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Helmet Plume / Crest -->
        <path d="M11 2C13 1.2 15 1.5 16.5 2.5C15.8 3.2 14.8 3.5 13.5 3.5L11 2Z" fill="#ff4d4d"/>
        <!-- Armored Helmet -->
        <path d="M12.5 3C13.88 3 15 4.12 15 5.5C15 6.88 13.88 8 12.5 8C11.12 8 10 6.88 10 5.5C10 4.12 11.12 3 12.5 3Z" fill="#ffd700" stroke="#fff" stroke-width="0.5"/>
        <path d="M11.5 4.8H14.5V6H11.5V4.8Z" fill="#111827"/>
        <!-- Golden Armored Chestplate / Pauldron -->
        <path d="M9.5 8.5C9.5 7.8 10.2 7.2 11 7.2H14C14.8 7.2 15.5 7.8 15.5 8.5L15 13.5L13.5 15L10.5 13.5L9.5 8.5Z" fill="#d4af37" stroke="#ffffff" stroke-width="0.6"/>
        <!-- Right Arm & Gauntlet -->
        <path d="M15 9L18 11.5L19 14.5L17.5 15" stroke="#ffd700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Left Arm Swinging Back -->
        <path d="M10 9.5L7.5 12L6.5 15" stroke="#d4af37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Front Running Leg / Greaves -->
        <path d="M13.5 14L16.5 17.5L19.5 18.5" stroke="#ffd700" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Back Trailing Leg -->
        <path d="M11 14L8.5 17.5L5.5 18" stroke="#d4af37" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

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
  const [path, setPath] = useState([]);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [currentPace, setCurrentPace] = useState('--:--');
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted);
  const [conquestAlert, setConquestAlert] = useState({ isOpen: false, type: 'claim', gridId: '', influence: 50 });

  // ── GPS Simulator State ──
  const [simActive, setSimActive] = useState(false);
  const [simSpeedKmh, setSimSpeedKmh] = useState(10); // 5, 10, 18, 80 (anti-cheat test)
  const [simAutoMove, setSimAutoMove] = useState(false);
  const [simHeading, setSimHeading] = useState(0); // degrees (0 = N, 90 = E, 180 = S, 270 = W)
  const [simWaypoint, setSimWaypoint] = useState(null);
  const isSimulatedRef = useRef(false);

  const visitedGridsRef = useRef(new Set());
  const distanceRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastMoveTimeRef = useRef(Date.now());
  const lastCoordsRef = useRef(null);
  const navigate = useNavigate();

  const { handleUnauthorized } = useAuth();

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

  // Timer with Auto-Pause
  useEffect(() => {
    let interval;
    if (status === 'running') {
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

  // Move runner to a new coordinate and update telemetry
  const advanceRunnerLocation = useCallback((newLat, newLng) => {
    setCoords({ lat: newLat, lng: newLng });
    setPath(prev => [...prev, [newLat, newLng]]);

    if (lastCoordsRef.current) {
      const distDelta = calculateDistance(
        lastCoordsRef.current.lat,
        lastCoordsRef.current.lng,
        newLat,
        newLng
      );

      if (distDelta > 0.001) {
        const newDistance = distanceRef.current + distDelta;
        const timeDelta = (Date.now() - lastMoveTimeRef.current) / 1000;
        
        if (timeDelta > 0) {
          const paceMin = (timeDelta / 60) / distDelta;
          let mins = Math.floor(paceMin);
          let secs = Math.round((paceMin - mins) * 60);
          if (secs === 60) { mins++; secs = 0; }

          if (mins > 99) {
            setCurrentPace('99+');
          } else {
            setCurrentPace(`${mins}:${secs.toString().padStart(2, '0')}`);
          }
        }

        distanceRef.current = newDistance;
        lastMoveTimeRef.current = Date.now();
        lastCoordsRef.current = { lat: newLat, lng: newLng };
        setDistance(newDistance);

        // Live sector boundary detection
        const currentGrid = `R${Math.floor((newLat * 111320) / 1000)}-C${Math.floor((newLng * (111320 * Math.cos(newLat * Math.PI / 180))) / 1000)}`;
        if (!visitedGridsRef.current.has(currentGrid)) {
          if (visitedGridsRef.current.size > 0) {
            setConquestAlert({
              isOpen: true,
              type: 'claim',
              gridId: currentGrid,
              influence: 50
            });
          }
          visitedGridsRef.current.add(currentGrid);
        }
      }
    } else {
      lastCoordsRef.current = { lat: newLat, lng: newLng };
      const initialGrid = `R${Math.floor((newLat * 111320) / 1000)}-C${Math.floor((newLng * (111320 * Math.cos(newLat * Math.PI / 180))) / 1000)}`;
      visitedGridsRef.current.add(initialGrid);
    }

    if (runId) {
      runsAPI.updateLocation(null, runId, { 
        lat: newLat, 
        lng: newLng, 
        duration: elapsedRef.current 
      }).catch(() => {});
    }
  }, [runId]);

  // Real GPS tracking while running (only active when not using simulator auto-pilot)
  useEffect(() => {
    let watchId;
    if (status === 'running' && runId && !simActive) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          if (accuracy > 40) return;
          advanceRunnerLocation(lat, lng);
        },
        () => { },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [status, runId, simActive, advanceRunnerLocation]);

  // ── GPS Simulator Auto-Movement & Waypoint Navigation Engine ──
  useEffect(() => {
    let simInterval;
    if (status === 'running' && simActive && (simAutoMove || simWaypoint)) {
      isSimulatedRef.current = true;
      simInterval = setInterval(() => {
        if (!coords) return;

        // Calculate step distance in km per tick (1 second)
        const stepDistKm = simSpeedKmh / 3600;
        const earthRadiusKm = 6371;

        if (simWaypoint) {
          // Move towards waypoint
          const dLat = (simWaypoint.lat - coords.lat) * (Math.PI / 180);
          const dLng = (simWaypoint.lng - coords.lng) * (Math.PI / 180);
          const currentDist = calculateDistance(coords.lat, coords.lng, simWaypoint.lat, simWaypoint.lng);

          if (currentDist <= stepDistKm * 1.5) {
            // Reached destination
            advanceRunnerLocation(simWaypoint.lat, simWaypoint.lng);
            setSimWaypoint(null);
            return;
          }

          const angle = Math.atan2(dLng, dLat);
          const nextLat = coords.lat + (stepDistKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angle);
          const nextLng = coords.lng + (stepDistKm / (earthRadiusKm * Math.cos(coords.lat * Math.PI / 180))) * (180 / Math.PI) * Math.sin(angle);
          advanceRunnerLocation(nextLat, nextLng);
        } else if (simAutoMove) {
          // Cruise along heading
          const rad = (simHeading * Math.PI) / 180;
          const nextLat = coords.lat + (stepDistKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(rad);
          const nextLng = coords.lng + (stepDistKm / (earthRadiusKm * Math.cos(coords.lat * Math.PI / 180))) * (180 / Math.PI) * Math.sin(rad);
          advanceRunnerLocation(nextLat, nextLng);
        }
      }, 1000);
    }
    return () => clearInterval(simInterval);
  }, [status, simActive, simAutoMove, simWaypoint, simSpeedKmh, simHeading, coords, advanceRunnerLocation]);

  // Manual D-pad step handler
  const handleManualStep = useCallback((headingDeg) => {
    if (!coords) return;
    isSimulatedRef.current = true;
    setSimHeading(headingDeg);
    
    // Step distance: ~15 meters in specified direction (or larger at test speeds)
    const stepMeters = simSpeedKmh > 40 ? 50 : 15;
    const stepDistKm = stepMeters / 1000;
    const earthRadiusKm = 6371;
    const rad = (headingDeg * Math.PI) / 180;
    
    const nextLat = coords.lat + (stepDistKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(rad);
    const nextLng = coords.lng + (stepDistKm / (earthRadiusKm * Math.cos(coords.lat * Math.PI / 180))) * (180 / Math.PI) * Math.sin(rad);
    
    advanceRunnerLocation(nextLat, nextLng);
  }, [coords, simSpeedKmh, advanceRunnerLocation]);

  // Keyboard navigation (WASD / Arrows) when simulator is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!simActive || status !== 'running') return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleManualStep(0); // North
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleManualStep(90); // East
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleManualStep(180); // South
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleManualStep(270); // West
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [simActive, status, handleManualStep]);

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
    setSimAutoMove(false);
    if (runId && coords) {
      runsAPI.updateLocation(null, runId, { lat: coords.lat, lng: coords.lng, duration: elapsedRef.current }).catch(() => {});
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
    setSimAutoMove(false);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px', gap: '8px' }}>
        <div className="run-gps-status" style={{ margin: 0 }}>
          <MapPin size={14} />
          <span>{simActive ? 'Mock GPS' : gpsReady ? 'GPS Active' : 'Acquiring GPS...'}</span>
          <div className={`gps-dot ${gpsReady || simActive ? 'active' : ''}`} style={simActive ? { background: '#00e5ff', boxShadow: '0 0 8px #00e5ff' } : {}} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Developer GPS Simulator Toggle */}
          <button
            type="button"
            className={`dev-sim-toggle-btn ${simActive ? 'active' : ''}`}
            onClick={() => setSimActive(!simActive)}
            aria-label="Toggle GPS Simulator"
          >
            <Gamepad2 size={15} />
            <span>{simActive ? 'Sim ON' : 'Mock GPS'}</span>
          </button>

          {/* SFX Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = soundEffects.toggleMute();
              setIsMuted(next);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: isMuted ? '#ff5252' : '#00e5ff',
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}
            aria-label="Toggle SFX"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'SFX OFF' : 'SFX ON'}</span>
          </button>
        </div>
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
            dragging={simActive}
            style={{ width: '100%', height: '220px', borderRadius: '12px' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="leaflet-tile" />
            <Polyline positions={path} color="#d4af37" weight={4} />
            <Marker position={[coords.lat, coords.lng]} icon={warriorRunnerIcon} />
            {simWaypoint && (
              <Marker position={[simWaypoint.lat, simWaypoint.lng]} icon={waypointIcon} />
            )}
            <MapRecenter coords={coords} />
            <MapClickHandler isSimActive={simActive} onMapClick={(pt) => setSimWaypoint(pt)} />
          </MapContainer>
          {simActive && (
            <div className="map-sim-hint">
              <Crosshair size={12} />
              <span>Click map to auto-run to waypoint</span>
            </div>
          )}
        </div>
      )}

      {/* ── Developer GPS Simulator Panel ── */}
      <AnimatePresence>
        {simActive && (
          <motion.div 
            className="sim-dock-container"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="sim-dock-header">
              <div className="sim-dock-title">
                <Gamepad2 size={16} className="text-cyan" />
                <span>GPS Telemetry Simulator</span>
              </div>
              {simSpeedKmh > 45 && (
                <div className="sim-cheat-alert">
                  <AlertTriangle size={12} />
                  <span>Anti-Cheat Test Trigger</span>
                </div>
              )}
            </div>

            {/* Speed Presets */}
            <div className="sim-speed-row">
              <span className="sim-label">Velocity:</span>
              <div className="sim-speed-pills">
                <button
                  type="button"
                  className={`sim-speed-pill ${simSpeedKmh === 5 ? 'active' : ''}`}
                  onClick={() => setSimSpeedKmh(5)}
                >
                  🚶 5 km/h
                </button>
                <button
                  type="button"
                  className={`sim-speed-pill ${simSpeedKmh === 10 ? 'active' : ''}`}
                  onClick={() => setSimSpeedKmh(10)}
                >
                  🏃 10 km/h
                </button>
                <button
                  type="button"
                  className={`sim-speed-pill ${simSpeedKmh === 18 ? 'active' : ''}`}
                  onClick={() => setSimSpeedKmh(18)}
                >
                  ⚡ 18 km/h
                </button>
                <button
                  type="button"
                  className={`sim-speed-pill cheat-pill ${simSpeedKmh === 80 ? 'active' : ''}`}
                  onClick={() => setSimSpeedKmh(80)}
                  title="Test anti-cheat spoofing rejection"
                >
                  🚀 80 km/h
                </button>
              </div>
            </div>

            {/* Controls Row: D-Pad & Auto-Run */}
            <div className="sim-controls-row">
              {/* D-Pad */}
              <div className="sim-dpad-wrapper">
                <div className="sim-dpad-row">
                  <button 
                    type="button" 
                    className="sim-dpad-btn" 
                    onClick={() => handleManualStep(0)} 
                    title="Move North (W / Up)"
                  >
                    ▲
                  </button>
                </div>
                <div className="sim-dpad-row">
                  <button 
                    type="button" 
                    className="sim-dpad-btn" 
                    onClick={() => handleManualStep(270)} 
                    title="Move West (A / Left)"
                  >
                    ◄
                  </button>
                  <div className="sim-dpad-center">
                    <Compass size={14} />
                  </div>
                  <button 
                    type="button" 
                    className="sim-dpad-btn" 
                    onClick={() => handleManualStep(90)} 
                    title="Move East (D / Right)"
                  >
                    ►
                  </button>
                </div>
                <div className="sim-dpad-row">
                  <button 
                    type="button" 
                    className="sim-dpad-btn" 
                    onClick={() => handleManualStep(180)} 
                    title="Move South (S / Down)"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Auto Cruise & Waypoint Actions */}
              <div className="sim-actions-col">
                <button
                  type="button"
                  className={`sim-cruise-btn ${simAutoMove ? 'active' : ''}`}
                  onClick={() => setSimAutoMove(!simAutoMove)}
                  disabled={status !== 'running'}
                >
                  <FastForward size={16} />
                  <span>{simAutoMove ? 'Cruising...' : 'Auto-Cruise'}</span>
                </button>

                {simWaypoint && (
                  <button
                    type="button"
                    className="sim-clear-wp-btn"
                    onClick={() => setSimWaypoint(null)}
                  >
                    <Crosshair size={14} />
                    <span>Clear Waypoint</span>
                  </button>
                )}
                
                <span className="sim-key-hint">Keyboard: WASD / Arrow Keys</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Live Conquest Alert */}
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

export default ActiveRun;

