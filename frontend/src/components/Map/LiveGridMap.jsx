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

// Create custom Castle marker icon for individual grid cells
// Self-owned: Imperial Golden Citadel with glowing gatehouse and Royal Compass Star
// Enemy / Warlord: Faction-tinted Dark Stone Fortress with glowing arcane portcullis & faction insignia
const createGridCastleIcon = (isMine, name = '', botPersona = null) => {
  const factionId = botPersona?.faction || (isMine ? 'mine' : 'enemy');
  const enemyColor = botPersona?.color || '#ff3366';
  const iconId = `castle-${isMine ? 'mine' : 'enemy'}-${factionId}-${Math.abs((name || '').length)}`;

  // Colors & Gradients
  const wallStroke = isMine ? '#ffd700' : (botPersona ? enemyColor : '#ff3366');
  const gateGlowColor = isMine 
    ? '#ffd700' 
    : (botPersona?.faction === 'obsidian' ? '#ff1744' 
      : (botPersona?.faction === 'zephyr' ? '#00f2fe' 
      : (botPersona?.faction === 'iron_dominion' ? '#c084fc' : '#ff4d4d')));
  
  const keepRoofFill = isMine 
    ? `url(#playerRoofGrad-${iconId})` 
    : (botPersona ? enemyColor : '#7f1d1d');

  return L.divIcon({
    className: 'grid-castle-icon-container',
    html: `
      <div class="grid-castle-wrapper ${isMine ? 'castle-mine' : 'castle-enemy'}" title="${name || (isMine ? 'Your Citadel' : (botPersona ? `${botPersona.title} Stronghold` : 'Enemy Fortress'))}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="42" height="42" class="grid-castle-svg">
          <defs>
            <linearGradient id="wallGrad-${iconId}" x1="0" y1="0" x2="1" y2="1">
              ${isMine ? `
                <stop offset="0%" stop-color="#ffe259" />
                <stop offset="40%" stop-color="#ffa751" />
                <stop offset="100%" stop-color="#8a5300" />
              ` : `
                <stop offset="0%" stop-color="#2a2e39" />
                <stop offset="50%" stop-color="#181c24" />
                <stop offset="100%" stop-color="#0b0e14" />
              `}
            </linearGradient>

            <linearGradient id="keepGrad-${iconId}" x1="0" y1="0" x2="0" y2="1">
              ${isMine ? `
                <stop offset="0%" stop-color="#fff099" />
                <stop offset="45%" stop-color="#ffd700" />
                <stop offset="100%" stop-color="#996515" />
              ` : `
                <stop offset="0%" stop-color="#363b48" />
                <stop offset="50%" stop-color="#1f232b" />
                <stop offset="100%" stop-color="#101217" />
              `}
            </linearGradient>

            <linearGradient id="playerRoofGrad-${iconId}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#940000" />
              <stop offset="50%" stop-color="#dc2626" />
              <stop offset="100%" stop-color="#5a0000" />
            </linearGradient>

            <radialGradient id="gateGlow-${iconId}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="50%" stop-color="${gateGlowColor}" />
              <stop offset="100%" stop-color="${isMine ? '#8a5300' : '#050505'}" />
            </radialGradient>

            <filter id="castleShadow-${iconId}" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="rgba(0,0,0,0.85)" />
            </filter>
          </defs>

          <!-- Ground Base Shadow -->
          <ellipse cx="24" cy="45" rx="19" ry="3.2" fill="rgba(0,0,0,0.65)" />

          <g filter="url(#castleShadow-${iconId})">
            <!-- Foundation Stone Plinth -->
            <polygon points="5,44 43,44 41,41 7,41" fill="${isMine ? '#422800' : '#11141a'}" stroke="${wallStroke}" stroke-width="0.6" />

            <!-- Left Bastion Tower -->
            <rect x="6" y="16" width="9" height="25" rx="1" fill="url(#wallGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.65" />
            <!-- Left Battlements -->
            <polygon points="5,16 5,11 8,11 8,13 10,13 10,11 13,11 13,13 16,13 16,16" fill="url(#wallGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.65" />
            <!-- Left Arrow Slit Windows -->
            <line x1="10.5" y1="20" x2="10.5" y2="25" stroke="${gateGlowColor}" stroke-width="1.3" stroke-linecap="round" />
            <line x1="10.5" y1="29" x2="10.5" y2="34" stroke="${gateGlowColor}" stroke-width="1.3" stroke-linecap="round" />

            <!-- Right Bastion Tower -->
            <rect x="33" y="16" width="9" height="25" rx="1" fill="url(#wallGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.65" />
            <!-- Right Battlements -->
            <polygon points="32,16 32,11 35,11 35,13 37,13 37,11 40,11 40,13 43,13 43,16" fill="url(#wallGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.65" />
            <!-- Right Arrow Slit Windows -->
            <line x1="37.5" y1="20" x2="37.5" y2="25" stroke="${gateGlowColor}" stroke-width="1.3" stroke-linecap="round" />
            <line x1="37.5" y1="29" x2="37.5" y2="34" stroke="${gateGlowColor}" stroke-width="1.3" stroke-linecap="round" />

            <!-- Curtain Wall connecting towers -->
            <rect x="14" y="24" width="20" height="17" fill="url(#wallGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.6" />

            <!-- Central Keep (Taller Donjon) -->
            <rect x="16" y="10" width="16" height="21" rx="1" fill="url(#keepGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.75" />
            <!-- Central Keep Crenellations -->
            <polygon points="15,10 15,5.5 18,5.5 18,7.5 21,7.5 21,5.5 27,5.5 27,7.5 30,7.5 30,5.5 33,5.5 33,10" fill="url(#keepGrad-${iconId})" stroke="${wallStroke}" stroke-width="0.75" />

            <!-- Grand Central Spire / Spikes -->
            <polygon points="21,5.5 24,0.5 27,5.5" fill="${keepRoofFill}" stroke="${wallStroke}" stroke-width="0.6" />

            ${isMine ? `
              <!-- Imperial Crown Star Sigil -->
              <circle cx="24" cy="0.5" r="1.5" fill="#ffffff" stroke="#ffd700" stroke-width="0.6" />
              <!-- Rose Window -->
              <circle cx="24" cy="14" r="2.2" fill="#3a2200" stroke="#ffd700" stroke-width="0.7" />
              <circle cx="24" cy="14" r="1.2" fill="#fffbcf" />
            ` : `
              <!-- Faction Emblem on Keep -->
              <circle cx="24" cy="14" r="2.4" fill="#0b0e14" stroke="${wallStroke}" stroke-width="0.7" />
              <circle cx="24" cy="14" r="1.3" fill="${gateGlowColor}" />
            `}

            <!-- Arched Gatehouse Entrance -->
            <path d="M 19 41 L 19 28 C 19 24.5, 29 24.5, 29 28 L 29 41 Z" fill="url(#gateGlow-${iconId})" stroke="${wallStroke}" stroke-width="0.8" />

            <!-- Heavy Iron Portcullis Grate -->
            <line x1="21.5" y1="26" x2="21.5" y2="41" stroke="${isMine ? '#3d2500' : '#080a0e'}" stroke-width="0.8" />
            <line x1="24" y1="25" x2="24" y2="41" stroke="${isMine ? '#3d2500' : '#080a0e'}" stroke-width="0.8" />
            <line x1="26.5" y1="26" x2="26.5" y2="41" stroke="${isMine ? '#3d2500' : '#080a0e'}" stroke-width="0.8" />
            <line x1="19" y1="32" x2="29" y2="32" stroke="${isMine ? '#3d2500' : '#080a0e'}" stroke-width="0.8" />
            <line x1="19" y1="36" x2="29" y2="36" stroke="${isMine ? '#3d2500' : '#080a0e'}" stroke-width="0.8" />
          </g>
        </svg>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 41],
    popupAnchor: [0, -38]
  });
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

// Smart GPS-aware Battlefield Camera: Always focuses on the user's real-time position
const MapUserFocus = ({ userLocation, centerCoords, territories, currentUserId }) => {
  const map = useMap();
  const hasFocusedUserRef = React.useRef(false);

  // When live GPS is acquired, immediately fly directly to user's location
  useEffect(() => {
    if (userLocation && !hasFocusedUserRef.current) {
      map.flyTo(userLocation, 15, { animate: true, duration: 1.2 });
      hasFocusedUserRef.current = true;
    }
  }, [userLocation, map]);

  // Fallback before GPS arrives or if geolocation permission is denied
  useEffect(() => {
    if (userLocation || hasFocusedUserRef.current) return;

    if (centerCoords) {
      map.setView(centerCoords, 14);
      return;
    }

    const myTerritories = territories?.filter(t => t.rulerId === currentUserId) || [];
    const target = myTerritories[0] || territories?.[0];
    if (target) {
      const bounds = getGridBounds(target.gridId);
      const center = getGridCenter(bounds);
      if (center) {
        map.setView(center, 14);
      }
    }
  }, [centerCoords, territories, currentUserId, map, userLocation]);

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
const RecenterControl = ({ onTriggerRecenter }) => {
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
        title="Recenter to Your Live Position"
      >
        <span className="recenter-icon">🎯</span>
        <span className="recenter-text">Recenter</span>
      </button>
    </div>
  );
};

// Single Separate Territory Grid Cell Component
const TerritoryGrid = ({ t, currentUserId, onRename, onUpdateFaction }) => {
  const map = useMap();
  const isMine = t.rulerId === currentUserId;
  const castleIcon = useMemo(() => createGridCastleIcon(isMine, t.name, t.botPersona), [isMine, t.name, t.botPersona]);
  const bounds = getGridBounds(t.gridId);
  const center = bounds ? getGridCenter(bounds) : null;

  const handleZoomToTerritory = () => {
    if (center) {
      map.flyTo(center, 16, { animate: true, duration: 1.0 });
    }
  };

  if (!bounds) return null;

  const rulerInfluence = t.rulerInfluence || t.influence || 0;
  const userInfluence = t.userInfluence || 0;
  const targetInfluence = Math.max(rulerInfluence, 500);
  const dethroneProgress = Math.min(100, Math.round((userInfluence / targetInfluence) * 100));
  const xpNeeded = Math.max(0, targetInfluence - userInfluence);

  const popupContent = (
    <div className="territory-popup-content">
      <div className="popup-header">
        <span className="popup-emoji">{isMine ? '🏰' : (t.botPersona?.avatar || '🏯')}</span>
        <h4>{t.name || (isMine ? 'Your Citadel' : 'Rival Stronghold')}</h4>
      </div>
      <div className="popup-details">
        <p><strong>Grid:</strong> {t.gridId}</p>
        <p>
          <strong>Ruler:</strong> {t.rulerName || 'Unknown'}
        </p>
        <p>
          <strong>Faction:</strong>{' '}
          <span style={{ color: isMine ? '#ffd700' : (t.botPersona?.color || '#38bdf8'), fontWeight: 'bold' }}>
            {t.rulerFaction || (t.botPersona?.title ? `${t.botPersona.title} (${(t.botPersona.faction || '').toUpperCase()})` : 'Imperial Vanguard')}
          </span>
        </p>
        {(t.rulerMotto || t.botPersona?.taunt) && (
          <p 
            className="popup-realm-motto" 
            style={{ 
              borderLeftColor: isMine ? '#ffd700' : (t.botPersona?.color || '#38bdf8'),
              color: isMine ? '#fef08a' : '#e2e8f0'
            }}
          >
            "{t.rulerMotto || t.botPersona?.taunt}"
          </p>
        )}
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

        {isMine && onUpdateFaction && (
          <button 
            className="rename-btn"
            style={{ marginTop: '6px' }}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateFaction();
            }}
          >
            ⚔️ Set Realm Faction & Motto
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
          color: isMine ? '#ffd700' : (t.botPersona?.color || '#ff3366'),
          weight: isMine ? 2.5 : 1.8,
          fillColor: isMine ? '#ffd700' : (t.botPersona?.color || '#ff3366'),
          fillOpacity: isMine ? 0.3 : 0.22,
          dashArray: isMine ? null : '6 4',
          className: isMine ? 'neon-kingdom-grid' : 'neon-rival-grid',
        }}
      >
        <Popup>{popupContent}</Popup>
      </Rectangle>

      {/* Castle marker at center of each grid with click-to-zoom and Crown Z-Index Priority */}
      {center && (
        <Marker
          position={center}
          icon={castleIcon}
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

const LiveGridMap = ({ territories, currentUserId, centerCoords, onRename, onUpdateFaction }) => {
  const defaultCenter = [28.6139, 77.2090]; // Default to Delhi
  const [mapTheme, setMapTheme] = useState(() => {
    const saved = localStorage.getItem('astra_map_theme');
    return (saved === 'satellite' || saved === 'slate') ? saved : 'slate';
  });
  const [userLocation, setUserLocation] = useState(null);
  const [targetCommand, setTargetCommand] = useState(null);

  const userLocationIcon = useMemo(() => createUserLocationIcon(), []);

  // Fetch real-time user GPS position on mount and keep updated
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Fast initial fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.warn('Geolocation initial fix failed:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    // Continuous watch for movement
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleThemeChange = (theme) => {
    setMapTheme(theme);
    localStorage.setItem('astra_map_theme', theme);
  };

  const handleTriggerRecenter = () => {
    if (userLocation) {
      setTargetCommand({
        type: 'point',
        coords: userLocation,
        zoom: 15.5,
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setTargetCommand({
            type: 'point',
            coords: loc,
            zoom: 15.5,
          });
        },
        () => {
          alert('Unable to get your live location. Please check browser location permissions.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div className="live-grid-map-container">

      {/* Floating Map Theme Selector */}
      <div className="map-theme-toggle-bar">
        <button 
          className={`theme-toggle-btn ${mapTheme === 'slate' ? 'active' : ''}`}
          onClick={() => handleThemeChange('slate')}
          title="Dark Slate Tactical Canvas (Default)"
        >
          🌑 Slate
        </button>
        <button 
          className={`theme-toggle-btn ${mapTheme === 'satellite' ? 'active' : ''}`}
          onClick={() => handleThemeChange('satellite')}
          title="Real Satellite Aerial Recon"
        >
          🛰️ Satellite
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

        {mapTheme === 'slate' && (
          <TileLayer
            key="theme-slate"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapUserFocus
          userLocation={userLocation}
          centerCoords={centerCoords}
          territories={territories}
          currentUserId={currentUserId}
        />

        <MapNavigationBridge
          targetCommand={targetCommand}
          onCommandExecuted={() => setTargetCommand(null)}
        />

        <RecenterControl
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

        {/* Render each separate grid cell with its own castle */}
        {territories.map((t, idx) => (
          <TerritoryGrid
            key={`${t.gridId}-${idx}`}
            t={t}
            currentUserId={currentUserId}
            onRename={onRename}
            onUpdateFaction={onUpdateFaction}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch mine"></span>
          <span>🏰 Your Citadel (Royal Gold)</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch enemy"></span>
          <span>🏯 Rival Stronghold (Obsidian / Zephyr / Dominion)</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch wildland"></span>
          <span>🌲 Unclaimed Wildlands</span>
        </div>
      </div>
    </div>
  );
};

export default LiveGridMap;

