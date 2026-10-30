// Pre-defined AI Phantom Warlord Factions and Personas for Astra: Stride Wars

const FACTIONS = {
    obsidian: {
        id: 'obsidian',
        name: 'The Obsidian Syndicate',
        color: '#e11d48', // Crimson Red
        sigil: '🛡️',
        description: 'Relentless endurance warlords holding fortress sectors with heavy defense.'
    },
    zephyr: {
        id: 'zephyr',
        name: 'Vanguard Zephyr',
        color: '#06b6d4', // Electric Cyan
        sigil: '⚡',
        description: 'High-cadence vanguard scouts controlling perimeter sprint sectors.'
    },
    iron_dominion: {
        id: 'iron_dominion',
        name: 'The Iron Dominion',
        color: '#a855f7', // Imperial Purple
        sigil: '👑',
        description: 'Imperial conquerors occupying expansive territorial garrison grids.'
    }
};

const PHANTOM_WARLORDS = [
    // ── Obsidian Syndicate ──
    {
        username: 'Commander_Vane',
        email: 'commander_vane@phantom.astra.internal',
        title: 'Iron Sentinel',
        faction: 'obsidian',
        color: '#e11d48',
        avatar: '🛡️',
        defaultInfluence: 620,
        paceCategory: '5:15 /km',
        taunt: 'This ground was forged in iron. You will not pass.'
    },
    {
        username: 'Warlord_Kaelen',
        email: 'warlord_kaelen@phantom.astra.internal',
        title: 'Ashen Vanguard',
        faction: 'obsidian',
        color: '#e11d48',
        avatar: '⚔️',
        defaultInfluence: 750,
        paceCategory: '5:00 /km',
        taunt: 'Only blood and sweat claim this dominion.'
    },
    {
        username: 'Archon_Malakor',
        email: 'archon_malakor@phantom.astra.internal',
        title: 'Dread Warlord',
        faction: 'obsidian',
        color: '#e11d48',
        avatar: '👑',
        defaultInfluence: 880,
        paceCategory: '4:45 /km',
        taunt: 'My fortress stands undefeated. Prove your worth.'
    },

    // ── Vanguard Zephyr ──
    {
        username: 'Zephyr_Nyx',
        email: 'zephyr_nyx@phantom.astra.internal',
        title: 'Gale Strider',
        faction: 'zephyr',
        color: '#06b6d4',
        avatar: '⚡',
        defaultInfluence: 580,
        paceCategory: '4:30 /km',
        taunt: 'Try to keep up, ground-crawler.'
    },
    {
        username: 'Scout_Valen',
        email: 'scout_valen@phantom.astra.internal',
        title: 'Storm Runner',
        faction: 'zephyr',
        color: '#06b6d4',
        avatar: '🏹',
        defaultInfluence: 650,
        paceCategory: '4:20 /km',
        taunt: 'The wind answers only to the swift.'
    },
    {
        username: 'Aero_Talia',
        email: 'aero_talia@phantom.astra.internal',
        title: 'Tempest Blade',
        faction: 'zephyr',
        color: '#06b6d4',
        avatar: '🌪️',
        defaultInfluence: 820,
        paceCategory: '4:10 /km',
        taunt: "You'll feel my draft as I take your sector."
    },

    // ── Iron Dominion ──
    {
        username: 'Centurion_Drax',
        email: 'centurion_drax@phantom.astra.internal',
        title: 'Legion Champion',
        faction: 'iron_dominion',
        color: '#a855f7',
        avatar: '🦁',
        defaultInfluence: 600,
        paceCategory: '5:20 /km',
        taunt: 'The Legion bows to no solitary runner.'
    },
    {
        username: 'Praetor_Solus',
        email: 'praetor_solus@phantom.astra.internal',
        title: 'Imperial Warden',
        faction: 'iron_dominion',
        color: '#a855f7',
        avatar: '🦅',
        defaultInfluence: 720,
        paceCategory: '5:05 /km',
        taunt: 'Every stone here belongs to the Dominion.'
    },
    {
        username: 'Imperator_Althea',
        email: 'imperator_althea@phantom.astra.internal',
        title: 'Sovereign of Iron',
        faction: 'iron_dominion',
        color: '#a855f7',
        avatar: '🏆',
        defaultInfluence: 900,
        paceCategory: '4:50 /km',
        taunt: 'Bow before the throne of iron.'
    }
];

module.exports = {
    FACTIONS,
    PHANTOM_WARLORDS
};
