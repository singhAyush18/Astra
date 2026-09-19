export const RANKS_CONFIG = [
  {
    id: 'padatik',
    name: 'Padatik',
    shortName: 'Padatik',
    title: 'Scout Vanguard',
    levelMin: 1,
    levelMax: 4,
    minKm: 0,
    maxKm: 50,
    xpRange: '0–100 XP',
    rangeLabel: 'Level 1–4',
    icon: '🛡️',
    color: '#c5a059',
    glow: 'rgba(197, 160, 89, 0.45)',
    relic: 'Bronze Scout Shield & Stride Greaves',
    description: 'Frontline vanguard scout taking their first steps onto the proving grounds.',
    perks: ['Base GPS Grid Claiming', 'Live Run Telemetry', 'Clan Enlistment Access']
  },
  {
    id: 'senapati',
    name: 'Senapati',
    shortName: 'Senapati',
    title: 'Battle Commander',
    levelMin: 5,
    levelMax: 9,
    minKm: 50,
    maxKm: 150,
    xpRange: '100–500 XP',
    rangeLabel: 'Level 5–9',
    icon: '⚔️',
    color: '#8395a7',
    glow: 'rgba(131, 149, 167, 0.45)',
    relic: 'Commander War Blade & Crested Galea',
    description: 'Disciplined battlefield commander leading territory assaults with strategic precision.',
    perks: ['1.1x Grid Influence Multiplier', 'Custom War Banner Colors', 'Territory Defense Buff']
  },
  {
    id: 'vayu',
    name: 'Vayu',
    shortName: 'Vayu',
    title: 'Wind Vanguard',
    levelMin: 10,
    levelMax: 19,
    minKm: 150,
    maxKm: 350,
    xpRange: '500–1.5K XP',
    rangeLabel: 'Level 10–19',
    icon: '🦅',
    color: '#d4af37',
    glow: 'rgba(212, 175, 55, 0.5)',
    relic: 'Wind Vanguard Cloak & Garud Crest',
    description: 'Swift tempest runner commanding extensive territorial sectors across the realm.',
    perks: ['Rapid Territory Conquest Rate', 'Realm Broadcast Shouts', '1.15x High Pace Multiplier']
  },
  {
    id: 'agni',
    name: 'Agni',
    shortName: 'Agni',
    title: 'Flame Champion',
    levelMin: 20,
    levelMax: 34,
    minKm: 350,
    maxKm: 750,
    xpRange: '1.5K–5K XP',
    rangeLabel: 'Level 20–34',
    icon: '🔥',
    color: '#e74c3c',
    glow: 'rgba(231, 76, 60, 0.6)',
    relic: 'Surya Flame Lance & Gilded Armor',
    description: 'Fierce warrior warlord blazing through disputed borders and conquering rival keeps.',
    perks: ['1.25x Grid Defense Shield', 'Aura Crest on Leaderboards', 'Warhorn Rally Ability']
  },
  {
    id: 'maharaj',
    name: 'Maharaj',
    shortName: 'Maharaj',
    title: 'Sovereign Ruler',
    levelMin: 35,
    levelMax: 999,
    minKm: 750,
    maxKm: Infinity,
    xpRange: '5K+ XP',
    rangeLabel: 'Level 35+',
    icon: '👑',
    color: '#f1c40f',
    glow: 'rgba(241, 196, 15, 0.8)',
    relic: 'Imperial Solar Crown & Royal Scepter',
    description: 'Supreme sovereign ruler whose legacy is immortalized across the kingdoms of Astra.',
    perks: ['Permanent Throne Territory Claim', 'Sovereign Crown Glow', 'Hall of Kings Immortality']
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

