const Run = require("../models/Run");
const User = require("../models/User");

const getGamificationstats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if streak has expired (no run yesterday or today)
        if (user.lastRunDate && user.currentStreak > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastRun = new Date(user.lastRunDate);
            lastRun.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((today - lastRun) / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                user.currentStreak = 0;
                await user.save();
            }
        }

        res.status(200).json({
            success: true,
            message: "Gamification stats retrieved",
            data: {
                xp: user.xp,
                level: user.level,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
            },
        });
    } catch (error) {
        console.error("Error fetching gamification stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching gamification stats",
        });
    }
};

const getRunStats = async (req, res) => {
    try {
        const runs = await Run.find({
            userId: req.user.id,
            status: "completed",
        });

        const totalRuns = runs.length;

        const totalDistance = runs.reduce(
            (sum, run) => sum + run.distance,
            0
        );

        const totalDuration = runs.reduce(
            (sum, run) => sum + run.duration,
            0
        );

        const longestRun = runs.reduce(
            (max, run) => Math.max(max, run.distance),
            0
        );

        const avgPace =
            totalDistance > 0
                ? (totalDuration / 60) / totalDistance
                : 0;

        let mins = Math.floor(avgPace);
        let secs = Math.round((avgPace - mins) * 60);

        // Fix 4:60 bug
        if (secs === 60) {
            mins += 1;
            secs = 0;
        }

        const formattedPace =
            `${mins}:${secs.toString().padStart(2, "0")} min/km`;

        res.status(200).json({
            success: true,
            message: "Run stats retrieved",
            data: {
                totalRuns,
                totalDistance,
                totalDuration,
                longestRun,
                avgPace: formattedPace,
            },
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching stats",
        });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Run.find({
            userId: req.user.id,
            status: "completed",
        })
            .sort({ distance: -1, duration: 1 })
            .limit(10);

        res.status(200).json({
            success: true,
            message: "Leaderboard fetched",
            data: { leaderboard },
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching leaderboard",
        });
    }
};

const getGlobalLeaderboard = async (req, res) => {
    try {
        // Aggregate run stats per user
        const runStats = await Run.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: "$userId",
                    totalDistance: { $sum: "$distance" },
                    totalRuns: { $sum: 1 },
                    longestRun: { $max: "$distance" },
                    totalDuration: { $sum: "$duration" },
                },
            },
        ]);

        // Create a map of userId -> run stats
        const statsMap = {};
        runStats.forEach((stat) => {
            statsMap[stat._id.toString()] = stat;
        });

        // Fetch all users sorted by XP
        const users = await User.find({})
            .select("username level xp currentStreak longestStreak")
            .sort({ xp: -1 })
            .limit(50);

        const leaderboard = users.map((user, index) => {
            const stats = statsMap[user._id.toString()] || {};
            return {
                rank: index + 1,
                userId: user._id,
                username: user.username,
                level: user.level,
                xp: user.xp,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                totalDistance: parseFloat((stats.totalDistance || 0).toFixed(2)),
                totalRuns: stats.totalRuns || 0,
                longestRun: parseFloat((stats.longestRun || 0).toFixed(2)),
                totalDuration: stats.totalDuration || 0,
            };
        });

        // Find current user's rank
        const currentUserRank = leaderboard.find(
            (entry) => entry.userId.toString() === req.user.id
        );

        res.status(200).json({
            success: true,
            message: "Global leaderboard fetched",
            data: {
                leaderboard,
                currentUser: currentUserRank || null,
            },
        });
    } catch (error) {
        console.error("Error fetching global leaderboard:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching global leaderboard",
        });
    }
};

module.exports = {
    getRunStats,
    getLeaderboard,
    getGlobalLeaderboard,
    getGamificationstats,
};