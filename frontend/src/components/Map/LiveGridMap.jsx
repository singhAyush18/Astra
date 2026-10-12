import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveGridMap.css';

// Match backend GRID_SIZE_METERS
const GRID_SIZE_METERS = 1000;
const METERS_PER_DEGREE_LAT = 111320;

// Convert Grid ID back to Leaflet bounds
const getGridBounds = (gridId) => {
  if (!gridId) return null;
  const match = gridId.match(/R(-?\d+)-C(-?\d+)/);
  if (!match) return null;

  const row = parseInt(match[1], 10);
  const col = parseInt(match[2], 10);

  const minLat = (row * GRID_SIZE_METERS) / METERS_PER_DEGREE_LAT;
  const maxLat = ((row + 1) * GRID_SIZE_METERS) / METERS_PER_DEGREE_LAT;

  const centerLat = (minLat + maxLat) / 2;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);

  const minLng = (col * GRID_SIZE_METERS) / metersPerDegreeLng;
  const maxLng = ((col + 1) * GRID_SIZE_METERS) / metersPerDegreeLng;

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ];
};

// Get center of a grid for marker placement
const getGridCenter = (bounds) => {
  if (!bounds) return null;
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2
  ];
};

// Create custom Flag marker icon for individual grid cells
// Self-owned: Crimson red flag with 8-pointed golden compass star (exact match to screenshot)
// Enemy: Pitch-black flag with white skull & crossbones
const createGridFlagIcon = (isMine, name = '') => {
  const iconId = isMine ? 'mine' : 'enemy';

  return L.divIcon({
    className: 'grid-flag-icon-container',
    html: `
      <div class="grid-flag-wrapper ${isMine ? 'flag-mine' : 'flag-enemy'}" title="${name || (isMine ? 'Your Territory' : 'Enemy Territory')}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="38" height="38" class="grid-flag-svg">
          <defs>
            <linearGradient id="poleMetalGrad-${iconId}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#181215" />
              <stop offset="45%" stop-color="#4a3b40" />
              <stop offset="70%" stop-color="#2a2024" />
              <stop offset="100%" stop-color="#120c0f" />
            </linearGradient>

            <radialGradient id="finialGrad-${iconId}" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#5a484e" />
              <stop offset="50%" stop-color="#281e22" />
              <stop offset="100%" stop-color="#100a0d" />
            </radialGradient>

            <linearGradient id="redFlagGrad-${iconId}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#940000" />
              <stop offset="40%" stop-color="#780000" />
              <stop offset="100%" stop-color="#4d0000" />
            </linearGradient>

            <linearGradient id="blackFlagGrad-${iconId}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2c2c2c" />
              <stop offset="45%" stop-color="#181818" />
              <stop offset="100%" stop-color="#080808" />
            </linearGradient>

            <filter id="flagShadow-${iconId}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1.2" dy="2" stdDeviation="1.5" flood-color="rgba(0,0,0,0.7)" />
            </filter>
          </defs>

          <!-- Ground Base Shadow -->
          <ellipse cx="11" cy="41" rx="6" ry="2.2" fill="rgba(0,0,0,0.55)" />

          <!-- Flagpole Foot Cap -->
          <ellipse cx="11" cy="39.5" rx="2.5" ry="1.4" fill="#1c1618" stroke="#3d3034" stroke-width="0.5" />

          <!-- Flagpole Shaft -->
          <rect x="9.8" y="7" width="2.4" height="33" rx="1.2" fill="url(#poleMetalGrad-${iconId})" />

          <!-- Pole Top Finial Sphere -->
          <circle cx="11" cy="6.5" r="2.8" fill="url(#finialGrad-${iconId})" stroke="#1a1215" stroke-width="0.5" />
          <circle cx="10.2" cy="5.7" r="0.8" fill="rgba(255,255,255,0.4)" />

          <!-- Swallowtail Flag Cloth -->
          <path 
            d="M 12 9 L 38 10 L 31 20.5 L 38 31 L 12 30 Z" 
            fill="${isMine ? `url(#redFlagGrad-${iconId})` : `url(#blackFlagGrad-${iconId})`}" 
            stroke="${isMine ? '#d4af37' : '#4f4f4f'}" 
            stroke-width="0.85"
            filter="url(#flagShadow-${iconId})"
          />

          ${isMine ? `
            <!-- 8-Pointed Golden Compass Star (Exact match to screenshot) -->
            <g class="flag-gold-star-sigil">
              <!-- Cardinal North Point -->
              <polygon points="23.5,20 22,20 23.5,11" fill="#ffe98a" />
              <polygon points="23.5,20 23.5,11 25,20" fill="#b8860b" />

              <!-- Cardinal South Point -->
              <polygon points="23.5,20 22,20 23.5,29" fill="#b8860b" />
              <polygon points="23.5,20 23.5,29 25,20" fill="#ffe98a" />

              <!-- Cardinal East Point -->
              <polygon points="23.5,20 23.5,18.6 32,20" fill="#ffe98a" />
              <polygon points="23.5,20 32,20 23.5,21.4" fill="#b8860b" />

              <!-- Cardinal West Point -->
              <polygon points="23.5,20 15,20 23.5,18.6" fill="#b8860b" />
              <polygon points="23.5,20 23.5,21.4 15,20" fill="#ffe98a" />

              <!-- Diagonal NW Point -->
              <polygon points="23.5,20 18,14.5 23.5,17.8" fill="#fff3a8" />
              <polygon points="23.5,20 21.2,20 18,14.5" fill="#9e7308" />

              <!-- Diagonal NE Point -->
              <polygon points="23.5,20 29,14.5 25.8,20" fill="#fff3a8" />
              <polygon points="23.5,20 23.5,17.8 29,14.5" fill="#9e7308" />

              <!-- Diagonal SE Point -->
              <polygon points="23.5,20 29,25.5 23.5,22.2" fill="#fff3a8" />
              <polygon points="23.5,20 25.8,20 29,25.5" fill="#9e7308" />

              <!-- Diagonal SW Point -->
              <polygon points="23.5,20 18,25.5 21.2,20" fill="#fff3a8" />
              <polygon points="23.5,20 23.5,22.2 18,25.5" fill="#9e7308" />

              <!-- Center Gold Spark Jewel -->
              <circle cx="23.5" cy="20" r="1.1" fill="#ffffff" />
            </g>
          ` : `
            <!-- Skull & Crossbones Emblem for Enemy Black Flag -->
            <g class="flag-enemy-skull-sigil">
              <!-- Crossed Bones -->
              <!-- Top-Left to Bottom-Right -->
              <line x1="16.5" y1="13.5" x2="30.5" y2="26.5" stroke="#e0ded8" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="16.5" cy="13.5" r="1.2" fill="#e0ded8" />
              <circle cx="30.5" cy="26.5" r="1.2" fill="#e0ded8" />

              <!-- Bottom-Left to Top-Right -->
              <line x1="16.5" y1="26.5" x2="30.5" y2="13.5" stroke="#e0ded8" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="16.5" cy="26.5" r="1.2" fill="#e0ded8" />
              <circle cx="30.5" cy="13.5" r="1.2" fill="#e0ded8" />

              <!-- Skull Cranium Head -->
              <path d="M 19 17 C 19 13.5, 28 13.5, 28 17 C 28 19.3, 26.8 20.8, 26.2 22.3 L 20.8 22.3 C 20.2 20.8, 19 19.3, 19 17 Z" fill="#f5f3ee" stroke="#ded9cf" stroke-width="0.3" />

              <!-- Skull Teeth / Jaw -->
              <path d="M 21.2 22.3 L 25.8 22.3 L 25.3 25.2 L 21.7 25.2 Z" fill="#f5f3ee" stroke="#ded9cf" stroke-width="0.3" />
              <line x1="22.7" y1="23" x2="22.7" y2="25.2" stroke="#121212" stroke-width="0.55"/>
              <line x1="24.3" y1="23" x2="24.3" y2="25.2" stroke="#121212" stroke-width="0.55"/>

              <!-- Eye Sockets -->
              <ellipse cx="21.5" cy="17.6" rx="1.4" ry="1.7" fill="#121212" />
              <ellipse cx="25.5" cy="17.6" rx="1.4" ry="1.7" fill="#121212" />

              <!-- Nose Cavity -->
              <polygon points="23.5,19.2 22.7,20.8 24.3,20.8" fill="#121212" />
            </g>
          `}
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [11, 39],
    popupAnchor: [0, -36]
  });
};


// Haversine distance in kilometers
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// User GPS Live Recon Dot Icon
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-gps-marker-container',
    html: `
      <div class="user-gps-pulse-outer" title="Your Live Recon Position">
        <div class="user-gps-pulse-ring"></div>
        <div class="user-gps-core-dot"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Group territories into regional battlefield clusters (< 60 km)
const buildTerritoryClusters = (territories, currentUserId) => {
  if (!territories || territories.length === 0) return [];

  const validItems = territories.map(t => {
    const bounds = getGridBounds(t.gridId);
    const center = bounds ? getGridCenter(bounds) : null;
    return {
      territory: t,
      bounds,
      center,
      isMine: t.rulerId === currentUserId,
    };
  }).filter(item => item.bounds && item.center);

  const clusters = [];

  validItems.forEach(item => {
    let matchedCluster = null;
    for (const c of clusters) {
      const dist = getDistanceKm(item.center[0], item.center[1], c.center[0], c.center[1]);
      if (dist <= 60) {
        matchedCluster = c;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.items.push(item);
      const lats = matchedCluster.items.map(i => i.center[0]);
      const lngs = matchedCluster.items.map(i => i.center[1]);
      matchedCluster.center = [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length,
      ];
      const allLats = [];
      const allLngs = [];
      matchedCluster.items.forEach(i => {
        allLats.push(i.bounds[0][0], i.bounds[1][0]);
        allLngs.push(i.bounds[0][1], i.bounds[1][1]);
      });
      matchedCluster.bounds = [
        [Math.min(...allLats), Math.min(...allLngs)],
        [Math.max(...allLats), Math.max(...allLngs)],
      ];
      if (item.isMine) matchedCluster.mineCount += 1;
      else matchedCluster.enemyCount += 1;
    } else {
      clusters.push({
        id: `cluster-${clusters.length}`,
        items: [item],
        center: item.center,
        bounds: item.bounds,
        mineCount: item.isMine ? 1 : 0,
        enemyCount: item.isMine ? 0 : 1,
      });
    }
  });

  return clusters.map(c => {
    const [cLat, cLng] = c.center;
    let name = 'Territory Sector';
    if (cLat >= 28.0 && cLat <= 29.0 && cLng >= 76.5 && cLng <= 78.2) {
      name = 'Greater Noida / NCR';
    } else if (cLat >= 24.8 && cLat <= 26.2 && cLng >= 84.5 && cLng <= 87.5) {
      name = 'Bihar / Patna';
    } else {
      const named = c.items.find(i => i.territory.name)?.territory.name;
      name = named ? `${named} Sector` : `${cLat.toFixed(1)}°N, ${cLng.toFixed(1)}°E`;
    }

    return {
      ...c,
      name,
    };
  });
};

// Smart GPS-aware Battlefield Camera Initializer
const MapAutoCenter = ({ clusters, userLocation, activeClusterId, setActiveClusterId }) => {
  const map = useMap();
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!clusters || clusters.length === 0) {
      if (userLocation) {
        map.setView(userLocation, 14);
        hasInitializedRef.current = true;
      }
      return;
    }

    // 1. If GPS is available, find closest cluster containing user's territories
    if (userLocation) {
      let closestCluster = null;
      let minDistance = Infinity;

      clusters.forEach(c => {
        const dist = getDistanceKm(userLocation[0], userLocation[1], c.center[0], c.center[1]);
        if (c.mineCount > 0 && dist < minDistance) {
          minDistance = dist;
          closestCluster = c;
        }
      });

      // If user is within regional proximity (<= 85 km) of their kingdom, frame that local warfront
      if (closestCluster && minDistance <= 85) {
        map.flyToBounds(closestCluster.bounds, { maxZoom: 14.2, padding: [65, 65], duration: 1.2 });
        setActiveClusterId(closestCluster.id);
        hasInitializedRef.current = true;
        return;
      }

      // If user is far from all their territories (e.g. traveling in another city), focus live GPS position
      if (minDistance > 85) {
        map.setView(userLocation, 14);
        hasInitializedRef.current = true;
        return;
      }
    }

    // 2. Fallback: focus on user's primary/densest territory cluster at tactical Zoom 14
    const primaryCluster = clusters
      .filter(c => c.mineCount > 0)
      .sort((a, b) => b.mineCount - a.mineCount)[0] || clusters[0];

    if (primaryCluster) {
      map.flyToBounds(primaryCluster.bounds, { maxZoom: 14.2, padding: [65, 65], duration: 1.2 });
      setActiveClusterId(primaryCluster.id);
      hasInitializedRef.current = true;
    }
  }, [clusters, userLocation, map, setActiveClusterId]);

  return null;
};

// Map Navigation Bridge (Allows external buttons to trigger Leaflet flyTo / flyToBounds)
const MapNavigationBridge = ({ targetCommand, onCommandExecuted }) => {
  const map = useMap();

  useEffect(() => {
    if (!targetCommand) return;
    if (targetCommand.type === 'bounds') {
      map.flyToBounds(targetCommand.bounds, { maxZoom: 14.2, padding: [65, 65], duration: 1.1 });
    } else if (targetCommand.type === 'point') {
      map.flyTo(targetCommand.coords, targetCommand.zoom || 14.5, { duration: 1.0 });
    }
    onCommandExecuted();
  }, [targetCommand, map, onCommandExecuted]);

  return null;
};

// Interactive Recenter button inside the map
const RecenterControl = ({ userLocation, clusters, onTriggerRecenter }) => {
  return (
    <div className="map-recenter-btn-container">
      <button 
        type="button"
        className="map-recenter-btn"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onTriggerRecenter();
        }}
        title="Recenter to Live Position or Frontline"
      >
        <span className="recenter-icon">🎯</span>
        <span className="recenter-text">Recenter</span>
      </button>
    </div>
  );
};

// Single Separate Territory Grid Cell Component
const TerritoryGrid = ({ t, currentUserId, onRename }) => {
  const map = useMap();
  const bounds = getGridBounds(t.gridId);
  if (!bounds) return null;

  const isMine = t.rulerId === currentUserId;
  const center = getGridCenter(bounds);

  const handleZoomToTerritory = () => {
    if (center) {
      map.flyTo(center, 16, { animate: true, duration: 1.0 });
    }
  };

  const flagIcon = useMemo(() => createGridFlagIcon(isMine, t.name), [isMine, t.name]);

  const rulerInfluence = t.rulerInfluence || t.influence || 0;
  const userInfluence = t.userInfluence || 0;
  const targetInfluence = Math.max(rulerInfluence, 500);
  const dethroneProgress = Math.min(100, Math.round((userInfluence / targetInfluence) * 100));
  const xpNeeded = Math.max(0, targetInfluence - userInfluence);

  const popupContent = (
    <div className="territory-popup-content">
      <div className="popup-header">
        <span className="popup-emoji">{isMine ? '🚩' : '🏴‍☠️'}</span>
        <h4>{t.name || (isMine ? 'Your Territory' : 'Enemy Territory')}</h4>
      </div>
      <div className="popup-details">
        <p><strong>Grid:</strong> {t.gridId}</p>
        <p><strong>Ruler:</strong> {t.rulerName || 'Unknown'}</p>
        <p><strong>Claimed:</strong> {new Date(t.claimedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        })}</p>

        {isMine ? (
          <div className="popup-influence-mine">
            <p className="influence-line">
              <strong>Influence:</strong> <span className="gold-xp">⚡ {rulerInfluence.toLocaleString()} XP</span>
            </p>
          </div>
        ) : (
          <div className="popup-influence-rival">
            <p className="influence-line">
              <strong>Ruler's Influence:</strong> <span className="ruler-xp">⚔️ {rulerInfluence.toLocaleString()} XP</span>
            </p>
            <p className="influence-line">
              <strong>Your Influence:</strong> <span className="cyan-xp">⚡ {userInfluence.toLocaleString()} XP</span>
            </p>
            <div className="dethrone-progress-container">
              <div className="dethrone-progress-header">
                <span>Dethrone Progress</span>
                <span className="dethrone-percent">{dethroneProgress}%</span>
              </div>
              <div className="dethrone-bar-track">
                <div 
                  className="dethrone-bar-fill" 
                  style={{ width: `${dethroneProgress}%` }}
                />
              </div>
              {xpNeeded > 0 ? (
                <span className="dethrone-hint">{xpNeeded.toLocaleString()} XP needed to usurp</span>
              ) : (
                <span className="dethrone-hint ready">⚔️ Dominion within reach! Run here to claim!</span>
              )}
            </div>
          </div>
        )}

        {isMine && onRename && (
          <button 
            className="rename-btn"
            onClick={(e) => {
              e.stopPropagation();
              const newName = window.prompt("Name your territory (max 30 chars):", t.name || "");
              if (newName !== null) {
                onRename(t.gridId, newName);
              }
            }}
          >
            ✏️ Rename Territory
          </button>
        )}
      </div>
    </div>
  );

  return (
    <React.Fragment>
      {/* Individual Grid cell rectangle with glow effect and click-to-zoom */}
      <Rectangle
        bounds={bounds}
        eventHandlers={{
          click: handleZoomToTerritory,
        }}
        pathOptions={{
          color: isMine ? '#ffd700' : '#ff3366',
          weight: isMine ? 2.5 : 1.8,
          fillColor: isMine ? '#ffd700' : '#ff3366',
          fillOpacity: isMine ? 0.3 : 0.18,
          dashArray: isMine ? null : '6 4',
          className: isMine ? 'neon-kingdom-grid' : 'neon-rival-grid',
        }}
      >
        <Popup>{popupContent}</Popup>
      </Rectangle>

      {/* Flag marker at center of each grid with click-to-zoom and Crown Z-Index Priority */}
      {center && (
        <Marker
          position={center}
          icon={flagIcon}
          zIndexOffset={isMine ? 1200 : 200}
          eventHandlers={{
            click: handleZoomToTerritory,
          }}
        >
          <Popup>{popupContent}</Popup>
        </Marker>
      )}
    </React.Fragment>
  );
};

const LiveGridMap = ({ territories, currentUserId, centerCoords, onRename }) => {
  const defaultCenter = [28.6139, 77.2090]; // Default to Delhi
  const [mapTheme, setMapTheme] = useState(() => localStorage.getItem('astra_map_theme') || 'satellite');
  const [userLocation, setUserLocation] = useState(null);
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [targetCommand, setTargetCommand] = useState(null);

  // Group territories into regional battlefield clusters (< 60 km), sorted by user proximity
  const clusters = useMemo(() => {
    const list = buildTerritoryClusters(territories, currentUserId);
    if (!userLocation) {
      return [...list].sort((a, b) => b.mineCount - a.mineCount);
    }
    return [...list].sort((a, b) => {
      const distA = getDistanceKm(userLocation[0], userLocation[1], a.center[0], a.center[1]);
      const distB = getDistanceKm(userLocation[0], userLocation[1], b.center[0], b.center[1]);
      return distA - distB;
    });
  }, [territories, currentUserId, userLocation]);

  const userLocationIcon = useMemo(() => createUserLocationIcon(), []);

  // Fetch real-time user GPS position on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const handleThemeChange = (theme) => {
    setMapTheme(theme);
    localStorage.setItem('astra_map_theme', theme);
  };

  const handleFlyToCluster = (cluster) => {
    setActiveClusterId(cluster.id);
    setTargetCommand({
      type: 'bounds',
      bounds: cluster.bounds,
    });
  };

  const handleFlyToWorld = () => {
    setActiveClusterId('world');
    if (territories && territories.length > 0) {
      const allLats = [];
      const allLngs = [];
      territories.forEach(t => {
        const bounds = getGridBounds(t.gridId);
        if (bounds) {
          allLats.push(bounds[0][0], bounds[1][0]);
          allLngs.push(bounds[0][1], bounds[1][1]);
        }
      });
      if (allLats.length > 0) {
        setTargetCommand({
          type: 'bounds',
          bounds: [
            [Math.min(...allLats), Math.min(...allLngs)],
            [Math.max(...allLats), Math.max(...allLngs)],
          ],
        });
      }
    }
  };

  const handleTriggerRecenter = () => {
    if (userLocation) {
      setActiveClusterId('gps');
      setTargetCommand({
        type: 'point',
        coords: userLocation,
        zoom: 14.5,
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setActiveClusterId('gps');
          setTargetCommand({
            type: 'point',
            coords: loc,
            zoom: 14.5,
          });
        },
        () => {
          if (clusters.length > 0) {
            handleFlyToCluster(clusters[0]);
          }
        }
      );
    } else if (clusters.length > 0) {
      handleFlyToCluster(clusters[0]);
    }
  };

  return (
    <div className="live-grid-map-container">
      {/* Floating Tactical Province Navigator Bar */}
      {clusters.length > 0 && (
        <div className="map-province-bar">
          <span className="province-bar-label">PROVINCES:</span>
          {clusters.map(cluster => {
            const isLocal = userLocation && getDistanceKm(userLocation[0], userLocation[1], cluster.center[0], cluster.center[1]) <= 85;
            return (
              <button
                key={cluster.id}
                className={`province-pill-btn ${activeClusterId === cluster.id ? 'active' : ''}`}
                onClick={() => handleFlyToCluster(cluster)}
                title={`Focus on ${cluster.name} frontline`}
              >
                <span className="province-icon">👑</span>
                <span className="province-name">{cluster.name}</span>
                {isLocal && <span className="province-local-tag">NEAR YOU</span>}
                <span className="province-badge">
                  {cluster.mineCount > 0 && <span className="badge-mine">🚩 {cluster.mineCount}</span>}
                  {cluster.enemyCount > 0 && <span className="badge-enemy">⚔️ {cluster.enemyCount}</span>}
                </span>
              </button>
            );
          })}

          <button
            className={`province-pill-btn world-btn ${activeClusterId === 'world' ? 'active' : ''}`}
            onClick={handleFlyToWorld}
            title="Inspect whole realm overview"
          >
            <span className="province-icon">🌐</span>
            <span className="province-name">Realm Overview</span>
          </button>
        </div>
      )}

      {/* Floating Map Theme Selector */}
      <div className="map-theme-toggle-bar">
        <button 
          className={`theme-toggle-btn ${mapTheme === 'satellite' ? 'active' : ''}`}
          onClick={() => handleThemeChange('satellite')}
          title="Real Satellite Aerial Recon"
        >
          🛰️ Satellite
        </button>
        <button 
          className={`theme-toggle-btn ${mapTheme === 'cyber' ? 'active' : ''}`}
          onClick={() => handleThemeChange('cyber')}
          title="Cyberpunk Pitch-Black Dark"
        >
          ⚡ Cyber
        </button>
        <button 
          className={`theme-toggle-btn ${mapTheme === 'topo' ? 'active' : ''}`}
          onClick={() => handleThemeChange('topo')}
          title="Tactical Topographic Elevation"
        >
          🏔️ Topo
        </button>
        <button 
          className={`theme-toggle-btn ${mapTheme === 'midnight' ? 'active' : ''}`}
          onClick={() => handleThemeChange('midnight')}
          title="Midnight Slate Canvas"
        >
          🌑 Slate
        </button>
      </div>

      <MapContainer
        center={centerCoords || defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        tap={true}
        style={{ height: '100%', width: '100%' }}
      >
        {mapTheme === 'satellite' && (
          <React.Fragment key="theme-satellite">
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
          </React.Fragment>
        )}

        {mapTheme === 'cyber' && (
          <TileLayer
            key="theme-cyber"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="cyber-map-tiles"
            maxZoom={19}
          />
        )}

        {mapTheme === 'topo' && (
          <TileLayer
            key="theme-topo"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        {mapTheme === 'midnight' && (
          <TileLayer
            key="theme-midnight"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapAutoCenter
          clusters={clusters}
          userLocation={userLocation}
          activeClusterId={activeClusterId}
          setActiveClusterId={setActiveClusterId}
        />

        <MapNavigationBridge
          targetCommand={targetCommand}
          onCommandExecuted={() => setTargetCommand(null)}
        />

        <RecenterControl
          userLocation={userLocation}
          clusters={clusters}
          onTriggerRecenter={handleTriggerRecenter}
        />

        {/* Live GPS Runner Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={2000}>
            <Popup>
              <div className="territory-popup-content">
                <div className="popup-header">
                  <span className="popup-emoji">🏃</span>
                  <h4>Your Live Recon Position</h4>
                </div>
                <div className="popup-details">
                  <p>Ready to march. Run into bordering grids to establish conquest!</p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render each separate grid cell with its own flag */}
        {territories.map((t, idx) => (
          <TerritoryGrid
            key={`${t.gridId}-${idx}`}
            t={t}
            currentUserId={currentUserId}
            onRename={onRename}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch mine"></span>
          <span>🚩 Your Kingdom (Royal Red)</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch enemy"></span>
          <span>🏴‍☠️ Enemy Territory (Black Skull)</span>
        </div>
      </div>
    </div>
  );
};

export default LiveGridMap;

