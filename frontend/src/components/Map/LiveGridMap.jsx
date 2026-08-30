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
          ], { padding: [40, 40] });
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
          color: isMine ? '#d4af37' : '#ff4d4d',
          weight: isMine ? 2 : 1.5,
          fillColor: isMine ? '#d4af37' : '#ff4d4d',
          fillOpacity: isMine ? 0.25 : 0.15,
          dashArray: isMine ? null : '6 4',
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

  return (
    <div className="live-grid-map-container">
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
        {/* Dark map tiles — free, sleek dark canvas with no watermark/API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

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
