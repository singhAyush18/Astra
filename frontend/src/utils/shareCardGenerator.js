// High-Resolution Social Story & Square Card Generator for Astra: Stride Wars
// Pure HTML5 Canvas implementation - zero dependencies, instant rendering, multi-platform support

/**
 * Loads an image from a URL, dataUrl, File, or Blob.
 */
function loadImage(source) {
  return new Promise((resolve) => {
    if (!source) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = null;
    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else if (source instanceof HTMLImageElement) {
      resolve(source);
      return;
    } else {
      resolve(null);
      return;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      console.warn('Failed to load user photo for card:', err);
      resolve(null); // gracefully fallback
    };
  });
}

/**
 * Automatically detects out-and-back routes (where the runner travels out and retraces the same road)
 * and separates the outbound and inbound paths with a smooth perpendicular lane offset.
 * Ensures the two parallel tracks never merge into a single solid line on screen.
 */
/**
 * Detects out-and-back and corridor retracing routes and applies clear visual lane separation.
 * Guarantees a prominent ~18px gap between outbound and inbound tracks on a 1080p canvas,
 * so the parallel lines are unmistakably distinct on mobile screens without blurring together.
 */
function applySmartLaneSeparation(screenPts, desiredOffset = 20.0) {
  const n = screenPts.length;
  if (n < 4) return screenPts;

  // 1. Find the Turnaround Point K (farthest point from the start)
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.hypot(screenPts[i].x - screenPts[0].x, screenPts[i].y - screenPts[0].y);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  // If the run is one-way point-to-point (finish is the farthest point), no return trip
  if (maxIdx >= n - 2 || maxDist < 15) {
    return screenPts;
  }

  // 2. Compute motion tangents and right-side normals for all points
  const rawNormals = [];
  const span = Math.max(1, Math.min(3, Math.floor(n / 12)));

  for (let i = 0; i < n; i++) {
    const pPrev = screenPts[Math.max(0, i - span)];
    const pNext = screenPts[Math.min(n - 1, i + span)];
    const dx = pNext.x - pPrev.x;
    const dy = pNext.y - pPrev.y;
    const len = Math.hypot(dx, dy);

    if (len > 0.0001) {
      // Unit normal to runner's right in screen space
      rawNormals.push({ nx: dy / len, ny: -dx / len });
    } else {
      rawNormals.push(rawNormals[i - 1] || { nx: 0, ny: 1 });
    }
  }

  // 3. Smooth normals with moving average so parallel paths stay clean and parallel
  const smoothedNormals = [];
  const windowSize = Math.max(1, Math.min(3, Math.floor(n / 15)));
  for (let i = 0; i < n; i++) {
    let sumX = 0, sumY = 0;
    for (let w = -windowSize; w <= windowSize; w++) {
      const idx = i + w;
      if (idx >= 0 && idx < n) {
        sumX += rawNormals[idx].nx;
        sumY += rawNormals[idx].ny;
      }
    }
    const avgLen = Math.hypot(sumX, sumY);
    if (avgLen > 0.0001) {
      smoothedNormals.push({ nx: sumX / avgLen, ny: sumY / avgLen });
    } else {
      smoothedNormals.push(rawNormals[i]);
    }
  }

  // 4. Shift outbound to lane 1 (+) and return to lane 2 (- relative to outbound)
  return screenPts.map((pt, i) => ({
    x: pt.x + smoothedNormals[i].nx * desiredOffset,
    y: pt.y + smoothedNormals[i].ny * desiredOffset,
  }));
}

/**
 * Strava-Style Photo Story Overlay (Exact match to athletic story sharing)
 */
export async function generateStravaPhotoCard({
  format = 'story', // 'story' (9:16) | 'square' (1:1)
  photo = null,
  distance = 0,
  duration = 0,
  pace = '0:00',
  date = null,
  path = [],
  routeColor = '#ffd700', // Neon Gold default
  username = '',
  sectorName = '',
  positionOffset = { x: 0, y: 0 },
}) {
  const isStory = format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  // ── 1. Load & Render Background Photo ──
  const userImg = await loadImage(photo);

  if (userImg) {
    // Smart center-crop (object-fit: cover)
    const scale = Math.max(width / userImg.width, height / userImg.height);
    const x = (width - userImg.width * scale) / 2;
    const y = (height - userImg.height * scale) / 2;
    ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
  } else {
    // Elegant athletic dark fallback backdrop
    const darkGrad = ctx.createLinearGradient(0, 0, width, height);
    darkGrad.addColorStop(0, '#0a0d1a');
    darkGrad.addColorStop(0.5, '#12162a');
    darkGrad.addColorStop(1, '#070810');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle atmospheric ambient glows
    const aura = ctx.createRadialGradient(width * 0.5, height * 0.35, 50, width * 0.5, height * 0.35, 600);
    aura.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);
  }

  // ── 2. Subtle Dark Scrim / Vignette for Text Readability ──
  const scrim = ctx.createLinearGradient(0, 0, 0, height);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
  scrim.addColorStop(0.35, 'rgba(0, 0, 0, 0.30)');
  scrim.addColorStop(0.7, 'rgba(0, 0, 0, 0.40)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  // Position offset calculations (allows user to drag stats anywhere on screen)
  const offsetX = (positionOffset?.x || 0) * width;
  const offsetY = (positionOffset?.y || 0) * height;
  const centerX = (width / 2) + offsetX;

  // ── 3. Top Header: Date & Runner Tag (Centered) ──
  const formattedDate = (() => {
    if (!date) {
      return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  const topHeaderY = (isStory ? 130 : 90) + offsetY;
  ctx.textAlign = 'center';

  // Small athletic badge
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 12;
  const runnerTag = username ? `🏃 ${username.toUpperCase()} • ` : '🏃 ';
  ctx.fillText(`${runnerTag}${formattedDate}`, centerX, topHeaderY);
  ctx.shadowBlur = 0;

  // ── 4. Centered Stacked Typography (Distance, Pace, Time) ──
  let cursorY = isStory ? topHeaderY + 110 : topHeaderY + 80;
  const labelSpacing = 42;
  const blockGap = isStory ? 135 : 95;



  // Formatting helpers
  const formattedPace = (() => {
    if (!pace) return '0:00 /km';
    const numeric = String(pace).replace(/min\/km|\/km|min/gi, '').trim();
    return `${numeric || '0:00'} /km`;
  })();

  const stravaDuration = (() => {
    if (!duration) return '0m 0s';
    const m = Math.floor(duration / 60);
    const s = Math.floor(duration % 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m ${s}s`;
    }
    return `${m}m ${s}s`;
  })();

  const metrics = [
    { label: 'Distance', val: `${Number(distance || 0).toFixed(2)} km` },
    { label: 'Pace', val: formattedPace },
    { label: 'Time', val: stravaDuration },
  ];

  metrics.forEach((m) => {
    // Label
    ctx.font = '600 34px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14;
    ctx.fillText(m.label, centerX, cursorY);

    // Value
    ctx.font = '800 96px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 24;
    ctx.fillText(m.val, centerX, cursorY + labelSpacing + 55);

    cursorY += blockGap + labelSpacing;
  });
  ctx.shadowBlur = 0;

  // ── 5. Floating Vector GPS Route Polyline (Centered) ──
  const routeCenterY = isStory ? 1240 : 720;
  const routeBoxW = isStory ? 760 : 560;
  const routeBoxH = isStory ? 600 : 340;

  if (path && path.length > 1) {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    path.forEach((pt) => {
      const lat = Array.isArray(pt) ? pt[0] : pt.lat;
      const lng = Array.isArray(pt) ? pt[1] : pt.lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const midLat = (minLat + maxLat) / 2;
    const latSpan = Math.max(0.0001, maxLat - minLat);
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((midLat * Math.PI) / 180);
    const heightMeters = latSpan * metersPerDegreeLat;
    const lngSpan = Math.max(0.0001, maxLng - minLng);
    const widthMeters = lngSpan * metersPerDegreeLng;

    const scale = Math.min((routeBoxW * 0.85) / widthMeters, (routeBoxH * 0.85) / heightMeters);

    // 1. Project GPS coordinates to initial screen pixels
    const initialScreenPts = path.map((pt) => {
      const lat = Array.isArray(pt) ? pt[0] : (pt?.lat ?? pt?.latitude);
      const lng = Array.isArray(pt) ? pt[1] : (pt?.lng ?? pt?.longitude);
      const px = centerX + (lng - (minLng + maxLng) / 2) * metersPerDegreeLng * scale;
      const py = routeCenterY - (lat - (minLat + maxLat) / 2) * metersPerDegreeLat * scale;
      return { x: px, y: py };
    });

    // 2. Apply smart lane separation for out-and-back tracks (40px centerline gap on 1080p canvas)
    const separatedPts = applySmartLaneSeparation(initialScreenPts, isStory ? 20.0 : 16.0);

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = routeColor;
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = routeColor;
    ctx.shadowBlur = 4;

    let startX = 0, startY = 0, endX = 0, endY = 0;

    separatedPts.forEach((pt, i) => {
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
        startX = pt.x;
        startY = pt.y;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
      if (i === separatedPts.length - 1) {
        endX = pt.x;
        endY = pt.y;
      }
    });
    ctx.stroke();

    // Start Accent Dot (Green with clean glow)
    ctx.beginPath();
    ctx.arc(startX, startY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6;
    ctx.fill();

    // Finish Accent Dot (Glowing Gold Pulse with Ring)
    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fillStyle = routeColor;
    ctx.shadowColor = routeColor;
    ctx.shadowBlur = 8;
    ctx.fill();

    // Subtle beacon ring around finish dot
    ctx.beginPath();
    ctx.arc(endX, endY, 13, 0, Math.PI * 2);
    ctx.strokeStyle = routeColor;
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 4;
    ctx.stroke();

    ctx.restore();
  } else {
    // Aesthetic Fallback Emblem if Stationary / Treadmill
    ctx.save();
    ctx.font = '64px sans-serif';
    ctx.shadowColor = routeColor;
    ctx.shadowBlur = 24;
    ctx.fillText('⚡', centerX, routeCenterY + 16);
    ctx.restore();
  }

  // ── 6. Territory Conquest Pill (Optional Kingdom flavor) ──
  if (sectorName) {
    const pillY = isStory ? height - 280 : height - 160;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(`👑 CONQUERED • ${sectorName.toUpperCase()}`, width / 2, pillY);
    ctx.restore();
  }

  // ── 7. Bold ASTRA Branding Watermark (Bottom Center) ──
  const brandY = isStory ? height - 140 : height - 70;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Inter", "Arial Black", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 24;
  ctx.fillText('ASTRA', width / 2, brandY);

  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
  ctx.shadowBlur = 12;
  ctx.fillText('STRIDE WARS', width / 2, brandY + 28);
  ctx.restore();

  // Return canvas blob & dataUrl
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        blob,
        dataUrl: canvas.toDataURL('image/png'),
      });
    }, 'image/png');
  });
}

/**
 * High-Resolution Fantasy Holo-Card Generator for Astra: Stride Wars
 */
export async function generateConquestCard({
  format = 'story', // 'story' (9:16) | 'square' (1:1)
  username = 'Warrior',
  rankTitle = 'Legionnaire',
  rankIcon = '🛡️',
  level = 1,
  distance = 0,
  duration = 0,
  pace = '0:00',
  calories = 0,
  xp = 0,
  path = [],
  sectorCode = '',
  sectorStatus = '',
}) {
  const isStory = format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D context not supported');

  // ── 1. Deep Space Fantasy Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#060714');
  bgGrad.addColorStop(0.5, '#0b0d24');
  bgGrad.addColorStop(1, '#05060f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // ── 2. Ambient Gold & Cyan Glows ──
  const glowTop = ctx.createRadialGradient(width * 0.5, height * 0.15, 50, width * 0.5, height * 0.15, 600);
  glowTop.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
  glowTop.addColorStop(0.6, 'rgba(212, 175, 55, 0.03)');
  glowTop.addColorStop(1, 'transparent');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  const glowCenter = ctx.createRadialGradient(width * 0.5, isStory ? height * 0.45 : height * 0.5, 30, width * 0.5, isStory ? height * 0.45 : height * 0.5, 500);
  glowCenter.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
  glowCenter.addColorStop(0.7, 'rgba(0, 229, 255, 0.02)');
  glowCenter.addColorStop(1, 'transparent');
  ctx.fillStyle = glowCenter;
  ctx.fillRect(0, 0, width, height);

  // ── 3. Cyber-Medieval Tactical Grid Lines ──
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.06)';
  ctx.lineWidth = 1;
  const gridSize = 90;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // ── 4. Outer Ornate Border ──
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, width - 104, height - 104);

  // Corner Accents
  const drawCorner = (x, y, dx, dy) => {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 24);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 24, y);
    ctx.stroke();
  };
  drawCorner(40, 40, 1, 1);
  drawCorner(width - 40, 40, -1, 1);
  drawCorner(40, height - 40, 1, -1);
  drawCorner(width - 40, height - 40, -1, -1);

  // ── 5. Header: ASTRA: STRIDE WARS Crest ──
  const headerY = isStory ? 150 : 120;
  ctx.textAlign = 'center';

  const titleGrad = ctx.createLinearGradient(width * 0.3, headerY, width * 0.7, headerY);
  titleGrad.addColorStop(0, '#d4af37');
  titleGrad.addColorStop(0.5, '#fff2a8');
  titleGrad.addColorStop(1, '#d4af37');

  ctx.font = 'bold 44px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText('ASTRA : STRIDE WARS', width / 2, headerY);
  ctx.shadowBlur = 0;

  ctx.font = '600 20px "Inter", sans-serif';
  ctx.fillStyle = '#8a8a9e';
  ctx.fillText('REALM CONQUEST TELEMETRY', width / 2, headerY + 36);

  // ── 6. Warrior Profile Badge ──
  const profileY = isStory ? headerY + 110 : headerY + 80;
  ctx.font = 'bold 36px "Cinzel", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`⚔️ ${username.toUpperCase()}`, width / 2, profileY);

  ctx.font = '600 22px "Inter", sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(`${rankIcon} ${rankTitle.toUpperCase()} • LVL ${level}`, width / 2, profileY + 36);

  // ── 7. Centerpiece: GPS Route Visualizer ──
  const mapCenterY = isStory ? profileY + 300 : profileY + 220;
  const mapRadius = isStory ? 200 : 160;

  const mapAura = ctx.createRadialGradient(width / 2, mapCenterY, 30, width / 2, mapCenterY, mapRadius + 40);
  mapAura.addColorStop(0, 'rgba(18, 22, 54, 0.9)');
  mapAura.addColorStop(0.8, 'rgba(10, 12, 30, 0.95)');
  mapAura.addColorStop(1, 'rgba(212, 175, 55, 0.3)');
  ctx.fillStyle = mapAura;
  ctx.beginPath();
  ctx.arc(width / 2, mapCenterY, mapRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (path && path.length > 1) {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    path.forEach((pt) => {
      const lat = Array.isArray(pt) ? pt[0] : pt.lat;
      const lng = Array.isArray(pt) ? pt[1] : pt.lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;
    const scale = (mapRadius * 1.3) / Math.max(latSpan, lngSpan);

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, mapCenterY, mapRadius - 10, 0, Math.PI * 2);
    ctx.clip();

    ctx.beginPath();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 16;

    path.forEach((pt, i) => {
      const lat = Array.isArray(pt) ? pt[0] : pt.lat;
      const lng = Array.isArray(pt) ? pt[1] : pt.lng;
      const x = width / 2 + (lng - (minLng + maxLng) / 2) * scale;
      const y = mapCenterY - (lat - (minLat + maxLat) / 2) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.font = '64px sans-serif';
    ctx.fillText('⚡', width / 2, mapCenterY + 22);
  }

  // ── 8. Hero Distance Display ──
  const distY = isStory ? mapCenterY + mapRadius + 150 : mapCenterY + mapRadius + 110;
  
  const distGrad = ctx.createLinearGradient(width * 0.3, distY, width * 0.7, distY);
  distGrad.addColorStop(0, '#ffd700');
  distGrad.addColorStop(0.5, '#fff9d6');
  distGrad.addColorStop(1, '#ffd700');

  ctx.font = 'bold 120px "Cinzel", "Orbitron", sans-serif';
  ctx.fillStyle = distGrad;
  ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
  ctx.shadowBlur = 30;
  ctx.fillText(Number(distance || 0).toFixed(2), width / 2, distY);
  ctx.shadowBlur = 0;

  ctx.font = '700 32px "Inter", sans-serif';
  ctx.fillStyle = '#a09880';
  ctx.fillText('KILOMETERS CONQUERED', width / 2, distY + 44);

  // ── 9. Secondary Metrics Grid ──
  const formatSecs = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const statsY = isStory ? distY + 140 : distY + 100;
  const statBoxW = (width - 160) / 4;

  const stats = [
    { label: 'DURATION', val: formatSecs(duration) },
    { label: 'PACE', val: `${pace}/km` },
    { label: 'ENERGY', val: `${calories} kcal` },
    { label: 'XP GAIN', val: `+${xp} XP` },
  ];

  stats.forEach((s, idx) => {
    const boxX = 80 + idx * statBoxW + statBoxW / 2;
    ctx.font = 'bold 32px "Orbitron", "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s.val, boxX, statsY);

    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillStyle = '#8a8a9e';
    ctx.fillText(s.label, boxX, statsY + 30);
  });

  // ── 10. Territory Conquest Footer ──
  if (isStory) {
    const footerY = height - 220;
    
    ctx.fillStyle = 'rgba(18, 18, 42, 0.7)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 2;
    const bannerW = width - 160;
    ctx.beginPath();
    ctx.roundRect(80, footerY - 50, bannerW, 90, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 24px "Cinzel", serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`🗺️ SECTOR ${sectorCode || 'ZONE-ALPHA'}`, width / 2, footerY - 14);

    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(sectorStatus || 'Territory Domain Fortified', width / 2, footerY + 18);

    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillStyle = '#6b6360';
    ctx.fillText('ASTRA-STRIDEWARS • CLAIM YOUR GLORY', width / 2, height - 80);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        blob,
        dataUrl: canvas.toDataURL('image/png'),
      });
    }, 'image/png');
  });
}
