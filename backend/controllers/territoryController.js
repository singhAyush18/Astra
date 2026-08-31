const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");

const getAllGrids = async (req, res) => {
    try {
        const grids = await Grid.find({
            status: "claimed"
        }).populate("ruler", "username");

        const formattedGrids = grids.map(grid => ({
            gridId: grid.gridId,
            name: grid.name || null,
            status: grid.status,
            rulerId: grid.ruler?._id || null,
            rulerName: grid.ruler?.username || null,
            claimedAt: grid.claimedAt
        }));

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
}

const getMyTerritories = async (req, res) => {
    try {
        const grids = await Grid.find({
            ruler: req.user.id
        }).populate("ruler", "username");

        const formattedGrids = grids.map(grid => ({
            gridId: grid.gridId,
            name: grid.name || null,
            status: grid.status,
            rulerId: grid.ruler?._id || null,
            rulerName: grid.ruler?.username || null,
            claimedAt: grid.claimedAt
        }));

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
        const targetPoints = CLAIM_THRESHOLD || 500;

        const formatted = unclaimedInfluences.map(inf => {
            const gridDoc = inf.gridId;
            const gridCode = inf.gridCode || gridDoc?.gridId || "Unknown Sector";
            const pointsNeeded = Math.max(0, targetPoints - inf.influence);

            return {
                gridCode,
                name: gridDoc?.name || null,
                influence: inf.influence,
                targetPoints,
                pointsNeeded,
                progressPercentage: Math.min(99, Math.round((inf.influence / targetPoints) * 100)),
                totalDistance: Number((inf.totalDistance || 0).toFixed(2)),
                totalRuns: inf.totalRuns || 1,
                status: gridDoc?.status || "unclaimed",
                currentRuler: (gridDoc?.ruler?.username) || "Unclaimed Wildland"
            };
        });

        res.status(200).json({
            success: true,
            message: "Top unclaimed conquests retrieved",
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
