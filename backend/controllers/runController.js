const mongoose = require("mongoose");
const Run = require("../models/Run");
const User = require("../models/User");
const { generateCoachDebrief } = require("../services/agentService");
const { completeRun } = require("../services/runService");

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

const finalizeRun = async (run) => {
    return await completeRun(run);
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

        const activeRuns = await Run.find({
            userId,
            status: "active",
        });

        if (activeRuns.length > 0) {
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
            let freshRun = null;

            for (const activeRun of activeRuns) {
                const lastUpdated = activeRun.updatedAt || activeRun.startTime;
                if (lastUpdated < thirtyMinsAgo) {
                    // Stale run: auto-finish it
                    await finalizeRun(activeRun);
                } else {
                    // Found a fresh one
                    freshRun = activeRun;
                }
            }

            if (freshRun) {
                // Resume active run
                return res.status(200).json({
                    success: true,
                    message: "Resumed active run",
                    data: { run: freshRun, resumed: true },
                });
            }
            // If all were stale, they are now finished. We continue to create a new run below.
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
        const { duration: frontendDuration, isSimulated } = req.body || {};

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

        const user = await User.findById(req.user.id);
        const result = await completeRun(run, { duration: frontendDuration, user, isSimulated });

        if (result.status === "discarded") {
            return res.status(200).json({
                success: true,
                message: "Run too short — discarded",
                data: { run: result.run },
            });
        }

        // Respond immediately to the client so UI navigation is instantaneous (< 50ms)
        res.status(200).json({
            success: true,
            message: "Run ended",
            data: {
                xpEarned: result.xpEarned,
                currentStreak: result.streakInfo?.currentStreak || 0,
                longestStreak: result.streakInfo?.longestStreak || 0,
                level: result.level,
                run: result.run,
                coachDebrief: result.run.coachDebrief || null,
                grid: result.gridSummary,
                antiCheat: result.antiCheat || result.run.antiCheat,
            },
        });

        // Trigger AI Tactical Coach Debrief in the background
        generateCoachDebrief({
            username: user?.username || "Athlete",
            distance_meters: Math.round(result.run.distance * 1000),
            duration_seconds: result.run.duration,
            pace: result.run.pace,
            current_streak: result.streakInfo?.currentStreak || 0,
        }).then(async (coachDebrief) => {
            if (coachDebrief) {
                result.run.coachDebrief = coachDebrief;
                await result.run.save();
            }
        }).catch((coachErr) => {
            console.error("AI Coach Debrief background generation encountered an error:", coachErr);
        });
    } catch (error) {
        console.error("Error ending run:", error);
        res.status(500).json({
            success: false,
            message: "Error ending run",
        });
    }
};

const generateRunDebrief = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid run ID format",
            });
        }

        const run = await Run.findOne({ _id: id, userId: req.user.id });
        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found",
            });
        }

        // Return cached debrief immediately if already generated in background
        if (run.coachDebrief && run.coachDebrief.headline) {
            return res.status(200).json({
                success: true,
                message: "Coach debrief retrieved",
                data: {
                    coachDebrief: run.coachDebrief,
                    run,
                },
            });
        }

        const user = await User.findById(req.user.id);
        const coachDebrief = await generateCoachDebrief({
            username: user?.username || "Athlete",
            distance_meters: Math.round(run.distance * 1000),
            duration_seconds: run.duration,
            pace: run.pace,
            current_streak: user?.currentStreak || 0,
        });

        if (coachDebrief) {
            run.coachDebrief = coachDebrief;
            await run.save();
        }

        res.status(200).json({
            success: true,
            message: "Coach debrief generated",
            data: {
                coachDebrief,
                run,
            },
        });
    } catch (error) {
        console.error("Error generating coach debrief:", error);
        res.status(500).json({
            success: false,
            message: "Error generating coach debrief",
        });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng, duration } = req.body;

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
                run.path.push({ lat, lng });
            }
        } else {
            run.path.push({ lat, lng });
        }

        if (duration !== undefined) {
            run.duration = duration;
        }

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
    generateRunDebrief,
    updateLocation,
    deleteRun,
};
