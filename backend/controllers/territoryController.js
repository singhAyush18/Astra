const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");

const getAllGrids = async (req, res) => {
    try {
        const grids = await Grid.find({
            status: "claimed"
        }).populate("ruler", "username");

        const formattedGrids = grids.map(grid => ({
            gridId: grid.gridId,
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

        const territories = await Grid.find({
            ruler: req.user.id
        });

        res.status(200).json({
            success: true,
            message: "User territories retrieved",
            data: {
                count: territories.length,
                territories,
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

module.exports = {
    getAllGrids,
    getGridDetails,
    getMyTerritories,
}
