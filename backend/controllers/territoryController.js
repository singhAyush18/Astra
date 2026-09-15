const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");
const User = require("../models/User");

const getAllGrids = async (req, res) => {
    try {
        const grids = await Grid.find({
            status: "claimed"
        }).populate("ruler", "username");

        const gridIds = grids.map(grid => grid._id);
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

        const formattedGrids = grids.map(grid => {
            const gIdStr = grid._id.toString();
            const rulerIdStr = grid.ruler?._id ? grid.ruler._id.toString() : null;
            const rulerInfluence = rulerIdStr ? (influenceMap[`${gIdStr}_${rulerIdStr}`] || 0) : 0;
            const userInfluence = currentUserId ? (influenceMap[`${gIdStr}_${currentUserId}`] || 0) : 0;

            return {
                gridId: grid.gridId,
                name: grid.name || null,
                status: grid.status,
                rulerId: grid.ruler?._id || null,
                rulerName: grid.ruler?.username || null,
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
        }).populate("ruler", "username");

        if (!grid) {
            return res.status(404).json({
                success: false,
                message: "Territory not found",
            });
        }

        const leaderboard = await GridInfluence.find({
            gridId: grid._id
        })
            .populate("userId", "username")
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
                        username: grid.ruler.username
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
        }).populate("ruler", "username");

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
            return {
                gridId: grid.gridId,
                name: grid.name || null,
                status: grid.status,
                rulerId: grid.ruler?._id || null,
                rulerName: grid.ruler?.username || null,
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
            populate: { path: "ruler", select: "username" }
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
                currentRuler: (gridDoc?.ruler?.username) || "Unclaimed Wildland"
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
