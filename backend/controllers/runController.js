const mongoose = require("mongoose");
const Run = require("../models/Run");
const User = require("../models/User");
const Grid = require("../models/Grid");

const { calculateXP, updateStreak } = require("./gamificationController");
const {
    getGridIdFromCoordinates,
    addInfluenceToGrid,
} = require("../services/Gridservices");

const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const startRun = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lat, lng } = req.body;

        // Validate starting coordinates
        if (
            lat === undefined ||
            lng === undefined ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid starting coordinates (lat, lng) are required",
            });
        }

        const activeRun = await Run.findOne({
            userId,
            status: "active",
        });

        if (activeRun) {
            return res.status(400).json({
                success: false,
                message: "You already have an active run",
                data: { runId: activeRun._id },
            });
        }

        const run = await Run.create({
            userId,
            startTime: new Date(),
            distance: 0,
            path: [{ lat, lng }],
        });

        res.status(201).json({
            success: true,
            message: "Run started",
            data: { run },
        });
    } catch (error) {
        console.error("Error starting run:", error);
        res.status(500).json({
            success: false,
            message: "Error starting run",
        });
    }
};

const getRuns = async (req, res) => {
    try {
        const runs = await Run.find({ userId: req.user.id });

        res.status(200).json({
            success: true,
            message: "Runs retrieved",
            data: { runs },
        });
    } catch (error) {
        console.error("Error retrieving runs:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving runs",
        });
    }
};

const getRunById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid run ID format",
            });
        }

        const run = await Run.findOne({
            _id: id,
            userId: req.user.id,
        });

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Run retrieved",
            data: { run },
        });
    } catch (error) {
        console.error("Error retrieving run:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving run",
        });
    }
};

const endRun = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid run ID format",
            });
        }

        const run = await Run.findOne({
            _id: id,
            userId: req.user.id,
        });

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found",
            });
        }

        if (run.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Run already completed",
            });
        }

        if (run.status === "discarded") {
            return res.status(400).json({
                success: false,
                message: "Run was already discarded",
            });
        }

        run.endTime = new Date();
        run.duration = Math.floor((run.endTime - run.startTime) / 1000);

        const paceInMinutes =
            run.distance > 0 ? run.duration / 60 / run.distance : 0;
        const mins = Math.floor(paceInMinutes);
        const secs = Math.round((paceInMinutes - mins) * 60);
        run.pace = `${mins}:${secs.toString().padStart(2, "0")} min/km`;

        // Short run — discard it so user can start a new one
        if (run.distance < 0.1) {
            run.status = "discarded";
            await run.save();

            return res.status(200).json({
                success: true,
                message: "Run too short — discarded",
                data: { run },
            });
        }

        run.status = "completed";
        await run.save();

        let xpEarned = 0;
        let streakInfo = null;
        let gridUpdate = null;
        let gridId = null;
        let gridRulerId = null;
        let gridRulerName = null;

        const user = await User.findById(run.userId);

        if (user) {
            xpEarned = calculateXP(run.distance, paceInMinutes);
            user.xp += xpEarned;
            user.level = Math.floor(user.xp / 500) + 1;
            await user.save();

            streakInfo = await updateStreak(user._id);

            if (run.path.length > 0) {
                const lastPoint = run.path[run.path.length - 1];
                gridId = getGridIdFromCoordinates(lastPoint.lat, lastPoint.lng);

                gridUpdate = await addInfluenceToGrid(
                    gridId,
                    user._id,
                    xpEarned,
                    run.distance
                );

                // Fetch grid ruler info
                const grid = await Grid.findOne({ gridId });
                if (grid?.ruler) {
                    gridRulerId = grid.ruler;
                    const rulerUser = await User.findById(grid.ruler);
                    gridRulerName = rulerUser ? rulerUser.username : null;
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Run ended",
            data: {
                xpEarned,
                currentStreak: streakInfo?.currentStreak || 0,
                longestStreak: streakInfo?.longestStreak || 0,
                level: user?.level || 1,
                run,
                grid: gridUpdate
                    ? {
                          gridId,
                          influenceAdded: xpEarned,
                          totalInfluence: gridUpdate.influence,
                          totalDistance: gridUpdate.totalDistance,
                          totalRuns: gridUpdate.totalRuns,
                          claimed: !!gridRulerId,
                          rulerId: gridRulerId,
                          rulerName: gridRulerName,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error("Error ending run:", error);
        res.status(500).json({
            success: false,
            message: "Error ending run",
        });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid run ID format",
            });
        }

        if (
            lat === undefined ||
            lng === undefined ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates",
            });
        }

        const run = await Run.findOne({
            _id: id,
            userId: req.user.id,
        });

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found",
            });
        }

        if (run.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Cannot update location for a completed run",
            });
        }

        if (run.status === "discarded") {
            return res.status(400).json({
                success: false,
                message: "Cannot update location for a discarded run",
            });
        }

        const lastPoint = run.path[run.path.length - 1];
        if (lastPoint) {
            const segmentDistance = haversine(
                lastPoint.lat,
                lastPoint.lng,
                lat,
                lng
            );
            if (segmentDistance > 0.005) {
                run.distance += segmentDistance;
            }
        }

        run.path.push({ lat, lng });
        await run.save();

        res.status(200).json({
            success: true,
            message: "Location updated",
            data: {
                distance: run.distance,
                run,
            },
        });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({
            success: false,
            message: "Error updating location",
        });
    }
};

const deleteRun = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid run ID format",
            });
        }

        const run = await Run.findOneAndDelete({
            _id: id,
            userId: req.user.id,
        });

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting run:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting run",
        });
    }
};

module.exports = {
    startRun,
    getRuns,
    getRunById,
    endRun,
    updateLocation,
    deleteRun,
};
