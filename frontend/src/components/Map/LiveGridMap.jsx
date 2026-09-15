import React, { useState, useEffect } from 'react';
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

// Custom crown icon for owned territories
const crownIcon = L.divIcon({
  className: 'grid-crown-icon',
  html: `<div class="crown-marker">👑</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Sword icon for enemy territories
const swordIcon = L.divIcon({
  className: 'grid-sword-icon',
  html: `<div class="sword-marker">⚔️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

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
          return true; // Successfully bounded to territories
        }
      }
      return false; // No territories to bound to
    }

    // Try to fit to territories first
    const bounded = fitToTerritories();

    // Only fallback to user location if there are no territories to show
    if (!bounded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        },
        () => {}, // Ignore errors
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

// Single Territory component with smooth click-to-zoom
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

  const rulerInfluence = t.rulerInfluence || t.influence || 0;
  const userInfluence = t.userInfluence || 0;
  const targetInfluence = Math.max(rulerInfluence, 500);
  const dethroneProgress = Math.min(100, Math.round((userInfluence / targetInfluence) * 100));
  const xpNeeded = Math.max(0, targetInfluence - userInfluence);

  const popupContent = (
    <div className="territory-popup-content">
      <div className="popup-header">
        <span className="popup-emoji">{isMine ? '👑' : '⚔️'}</span>
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
              <strong>Ruler's Influence:</strong> <span className="ruler-xp">{rulerInfluence.toLocaleString()} XP</span>
            </p>
            <p className="influence-line">
              <strong>Your Influence:</strong> <span className="cyan-xp">{userInfluence.toLocaleString()} XP</span>
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
                <span className="dethrone-hint ready">Dominion within reach!</span>
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
            ✏️ Rename
          </button>
        )}
      </div>
    </div>
  );

  return (
    <React.Fragment>
      {/* Grid rectangle with glow effect and click-to-zoom */}
      <Rectangle
        bounds={bounds}
        eventHandlers={{
          click: handleZoomToTerritory,
        }}
        pathOptions={{
          color: isMine ? '#ffd700' : '#ff3366',
          weight: isMine ? 3 : 2,
          fillColor: isMine ? '#ffd700' : '#ff3366',
          fillOpacity: isMine ? 0.32 : 0.2,
          dashArray: isMine ? null : '6 4',
          className: isMine ? 'neon-kingdom-grid' : 'neon-rival-grid',
        }}
      >
        <Popup>{popupContent}</Popup>
      </Rectangle>

      {/* Crown/Sword marker with click-to-zoom */}
      {center && (
        <Marker
          position={center}
          icon={isMine ? crownIcon : swordIcon}
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
          <span>Your Kingdom</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch enemy"></span>
          <span>Enemy Territory</span>
        </div>
      </div>
    </div>
  );
};

export default LiveGridMap;
