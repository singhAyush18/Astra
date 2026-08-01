import React from 'react';
import { MapContainer, TileLayer, Rectangle, Popup, useMap } from 'react-leaflet';
import './LiveGridMap.css';

// Utility to convert Grid ID back to Leaflet bounds
const getGridBounds = (gridId) => {
  if (!gridId) return null;
  const match = gridId.match(/R(-?\d+)-C(-?\d+)/);
  if (!match) return null;

  const row = parseInt(match[1], 10);
  const col = parseInt(match[2], 10);

  const GRID_SIZE_METERS = 500;
  const metersPerDegreeLat = 111320;

  const minLat = (row * GRID_SIZE_METERS) / metersPerDegreeLat;
  const maxLat = ((row + 1) * GRID_SIZE_METERS) / metersPerDegreeLat;

  // Use center of the lat block for lng approximation
  const centerLat = (minLat + maxLat) / 2;
  const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

  const minLng = (col * GRID_SIZE_METERS) / metersPerDegreeLng;
  const maxLng = ((col + 1) * GRID_SIZE_METERS) / metersPerDegreeLng;

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ];
};

// Component to dynamically adjust map view if we have territories
const MapAutoBounds = ({ territories, centerCoords }) => {
  const map = useMap();

  React.useEffect(() => {
    if (centerCoords) {
      map.setView(centerCoords, 14);
      return;
    }

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
        const minLat = Math.min(...allLats);
        const maxLat = Math.max(...allLats);
        const minLng = Math.min(...allLngs);
        const maxLng = Math.max(...allLngs);

        map.fitBounds([
          [minLat, minLng],
          [maxLat, maxLng]
        ], { padding: [20, 20] });
      }
    }
  }, [territories, centerCoords, map]);

  return null;
};

const LiveGridMap = ({ territories, currentUserId, centerCoords }) => {
  const defaultCenter = [40.7128, -74.0060]; // Fallback to NYC if empty
  
  return (
    <div className="live-grid-map-container">
      <MapContainer 
        center={centerCoords || defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="leaflet-tile"
        />
        
        <MapAutoBounds territories={territories} centerCoords={centerCoords} />

        {territories.map((t, idx) => {
          const bounds = getGridBounds(t.gridId);
          if (!bounds) return null;

          const isMine = t.rulerId === currentUserId;
          const color = isMine ? '#d4af37' : '#ff4d4d'; // Gold for mine, Red for others

          return (
            <Rectangle
              key={`${t.gridId}-${idx}`}
              bounds={bounds}
              pathOptions={{ 
                color: color, 
                weight: 2, 
                fillColor: color, 
                fillOpacity: 0.3 
              }}
            >
              <Popup>
                <div className="territory-popup-content">
                  <h4>Grid {t.gridId}</h4>
                  <p><strong>Ruler:</strong> {t.rulerName || 'Unknown'}</p>
                  <p><strong>Claimed:</strong> {new Date(t.claimedAt).toLocaleDateString()}</p>
                </div>
              </Popup>
            </Rectangle>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveGridMap;
