export const RANKS_CONFIG = [
  {
    id: 'recruit',
    name: 'Recruit Legionnaire',
    shortName: 'Recruit',
    levelMin: 1,
    levelMax: 4,
    minKm: 0,
    maxKm: 50,
    rangeLabel: 'Level 1–4',
    icon: '🛡️',
    color: '#54a0ff',
    glow: 'rgba(84, 160, 255, 0.4)',
    relic: 'Bronze Gladius & Scout Boots',
    description: 'Novice scout taking their first steps onto the proving grounds.'
  },
  {
    id: 'centurion',
    name: 'Bronze Centurion',
    shortName: 'Centurion',
    levelMin: 5,
    levelMax: 9,
    minKm: 50,
    maxKm: 150,
    rangeLabel: 'Level 5–9',
    icon: '⚔️',
    color: '#e58e26',
    glow: 'rgba(229, 142, 38, 0.4)',
    relic: 'Centurion Crested Galea Helmet',
    description: 'Disciplined warrior leading squads through enemy borderlines.'
  },
  {
    id: 'legatus',
    name: 'Silver Legatus',
    shortName: 'Legatus',
    levelMin: 10,
    levelMax: 19,
    minKm: 150,
    maxKm: 350,
    rangeLabel: 'Level 10–19',
    icon: '🦅',
    color: '#dcdde1',
    glow: 'rgba(220, 221, 225, 0.4)',
    relic: 'Silver Aquila Standard & Cuirass',
    description: 'Seasoned commander wielding strategic domain control over the realm.'
  },
  {
    id: 'warlord',
    name: 'Gold Warlord',
    shortName: 'Warlord',
    levelMin: 20,
    levelMax: 34,
    minKm: 350,
    maxKm: 750,
    rangeLabel: 'Level 20–34',
    icon: '🦁',
    color: '#f0d060',
    glow: 'rgba(240, 208, 96, 0.5)',
    relic: 'Gilded Sun Armor & Flame Spear',
    description: 'Feared champion capable of conquering entire city districts single-handedly.'
  },
  {
    id: 'emperor',
    name: 'Sovereign Emperor',
    shortName: 'Emperor',
    levelMin: 35,
    levelMax: 999,
    minKm: 750,
    maxKm: Infinity,
    rangeLabel: 'Level 35+',
    icon: '👑',
    color: '#f1c40f',
    glow: 'rgba(241, 196, 15, 0.7)',
    relic: 'Imperial Laurel of the Gods & Solar Cape',
    description: 'Mythic sovereign ruler whose name is permanently etched into the Hall of Conquerors.'
  }
];

export const getRankByLevel = (level = 1) => {
  const lvl = Number(level) || 1;
  if (lvl >= 35) return RANKS_CONFIG[4];
  if (lvl >= 20) return RANKS_CONFIG[3];
  if (lvl >= 10) return RANKS_CONFIG[2];
  if (lvl >= 5) return RANKS_CONFIG[1];
  return RANKS_CONFIG[0];
};

export const getRankTitle = (level = 1) => {
  return getRankByLevel(level).name;
};

export const getRankIcon = (level = 1) => {
  return getRankByLevel(level).icon;
};

export const getRankColor = (level = 1) => {
  return getRankByLevel(level).color;
};
