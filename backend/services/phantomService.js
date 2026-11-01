const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");
const { PHANTOM_WARLORDS, FACTIONS } = require("../data/phantomWarlords");

const GRID_SIZE_METERS = 1000;
const METERS_PER_DEGREE_LAT = 111320;

/**
 * Ensures all pre-defined Phantom Warlords exist as verified bot users in MongoDB.
 */
async function initPhantomWarlords() {
    try {
        const dummyPasswordHash = await bcrypt.hash("Astra_Phantom_Bot_Pass_2026!", 10);
        let createdCount = 0;

        for (const warlord of PHANTOM_WARLORDS) {
            let user = await User.findOne({
                $or: [{ username: warlord.username }, { email: warlord.email }]
            });

            if (!user) {
                await User.create({
                    username: warlord.username,
                    email: warlord.email,
                    password: dummyPasswordHash,
                    isVerified: true,
                    isBot: true,
                    level: 5,
                    xp: 2500,
                    botPersona: {
                        faction: warlord.faction,
                        title: warlord.title,
                        avatar: warlord.avatar,
                        color: warlord.color,
                        paceCategory: warlord.paceCategory,
                        taunt: warlord.taunt
                    }
                });
                createdCount++;
            } else if (!user.isBot || !user.botPersona?.faction) {
                // Ensure existing bot user has complete persona
                user.isBot = true;
                user.botPersona = {
                    faction: warlord.faction,
                    title: warlord.title,
                    avatar: warlord.avatar,
                    color: warlord.color,
                    paceCategory: warlord.paceCategory,
                    taunt: warlord.taunt
                };
                await user.save();
            }
        }

        if (createdCount > 0) {
            console.log(`[PhantomService] Initialized ${createdCount} new Phantom Warlords.`);
        }
    } catch (err) {
        console.error("[PhantomService] Error initializing Phantom Warlords:", err);
    }
}

/**
 * Deterministically picks a Phantom Warlord based on grid coordinates so adjacent sectors
 * form coherent faction clusters without changing every request.
 */
function pickWarlordForGrid(row, col, warlordUsers) {
    if (!warlordUsers || warlordUsers.length === 0) return null;
    // Simple deterministic hash based on row & col
    const hash = Math.abs((row * 73856093) ^ (col * 19349663));
    return warlordUsers[hash % warlordUsers.length];
}

// Tactical enemy outposts around player borders (1.0 to 1.5 km - directly visible on tactical radar!)
const NEARBY_OUTPOST_OFFSETS = [
    { dr: 0, dc: 1, role: 'outpost' },    // 1.0 km East (Directly adjacent border - visible on right)
    { dr: 1, dc: -1, role: 'outpost' },   // ~1.4 km North-West (Diagonal border - visible top-left)
    { dr: -1, dc: 0, role: 'outpost' },   // 1.0 km South (Directly adjacent border - visible bottom)
    { dr: -1, dc: 1, role: 'outpost' },   // ~1.4 km South-East (Diagonal border - visible bottom-right)
];

// Distant high-level boss citadels for long-run expeditions (3.0 to 4.5 km)
const DISTANT_CITADEL_OFFSETS = [
    { dr: 3, dc: 2, role: 'citadel' },    // ~3.6 km Far North-East (Raid Boss)
    { dr: -3, dc: -2, role: 'citadel' },  // ~3.6 km Far South-West (Raid Boss)
    { dr: 2, dc: -3, role: 'citadel' },   // ~3.6 km Far North-West (Raid Boss)
];

const STRATEGIC_TARGET_OFFSETS = [
    ...NEARBY_OUTPOST_OFFSETS,
    ...DISTANT_CITADEL_OFFSETS
];

/**
 * Seeds sparse strategic enemy outposts and distant boss citadels.
 * Leaves 85%+ of surrounding terrain as pristine Unclaimed Wildlands!
 * Safe & Non-destructive: NEVER overwrites a grid already claimed by a human player!
 */
async function seedPhantomTerritories(centerLat, centerLng) {
    try {
        if (!centerLat || !centerLng) return { seeded: 0 };

        // Fetch active bot users
        const activeBots = await User.find({ isBot: true });
        if (activeBots.length === 0) {
            await initPhantomWarlords();
        }
        const bots = await User.find({ isBot: true });
        if (bots.length === 0) return { seeded: 0 };

        const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
        const centerRow = Math.floor((centerLat * METERS_PER_DEGREE_LAT) / GRID_SIZE_METERS);
        const centerCol = Math.floor((centerLng * metersPerDegreeLng) / GRID_SIZE_METERS);

        // Check if user already has 3 or more warlord targets in their surrounding sector (within ~3km)
        const botIds = bots.map(b => b._id);
        const surroundingGridIds = [];
        for (let dr = -3; dr <= 3; dr++) {
            for (let dc = -3; dc <= 3; dc++) {
                surroundingGridIds.push(`R${centerRow + dr}-C${centerCol + dc}`);
            }
        }
        const existingNearbyBotsCount = await Grid.countDocuments({
            gridId: { $in: surroundingGridIds },
            ruler: { $in: botIds }
        });

        // "only 3-4 enemy grids around new users or users with no enemy in surrounding should be shown"
        // If there are already 3+ warlord grids nearby, preserve the wildlands and do not over-seed!
        if (existingNearbyBotsCount >= 3) {
            return { seeded: 0, reason: "Sufficient enemy presence already in sector" };
        }

        let seededCount = 0;

        for (const target of STRATEGIC_TARGET_OFFSETS) {
            const row = centerRow + target.dr;
            const col = centerCol + target.dc;
            const gridId = `R${row}-C${col}`;

            const existingGrid = await Grid.findOne({ gridId }).populate("ruler");

            // Never overwrite a human-owned territory!
            if (existingGrid && existingGrid.ruler && !existingGrid.ruler.isBot) {
                continue;
            }

            // If already claimed by a phantom bot, leave intact
            if (existingGrid && existingGrid.status === "claimed" && existingGrid.ruler?.isBot) {
                continue;
            }

            const warlord = pickWarlordForGrid(row, col, bots);
            if (!warlord) continue;

            const warlordInfo = PHANTOM_WARLORDS.find(w => w.username === warlord.username) || {};

            const cellCenterLat = ((row + 0.5) * GRID_SIZE_METERS) / METERS_PER_DEGREE_LAT;
            const cellCenterLng = ((col + 0.5) * GRID_SIZE_METERS) / metersPerDegreeLng;

            let targetGrid = existingGrid;
            if (!targetGrid) {
                targetGrid = new Grid({
                    gridId,
                    center: { lat: cellCenterLat, lng: cellCenterLng }
                });
            }

            targetGrid.ruler = warlord._id;
            targetGrid.status = "claimed";
            
            // Name based on strategic role (Outpost vs Citadel)
            const warlordCleanName = warlord.username.replace(/_/g, ' ');
            const suffix = target.role === 'citadel' ? 'Citadel' : 'Outpost';
            targetGrid.name = `${warlordCleanName} ${suffix}`.slice(0, 30);
            targetGrid.claimedAt = targetGrid.claimedAt || new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3));
            await targetGrid.save();

            // Set higher defense influence for distant raid citadels
            const baseInfluence = target.role === 'citadel' 
                ? (warlordInfo.defaultInfluence ? warlordInfo.defaultInfluence + 200 : 850)
                : (warlordInfo.defaultInfluence || 600);

            let influenceRec = await GridInfluence.findOne({
                gridId: targetGrid._id,
                userId: warlord._id
            });

            if (!influenceRec) {
                await GridInfluence.create({
                    gridId: targetGrid._id,
                    gridCode: gridId,
                    userId: warlord._id,
                    influence: baseInfluence,
                    totalDistance: target.role === 'citadel' ? 8.5 : 5.0,
                    totalRuns: target.role === 'citadel' ? 4 : 2
                });
            } else if (influenceRec.influence < baseInfluence) {
                influenceRec.influence = baseInfluence;
                influenceRec.gridCode = gridId;
                await influenceRec.save();
            }

            seededCount++;
        }

        return { seeded: seededCount };
    } catch (err) {
        console.error("[PhantomService] Error seeding phantom territories:", err);
        return { seeded: 0, error: err.message };
    }
}

/**
 * One-time / on-demand cleaner to remove over-seeded bot grids,
 * restoring the vast majority of terrain to pristine open Wildlands.
 */
async function cleanupExcessiveBotTerritories(centerLat, centerLng) {
    try {
        const botUsers = await User.find({ isBot: true }).select("_id");
        const botIds = botUsers.map(b => b._id);

        if (!centerLat || !centerLng) {
            return { deleted: 0 };
        }

        const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
        const centerRow = Math.floor((centerLat * METERS_PER_DEGREE_LAT) / GRID_SIZE_METERS);
        const centerCol = Math.floor((centerLng * metersPerDegreeLng) / GRID_SIZE_METERS);

        // Compute the allowed sparse grid IDs
        const allowedGridIds = new Set(STRATEGIC_TARGET_OFFSETS.map(t => `R${centerRow + t.dr}-C${centerCol + t.dc}`));

        // Find all bot-owned grids in database
        const botGrids = await Grid.find({ ruler: { $in: botIds } });
        let deletedCount = 0;

        for (const g of botGrids) {
            // If this bot grid is NOT in our curated sparse target list, remove it to restore wildland!
            if (!allowedGridIds.has(g.gridId)) {
                await GridInfluence.deleteMany({ gridId: g._id });
                await Grid.deleteOne({ _id: g._id });
                deletedCount++;
            }
        }

        console.log(`[PhantomService] Cleaned up ${deletedCount} excessive bot grids. Wildlands restored.`);
        return { deleted: deletedCount };
    } catch (err) {
        console.error("[PhantomService] Error cleaning excessive bot grids:", err);
        return { deleted: 0 };
    }
}

module.exports = {
    initPhantomWarlords,
    seedPhantomTerritories,
    cleanupExcessiveBotTerritories,
    pickWarlordForGrid
};
