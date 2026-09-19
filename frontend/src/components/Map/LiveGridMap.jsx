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


// Auto-center map on initial load
const MapAutoCenter = ({ territories }) => {
  const map = useMap();

  useEffect(() => {
    function fitToTerritories() {
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
          map.fitBounds([
            [Math.min(...allLats), Math.min(...allLngs)],
            [Math.max(...allLats), Math.max(...allLngs)]
          ], { padding: [50, 50], maxZoom: 15 });
          return true;
        }
      }
      return false;
    }

    const bounded = fitToTerritories();

    if (!bounded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, [territories, map]);

  return null;
};

// Interactive Recenter button inside the map
const RecenterControl = ({ territories, centerCoords }) => {
  const map = useMap();

  const handleRecenter = (e) => {
    e.stopPropagation();
    e.preventDefault();

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
        map.flyToBounds([
          [Math.min(...allLats), Math.min(...allLngs)],
          [Math.max(...allLats), Math.max(...allLngs)]
        ], { padding: [50, 50], duration: 1.0 });
        return;
      }
    }

    if (centerCoords) {
      map.flyTo(centerCoords, 13, { duration: 1.0 });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.0 });
        },
        () => {
          map.flyTo([28.6139, 77.2090], 13, { duration: 1.0 });
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  };

  return (
    <div className="map-recenter-btn-container">
      <button 
        type="button"
        className="map-recenter-btn"
        onClick={handleRecenter}
        title="Recenter Map Overview"
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

      {/* Flag marker at center of each grid with click-to-zoom */}
      {center && (
        <Marker
          position={center}
          icon={flagIcon}
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

  const handleThemeChange = (theme) => {
    setMapTheme(theme);
    localStorage.setItem('astra_map_theme', theme);
  };

  return (
    <div className="live-grid-map-container">
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

        <MapAutoCenter territories={territories} />
        <RecenterControl territories={territories} centerCoords={centerCoords} />

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

