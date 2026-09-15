// High-Resolution Social Story & Square Card Generator for Astra: Stride Wars
// Pure HTML5 Canvas implementation - zero dependencies, instant rendering, multi-platform support

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
  coachQuote = '',
}) {
  const isStory = format === 'story';
  const width = isStory ? 1080 : 1080;
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

  // Title Gold Gradient
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

  // Circular Map Aura
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

  // Draw Path if available
  if (path && path.length > 1) {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    path.forEach(([lat, lng]) => {
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

    path.forEach(([lat, lng], i) => {
      const x = width / 2 + (lng - (minLng + maxLng) / 2) * scale;
      const y = mapCenterY - (lat - (minLat + maxLat) / 2) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  } else {
    // Emblem if stationary
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
  ctx.fillText(distance.toFixed(2), width / 2, distY);
  ctx.shadowBlur = 0;

  ctx.font = '700 32px "Inter", sans-serif';
  ctx.fillStyle = '#a09880';
  ctx.fillText('KILOMETERS CONQUERED', width / 2, distY + 44);

  // ── 9. Secondary Metrics Grid (Duration, Pace, Energy, XP) ──
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
    
    // Sector Banner Box
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

    // Branding Footer
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
