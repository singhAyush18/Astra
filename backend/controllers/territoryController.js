const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");
const User = require("../models/User");
const Run = require("../models/Run");
const { seedPhantomTerritories } = require("../services/phantomService");

const getAllGrids = async (req, res) => {
    try {
        let rawLat = req.query.lat !== undefined ? req.query.lat : req.query.latitude;
        let rawLng = req.query.lng !== undefined ? req.query.lng : req.query.longitude;

        // Automatic fallback: If client hasn't obtained GPS yet, check runner's recent run location!
        if ((!rawLat || !rawLng) && req.user?.id) {
            try {
                const lastRun = await Run.findOne({ userId: req.user.id, status: "completed" })
                    .sort({ createdAt: -1 })
                    .select("path");
                if (lastRun && lastRun.path && lastRun.path.length > 0) {
                    const lastPoint = lastRun.path[lastRun.path.length - 1];
                    if (lastPoint && lastPoint.lat && lastPoint.lng) {
                        rawLat = lastPoint.lat;
                        rawLng = lastPoint.lng;
                    }
                }
            } catch (runErr) {
                console.warn("[TerritoryController] Error checking last run coords:", runErr.message);
            }
        }

        let parsedLat = NaN;
        let parsedLng = NaN;
        if (rawLat !== undefined && rawLng !== undefined && rawLat !== null && rawLng !== null) {
            parsedLat = parseFloat(rawLat);
            parsedLng = parseFloat(rawLng);
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                await seedPhantomTerritories(parsedLat, parsedLng);
            }
        }

        const rawGrids = await Grid.find({
            status: "claimed"
        }).populate("ruler", "username isBot botPersona faction motto");

        // Filter out any orphaned claimed grids whose ruler was deleted
        const grids = rawGrids.filter(grid => grid.ruler && grid.ruler._id);

        // Strict limit: Only 2 to 3 AI warlords appear within the user's local radius
        let activeGrids = grids;
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            const metersPerDegreeLng = 111320 * Math.cos((parsedLat * Math.PI) / 180);
            const pRow = Math.floor((parsedLat * 111320) / 1000);
            const pCol = Math.floor((parsedLng * metersPerDegreeLng) / 1000);

            const humanGrids = grids.filter(g => !g.ruler?.isBot);
            const botGrids = grids.filter(g => Boolean(g.ruler?.isBot));

            const botsWithDistance = botGrids.map(g => {
                const match = g.gridId.match(/R(-?\d+)-C(-?\d+)/);
                if (!match) return { grid: g, dist: Infinity };
                const r = parseInt(match[1], 10);
                const c = parseInt(match[2], 10);
                const distSectors = Math.hypot(r - pRow, c - pCol);
                return { grid: g, dist: distSectors };
            });

            // Keep only the closest 2 to 3 AI bot warlords in this radius (within ~5km)
            const nearbyBots = botsWithDistance
                .filter(b => b.dist <= 5)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 3)
                .map(b => b.grid);

            activeGrids = [...humanGrids, ...nearbyBots];
        } else {
            const humanGrids = grids.filter(g => !g.ruler?.isBot);
            const botGrids = grids.filter(g => Boolean(g.ruler?.isBot)).slice(0, 3);
            activeGrids = [...humanGrids, ...botGrids];
        }

        const gridIds = activeGrids.map(grid => grid._id);
        const currentUserId = req.user?.id ? req.user.id.toString() : null;

        // Fetch all influence records for these grids in a single query
        const influenceRecords = await GridInfluence.find({
            gridId: { $in: gridIds }
        });

        // Map gridId_userId -> influence
        const influenceMap = {};
        for (const rec of influenceRecords) {
            if (rec.gridId && rec.userId) {
                const key = `${rec.gridId.toString()}_${rec.userId.toString()}`;
                influenceMap[key] = rec.influence || 0;
            }
        }

        const formattedGrids = activeGrids.map(grid => {
            const gIdStr = grid._id.toString();
            const rulerIdStr = grid.ruler?._id ? grid.ruler._id.toString() : null;
            const rulerInfluence = rulerIdStr ? (influenceMap[`${gIdStr}_${rulerIdStr}`] || 0) : 0;
            const userInfluence = currentUserId ? (influenceMap[`${gIdStr}_${currentUserId}`] || 0) : 0;

            const rulerFaction = (grid.ruler?.isBot && grid.ruler?.botPersona?.faction)
                ? grid.ruler.botPersona.faction.replace(/_/g, ' ').toUpperCase()
                : (grid.ruler?.faction || 'Imperial Vanguard');

            const rulerMotto = (grid.ruler?.isBot && grid.ruler?.botPersona?.taunt)
                ? grid.ruler.botPersona.taunt
                : (grid.ruler?.motto || 'Glory to the swift and fearless.');

            return {
                gridId: grid.gridId,
                name: grid.name || null,
                status: grid.status,
                rulerId: grid.ruler?._id || null,
                rulerName: grid.ruler?.username || null,
                rulerFaction,
                rulerMotto,
                isBot: Boolean(grid.ruler?.isBot),
                botPersona: grid.ruler?.botPersona || null,
                rulerInfluence,
                userInfluence,
                claimedAt: grid.claimedAt
            };
        });

        res.status(200).json({
            success: true,
            message: "Territories retrieved",
            data: {
                count: formattedGrids.length,
                territories: formattedGrids,
            },
        });

    } catch (error) {
        console.error("Error fetching territories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching territories",
        });
    }
};

const getGridDetails = async (req, res) => {
    try {
        const { gridId } = req.params;

        const grid = await Grid.findOne({
            gridId
        }).populate("ruler", "username isBot botPersona faction motto");

        if (!grid) {
            return res.status(200).json({
                success: true,
                message: "Unclaimed wildland territory",
                data: {
                    gridId,
                    name: null,
                    status: "unclaimed",
                    ruler: null,
                    claimedAt: null,
                    leaderboard: [],
                },
            });
        }

        const leaderboard = await GridInfluence.find({
            gridId: grid._id
        })
            .populate("userId", "username isBot botPersona faction")
            .sort({ influence: -1 });

        res.status(200).json({
            success: true,
            message: "Territory details retrieved",
            data: {
                gridId: grid.gridId,
                name: grid.name || null,
                status: grid.status,
                ruler: grid.ruler
                    ? {
                        id: grid.ruler._id,
                        username: grid.ruler.username,
                        faction: (grid.ruler.isBot && grid.ruler.botPersona?.faction)
                            ? grid.ruler.botPersona.faction.replace(/_/g, ' ').toUpperCase()
                            : (grid.ruler.faction || 'Imperial Vanguard'),
                        motto: (grid.ruler.isBot && grid.ruler.botPersona?.taunt)
                            ? grid.ruler.botPersona.taunt
                            : (grid.ruler.motto || 'Glory to the swift and fearless.'),
                        isBot: Boolean(grid.ruler.isBot),
                        botPersona: grid.ruler.botPersona || null
                    }
                    : null,
                claimedAt: grid.claimedAt,
                leaderboard,
            },
        });

    } catch (error) {
        console.error("Error fetching territory:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching territory",
        });
    }
};

const getMyTerritories = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const grids = await Grid.find({
            ruler: currentUserId
        }).populate("ruler", "username faction motto isBot botPersona");

        const gridIds = grids.map(grid => grid._id);
        const influenceRecords = await GridInfluence.find({
            gridId: { $in: gridIds },
            userId: currentUserId
        });

        const influenceMap = {};
        for (const rec of influenceRecords) {
            if (rec.gridId) {
                influenceMap[rec.gridId.toString()] = rec.influence || 0;
            }
        }

        const formattedGrids = grids.map(grid => {
            const myInfluence = influenceMap[grid._id.toString()] || 0;
            const rulerFaction = (grid.ruler?.isBot && grid.ruler?.botPersona?.faction)
                ? grid.ruler.botPersona.faction.replace(/_/g, ' ').toUpperCase()
                : (grid.ruler?.faction || 'Imperial Vanguard');

            const rulerMotto = (grid.ruler?.isBot && grid.ruler?.botPersona?.taunt)
                ? grid.ruler.botPersona.taunt
                : (grid.ruler?.motto || 'Glory to the swift and fearless.');

            return {
                gridId: grid.gridId,
                name: grid.name || null,
                status: grid.status,
                rulerId: grid.ruler?._id || null,
                rulerName: grid.ruler?.username || null,
                rulerFaction,
                rulerMotto,
                isBot: Boolean(grid.ruler?.isBot),
                botPersona: grid.ruler?.botPersona || null,
                rulerInfluence: myInfluence,
                userInfluence: myInfluence,
                claimedAt: grid.claimedAt
            };
        });

        res.status(200).json({
            success: true,
            message: "User territories retrieved",
            data: {
                count: formattedGrids.length,
                territories: formattedGrids,
            },
        });

    } catch (error) {
        console.error("Error fetching user territories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching user territories",
        });
    }
};

const nameTerritory = async (req, res) => {
    try {
        const { gridId } = req.params;
        let { name } = req.body;

        const grid = await Grid.findOne({ gridId });

        if (!grid) {
            return res.status(404).json({
                success: false,
                message: "Territory not found",
            });
        }

        // Verify the requester is the actual ruler
        if (!grid.ruler || grid.ruler.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You must be the ruler to name this territory",
            });
        }

        // Clean up the name
        if (name) {
            name = name.trim().substring(0, 30); // Enforce max 30 chars
            if (name.length === 0) name = null;
        } else {
            name = null;
        }

        grid.name = name;
        await grid.save();

        res.status(200).json({
            success: true,
            message: "Territory name updated",
            data: {
                gridId: grid.gridId,
                name: grid.name,
            },
        });

    } catch (error) {
        console.error("Error naming territory:", error);
        res.status(500).json({
            success: false,
            message: "Error updating territory name",
        });
    }
};

const getMyActiveConquests = async (req, res) => {
    try {
        const GridInfluence = require("../models/Gridinfluence");
        const userIdStr = (req.user.id || req.user._id || "").toString();

        const influences = await GridInfluence.find({
            userId: req.user.id
        })
        .populate({
            path: "gridId",
            populate: { path: "ruler", select: "username isBot botPersona" }
        })
        .sort({ influence: -1 });

        // Filter ONLY grids where the user is NOT the ruler and has points > 0
        const unclaimedInfluences = influences.filter(inf => {
            const gridDoc = inf.gridId;
            if (!gridDoc) return false;

            // Extract ruler id safely whether populated object or raw ObjectId
            const rulerId = gridDoc.ruler?._id 
                ? gridDoc.ruler._id.toString() 
                : (gridDoc.ruler ? gridDoc.ruler.toString() : null);

            const isUserRuler = rulerId && (rulerId === userIdStr);

            // Exclude if user is already the ruler
            return !isUserRuler && inf.influence > 0;
        }).slice(0, 5); // Top 5 unclaimed

        const { CLAIM_THRESHOLD } = require("../services/Gridservices");
        const defaultThreshold = CLAIM_THRESHOLD || 500;

        const formatted = await Promise.all(unclaimedInfluences.map(async (inf) => {
            const gridDoc = inf.gridId;
            const gridCode = inf.gridCode || gridDoc?.gridId || "Unknown Sector";
            const isClaimed = Boolean(gridDoc?.ruler);

            let rulerInfluence = 0;
            if (isClaimed && gridDoc.ruler) {
                const rulerId = gridDoc.ruler._id || gridDoc.ruler;
                const rulerInfDoc = await GridInfluence.findOne({
                    gridId: gridDoc._id,
                    userId: rulerId
                });
                rulerInfluence = rulerInfDoc ? rulerInfDoc.influence : 0;
            }

            // Target points: If claimed, challenger must surpass the ruler's influence (rulerInfluence + 1); if unclaimed, need default threshold (500)
            const targetPoints = isClaimed 
                ? Math.max(defaultThreshold, rulerInfluence + 1)
                : defaultThreshold;

            const pointsNeeded = Math.max(0, targetPoints - inf.influence);
            const progressPercentage = Math.min(99, Math.round((inf.influence / targetPoints) * 100));

            return {
                gridCode,
                name: gridDoc?.name || null,
                influence: inf.influence,
                rulerInfluence,
                targetPoints,
                pointsNeeded,
                isClaimed,
                isUsurp: isClaimed,
                progressPercentage,
                totalDistance: Number((inf.totalDistance || 0).toFixed(2)),
                totalRuns: inf.totalRuns || 1,
                status: gridDoc?.status || "unclaimed",
                currentRuler: (gridDoc?.ruler?.username) || "Unclaimed Wildland",
                isBot: Boolean(gridDoc?.ruler?.isBot),
                botPersona: gridDoc?.ruler?.botPersona || null
            };
        }));

        res.status(200).json({
            success: true,
            message: "Top active siege targets retrieved",
            data: {
                count: formatted.length,
                conquests: formatted
            }
        });
    } catch (error) {
        console.error("Error fetching active conquests:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching active conquests"
        });
    }
};

module.exports = {
    getAllGrids,
    getGridDetails,
    getMyTerritories,
    getMyActiveConquests,
    nameTerritory,
};
